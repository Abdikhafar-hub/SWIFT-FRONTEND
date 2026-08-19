"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Building,
  MapPin,
  FileText,
  AlertCircle,
  Save,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";

export default function ClientProfilePage() {
  const queryClient = useQueryClient();
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
    <PageShell
      eyebrow="CLIENT IDENTITY"
      title="Profile & Statutory Settings"
      description="Manage statutory contact credentials, corporate details, KRA tax credentials, and account security."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile / Statutory Contact Form */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Statutory Identity & Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xs border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Profile credentials updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Full Legal Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Primary contact name"
                  leftAddon={<User className="size-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Company / Registered Business Name</label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme East Africa Ltd (Optional)"
                  leftAddon={<Building className="size-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Primary Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    leftAddon={<Phone className="size-4" />}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">KRA Tax PIN</label>
                  <Input
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                    placeholder="A012345678Z"
                    className="font-mono"
                    leftAddon={<FileText className="size-4" />}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">City / Town</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nairobi"
                    leftAddon={<MapPin className="size-4" />}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">County</label>
                  <Input
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="Nairobi County"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Physical Office Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Building / Suite"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Preferred Alert Channel</label>
                <Select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="text-xs"
                >
                  <option value="EMAIL">Email Notifications</option>
                  <option value="SMS">SMS Direct Handset</option>
                  <option value="IN_APP">In-App Notification Center</option>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => profileMutation.mutate()}
                  isLoading={profileMutation.isPending}
                  className="bg-gold hover:bg-gold-light text-ink font-bold text-xs gap-1.5 shadow-xs"
                >
                  <Save className="size-3.5" />
                  <span>Save Profile Details</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Password Settings */}
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>Account Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Authenticated Email</span>
                <span className="font-semibold text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Access Role</span>
                <span className="rounded-xs bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-dark dark:text-gold uppercase font-mono">
                  {user?.role || "CLIENT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client ID</span>
                <span className="font-mono text-muted-foreground">
                  {client?.clientNumber || "CL-0000"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Change Access Password</CardTitle>
            </CardHeader>
            <CardContent>
              {pwdSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xs border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}
              {pwdError && (
                <div className="mb-4 p-3 rounded-xs border border-destructive/30 bg-destructive/10 text-xs text-destructive">
                  {pwdError}
                </div>
              )}

              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-3">
                <FormField label="Current Password" required error={errors.currentPassword?.message}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    leftAddon={<Lock className="size-4" />}
                    {...register("currentPassword")}
                  />
                </FormField>

                <FormField label="New Password" required error={errors.newPassword?.message}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    leftAddon={<Lock className="size-4" />}
                    {...register("newPassword")}
                  />
                </FormField>

                <FormField label="Confirm New Password" required error={errors.confirmPassword?.message}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    leftAddon={<Lock className="size-4" />}
                    {...register("confirmPassword")}
                  />
                </FormField>

                <div className="pt-2">
                  <Button type="submit" variant="gold" size="sm" isLoading={isSubmitting}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
