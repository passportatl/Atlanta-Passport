import React, { useState, useEffect } from "react";
import { useGetStaffMe, useStaffLogin, useStaffChangePassword, getGetStaffMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, User, Key, AlertTriangle, Loader2 } from "lucide-react";
import { restoreAdminKey, ADMIN_KEY_STORAGE, ADMIN_UNLOCK_KEY } from "@/lib/adminSession";

const API_BASE = "/api";

export default function AdminGate({ children }: { children: (adminKey: string) => React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: staffMe, isLoading: checkingStaff } = useGetStaffMe({
    query: { queryKey: getGetStaffMeQueryKey() }
  });

  const [legacyKey, setLegacyKey] = useState<string | null>(null);
  const [checkingLegacy, setCheckingLegacy] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [legacyPw, setLegacyPw] = useState("");
  
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyErr, setLegacyErr] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePwErr, setChangePwErr] = useState("");

  const staffLogin = useStaffLogin();
  const staffChangePassword = useStaffChangePassword();

  useEffect(() => {
    restoreAdminKey().then((key) => {
      setLegacyKey(key);
      setCheckingLegacy(false);
    });
  }, []);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    staffLogin.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStaffMeQueryKey() });
        },
      }
    );
  };

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/sources`, { headers: { "x-admin-key": legacyPw } });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
        sessionStorage.setItem(ADMIN_KEY_STORAGE, legacyPw);
        setLegacyKey(legacyPw);
      } else {
        setLegacyErr(true);
      }
    } catch {
      setLegacyErr(true);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwErr("");
    if (newPassword.length < 10) {
      setChangePwErr("New password must be at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwErr("Passwords do not match.");
      return;
    }

    staffChangePassword.mutate(
      { data: { currentPassword, newPassword } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStaffMeQueryKey() });
        },
        onError: (err: any) => {
          setChangePwErr(err.message || "Failed to change password. Check your current password.");
        }
      }
    );
  };

  if (checkingStaff || checkingLegacy) {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
      </div>
    );
  }

  const authenticatedStaff = staffMe?.authenticated ? staffMe.user : null;

  if (authenticatedStaff) {
    if (authenticatedStaff.mustChangePassword) {
      return (
        <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper grid place-items-center px-4">
          <form onSubmit={handleChangePassword} className="card-pop bg-white p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-brand-red" />
              <h1 className="text-xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
                Update Password
              </h1>
            </div>
            <p className="text-sm text-foreground/70 mb-4">
              You must set a new password before continuing.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">New Password (≥10 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  required
                />
              </div>
            </div>

            {changePwErr && (
              <p className="text-xs text-brand-red font-bold mt-3">
                {changePwErr}
              </p>
            )}

            <button
              type="submit"
              disabled={staffChangePassword.isPending}
              className="mt-4 w-full button-pop bg-brand-red text-white py-2 flex items-center justify-center gap-2"
            >
              {staffChangePassword.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Set Password
            </button>
          </form>
        </div>
      );
    }

    return <>{children("")}</>;
  }

  if (legacyKey) {
    return <>{children(legacyKey)}</>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper flex flex-col items-center justify-center px-4 py-12">
      <form onSubmit={handleStaffLogin} className="card-pop bg-white p-6 max-w-sm w-full mb-6">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5" />
          <h1 className="text-xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            Staff Login
          </h1>
        </div>
        <p className="text-sm text-foreground/70 mb-4">
          Sign in with your Passport ATL staff account.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-2 border-foreground rounded-md px-3 py-2 text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {staffLogin.error && (
          <p className="text-xs text-brand-red font-bold mt-3">
            {staffLogin.error.message || "Invalid credentials."}
          </p>
        )}

        <button
          type="submit"
          disabled={staffLogin.isPending}
          className="mt-4 w-full button-pop bg-brand-navy text-white py-2 flex items-center justify-center gap-2"
        >
          {staffLogin.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="max-w-sm w-full">
        {!showLegacy ? (
          <button
            type="button"
            onClick={() => setShowLegacy(true)}
            className="text-xs font-bold text-foreground/50 hover:text-foreground underline w-full text-center"
          >
            Use legacy admin key instead
          </button>
        ) : (
          <form onSubmit={handleLegacyLogin} className="card-pop bg-white p-4 w-full border-dashed border-2 border-foreground/30">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-foreground/60" />
              <h2 className="text-sm font-black text-foreground/60" style={{ fontFamily: "Bungee, sans-serif" }}>Legacy Access</h2>
            </div>
            <input
              type="password"
              value={legacyPw}
              onChange={(e) => {
                setLegacyPw(e.target.value);
                setLegacyErr(false);
              }}
              className="w-full border-2 border-foreground/30 rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-foreground mb-2"
              placeholder="Shared key"
              required
            />
            {legacyErr && (
              <p className="text-xs text-brand-red font-bold mb-2">
                Incorrect legacy key.
              </p>
            )}
            <button type="submit" className="w-full button-pop bg-foreground text-white py-1.5 text-xs">
              Unlock
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
