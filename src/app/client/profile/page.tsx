"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Phone,
  Lock,
  CheckCircle2,
  Building,
  MapPin,
  FileText,
  AlertCircle,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";

export default function ClientProfilePage() {
  const { user, client, refreshSession } = useAuth();

  // Profile editable form state
  const [fullName, setFullName] = useState(client?.fullName || "");
  const [businessName, setBusinessName] = useState(client?.businessName || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [kraPin, setKraPin] = useState(client?.kraPin || "");
  const [address, setAddress] = useState(client?.address || "");
  const [city, setCity] = useState(client?.city || "");
  const [county, setCounty] = useState(client?.county || "");
  const [channel, setChannel] = useState(client?.preferredCommunicationChannel || "EMAIL");

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync client profile when loaded
  useEffect(() => {
    if (client) {
      setFullName(client.fullName || "");
      setBusinessName(client.businessName || "");
      setPhone(client.phone || "");
      setKraPin(client.kraPin || "");
      setAddress(client.address || "");
      setCity(client.city || "");
      setCounty(client.county || "");
      setChannel(client.preferredCommunicationChannel || "EMAIL");
    }
  }, [client]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async () => {
      setProfileSuccess(false);
      setProfileError(null);
      return await profileApi.updateProfile({
        fullName: fullName.trim() || undefined,
        businessName: businessName.trim() || null,
        phone: phone.trim() || undefined,
        kraPin: kraPin.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        county: county.trim() || null,
        preferredCommunicationChannel: channel as any,
      });
    },
    onSuccess: () => {
      setProfileSuccess(true);
      refreshSession?.();
      setTimeout(() => setProfileSuccess(false), 4000);
    },
    onError: (err: any) => {
      const parsed = parseApiError(err);
      setProfileError(parsed.message || "Failed to update profile information.");
    },
  });

  // Password update form
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setPwdSuccess(false);
    setPwdError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwdSuccess(true);
      reset();
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err) {
      const parsed = parseApiError(err);
      setPwdError(parsed.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Profile &amp; Statutory Settings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage statutory contact credentials, corporate details, KRA tax credentials, and account security.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. GRID CONTENT */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile / Statutory Contact Form */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Statutory Identity &amp; Corporate Details
          </h3>

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>Profile credentials updated successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-semibold">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Primary contact name"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Company / Registered Business Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme East Africa Ltd (Optional)"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Primary Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">KRA Tax PIN</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                    placeholder="A012345678Z"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">City / Town</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nairobi"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">County</label>
                <input
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="Nairobi County"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Physical Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street / Building / Suite"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Preferred Alert Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700"
              >
                <option value="EMAIL">Email Notifications</option>
                <option value="SMS">SMS Direct Handset</option>
                <option value="IN_APP">In-App Notification Center</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{profileMutation.isPending ? "Saving..." : "Save Profile Details"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Password Settings */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Account Credentials
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Authenticated Email</span>
                <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Access Role</span>
                <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 uppercase font-mono">
                  {user?.role || "CLIENT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Client ID</span>
                <span className="font-mono text-slate-500 font-bold">
                  {client?.clientNumber || "CL-0000"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Change Access Password
            </h3>

            {pwdSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>Password updated successfully!</span>
              </div>
            )}
            {pwdError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-semibold">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("currentPassword")}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
                {errors.currentPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("newPassword")}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
