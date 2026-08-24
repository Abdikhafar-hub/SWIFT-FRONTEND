"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { adminAccountApi } from "@/lib/api/admin-account";
import type { NotificationPreferences } from "@/types";
import {
  User as UserIcon,
  Shield,
  Bell,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Key,
  Mail,
  Building,
  Calendar,
  Clock,
  Briefcase,
  Phone,
  X,
  Lock,
  Save,
  Check,
} from "lucide-react";

type TabType = "profile" | "account" | "security" | "photo" | "notifications";

export default function AdminSettingsPage() {
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    department: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Email Change State
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [pendingEmailState, setPendingEmailState] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<Partial<NotificationPreferences>>({
    emailOperationalAlerts: true,
    emailClientRegistrations: true,
    emailApplicationAlerts: true,
    emailPaymentNotifications: true,
    emailClientActions: true,
    emailSlaAlerts: true,
    emailSecurityNotifications: true,
    inAppOperationalAlerts: true,
    inAppAssignments: true,
    inAppClientActions: true,
    inAppSlaAlerts: true,
  });

  // Synchronize state when user loads or tab changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || (user.fullName ? user.fullName.split(" ")[0] : ""),
        lastName: user.lastName || (user.fullName ? user.fullName.split(" ").slice(1).join(" ") : ""),
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      });
      setPhotoPreview(user.avatarUrl || null);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotificationPreferences();
    }
  }, [activeTab]);

  const fetchNotificationPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await adminAccountApi.getNotificationPreferences();
      setNotifPrefs(prefs);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  // 1. Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminAccountApi.updateProfile(profileForm);
      await refreshSession();
      showSuccess("Profile details updated successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to update profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Password Change
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showError("New password and confirmation password do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showError("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminAccountApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      showSuccess("Password changed successfully. A security confirmation email was dispatched.");
    } catch (err: any) {
      showError(err.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Request Email Change
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      showError("Please enter your current password and target email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminAccountApi.requestEmailChange(emailForm);
      setPendingEmailState(res.pendingEmail);
      setIsOtpModalOpen(true);
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.message || "Failed to initiate email change request.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Verify Email Change OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      showError("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminAccountApi.verifyEmailChange({ code: otpCode });
      await refreshSession();
      setIsOtpModalOpen(false);
      setOtpCode("");
      setEmailForm({ currentPassword: "", newEmail: "" });
      setPendingEmailState(null);
      showSuccess("Primary admin email address updated successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to verify email code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Handle Image Select & Auto-Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mimeType = file.type ? file.type.toLowerCase() : "";
    if (mimeType === "image/jpg" || mimeType === "image/pjpeg") mimeType = "image/jpeg";

    if (!mimeType) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "webp") mimeType = "image/webp";
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      showError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image file size must be less than 5MB.");
      return;
    }

    const targetInput = e.target;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setPhotoPreview(base64Data);

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await adminAccountApi.uploadProfileImage({
          fileName: file.name,
          mimeType,
          base64Data,
        });
        if (res.avatarUrl) {
          setPhotoPreview(res.avatarUrl);
        }
        await refreshSession();
        setSelectedFile(null);
        showSuccess("Profile picture updated and saved successfully.");
      } catch (err: any) {
        showError(err.message || "Failed to upload profile picture.");
      } finally {
        setIsLoading(false);
        if (targetInput) targetInput.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // 7. Remove Photo
  const handleRemovePhoto = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminAccountApi.deleteProfileImage();
      await refreshSession();
      setSelectedFile(null);
      setPhotoPreview(null);
      showSuccess("Profile picture removed successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to remove profile picture.");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Notification Preferences Save
  const handleSaveNotifPrefs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await adminAccountApi.updateNotificationPreferences(notifPrefs);
      setNotifPrefs(updated);
      showSuccess("Notification preferences saved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to save notification preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Operations Admin");
  const displayInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-5 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. PAGE HEADER SECTION (Matching Client UI Style) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            My Profile &amp; Account Settings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your administrative credentials, personal profile, avatar photo, and notification preferences.
          </p>
        </div>
      </div>

      {/* Global Toast / Alert Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 font-semibold shadow-xs animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. ADMIN PROFILE SUMMARY HERO CARD */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {photoPreview || user?.avatarUrl ? (
                <img
                  src={photoPreview || user?.avatarUrl || ""}
                  alt={displayName}
                  className="size-16 rounded-xl object-cover border-2 border-amber-500/30 shadow-sm"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-amber-50 font-bold text-xl text-amber-700 border-2 border-amber-200/80 shadow-sm">
                  {displayInitials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-slate-900 text-amber-400 border border-slate-700 rounded-lg p-1 shadow-sm hover:bg-amber-500 hover:text-slate-900 transition-all cursor-pointer"
                title="Update Profile Photo"
              >
                <Camera className="size-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{displayName}</h2>
                <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 uppercase font-mono flex items-center gap-1">
                  <Shield className="size-3 text-amber-600" /> Operations Admin
                </span>
                {user?.isEmailVerified && (
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400 shrink-0" />
                  {user?.email}
                </span>
                {user?.jobTitle && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-slate-400 shrink-0" />
                    {user.jobTitle} {user.department ? `(${user.department})` : ""}
                  </span>
                )}
                {user?.organization?.name && (
                  <span className="flex items-center gap-1.5">
                    <Building className="size-3.5 text-slate-400 shrink-0" />
                    {user.organization.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-500 font-medium border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-slate-400" /> Joined:{" "}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "N/A"}
            </span>
            {user?.lastLoginAt && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="size-3" /> Active:{" "}
                {new Date(user.lastLoginAt).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABS CONTROL BAR (Compact Pill Style matching Client UI) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex overflow-x-auto gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "profile"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserIcon className="size-3.5" />
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "account"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building className="size-3.5" />
          Account Information
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "security"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shield className="size-3.5" />
          Security &amp; Passwords
        </button>

        <button
          onClick={() => setActiveTab("photo")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "photo"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Camera className="size-3.5" />
          Profile Photo
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "notifications"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Bell className="size-3.5" />
          Notifications
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAB CONTENTS CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* TAB 1: PROFILE DETAILS */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSave} className="space-y-4 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Personal Identity &amp; Designation
            </h3>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="e.g. Abdi"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="e.g. Hassan"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Official Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="e.g. Senior Compliance Officer"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700 block">Department / Operational Unit</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  placeholder="e.g. Case Operations & Registrar Liaison"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ACCOUNT INFORMATION */}
        {activeTab === "account" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              System Identity &amp; Organization Credentials
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Account Unique ID</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[180px]">
                  {user?.id}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Authenticated Email</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">{user?.email}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">System Role</span>
                <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 uppercase font-mono">
                  {user?.role || "ADMIN"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Organization Entity</span>
                <span className="font-bold text-slate-800">
                  {user?.organization?.name || "Swift Doc"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Created Date</span>
                <span className="font-medium text-slate-700">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-KE", { dateStyle: "long" }) : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Last Login Timestamp</span>
                <span className="font-medium text-slate-700">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" }) : "Active Session"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORDS */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Password Change */}
            <form onSubmit={handlePasswordSave} className="space-y-3.5 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Key className="size-4 text-amber-600" /> Change Access Password
              </h3>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
                  Update Password
                </button>
              </div>
            </form>

            {/* Email Address Update Workflow */}
            <form onSubmit={handleRequestEmailChange} className="space-y-3.5 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Mail className="size-4 text-amber-600" /> Update Primary Email Address
              </h3>

              <p className="text-xs text-slate-500 font-medium">
                Changing your primary admin email requires current password verification and a 6-digit OTP confirmation sent to your new email inbox.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={emailForm.currentPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  New Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  placeholder="newadmin@swiftdoc.co.ke"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Request Verification Code
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: PROFILE PHOTO */}
        {activeTab === "photo" && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Profile Photo Management
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="relative shrink-0">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-24 rounded-xl object-cover border-2 border-amber-500/40 shadow-sm"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-xl bg-amber-50 font-bold text-2xl text-amber-700 border-2 border-amber-200">
                    {displayInitials}
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Choose Image File</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Square PNG, JPEG or WebP images under 5MB are recommended.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5">
                    <Camera className="size-3.5 text-amber-400" />
                    Select Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {(photoPreview || user?.avatarUrl) && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={isLoading}
                      className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS PREFERENCES */}
        {activeTab === "notifications" && (
          <div className="space-y-5 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              System Alert &amp; Channel Subscriptions
            </h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-amber-600" /> Email Notifications
                </h4>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailOperationalAlerts ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailOperationalAlerts: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Operational &amp; Telemetry</span>
                      <span className="text-[11px] text-slate-500 font-medium">Uptime &amp; server alerts</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailClientRegistrations ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailClientRegistrations: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">New Client Registrations</span>
                      <span className="text-[11px] text-slate-500 font-medium">Alerts on client onboarding</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailApplicationAlerts ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailApplicationAlerts: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Statutory Filings</span>
                      <span className="text-[11px] text-slate-500 font-medium">New application submissions</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailPaymentNotifications ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailPaymentNotifications: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Payments &amp; Settlement</span>
                      <span className="text-[11px] text-slate-500 font-medium">M-Pesa STK &amp; bank receipts</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailSlaAlerts ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailSlaAlerts: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">SLA Countdown &amp; Breaches</span>
                      <span className="text-[11px] text-slate-500 font-medium">Critical deadline warnings</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailSecurityNotifications ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, emailSecurityNotifications: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Security Notifications</span>
                      <span className="text-[11px] text-slate-500 font-medium">Password &amp; login alerts</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Bell className="size-3.5 text-amber-600" /> In-App Direct Alerts
                </h4>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.inAppOperationalAlerts ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, inAppOperationalAlerts: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Operational Live Banners</span>
                      <span className="text-[11px] text-slate-500 font-medium">Dashboard real-time badges</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 cursor-pointer hover:border-amber-400/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={notifPrefs.inAppAssignments ?? true}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, inAppAssignments: e.target.checked })}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Case Queue Assignments</span>
                      <span className="text-[11px] text-slate-500 font-medium">Direct officer assignments</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSaveNotifPrefs}
                disabled={isLoading}
                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save Notification Preferences
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. EMAIL CHANGE OTP MODAL (Matching Client UI Dialogs) */}
      {/* ------------------------------------------------------------------ */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                <Mail className="size-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Verify New Email Address</h3>
              <p className="text-xs text-slate-500 font-medium">
                We dispatched a 6-digit verification code to <strong>{pendingEmailState}</strong>. Enter it below to complete update:
              </p>
            </div>

            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-xl font-mono font-bold tracking-widest rounded-lg border border-amber-300 bg-slate-50 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Verify &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
