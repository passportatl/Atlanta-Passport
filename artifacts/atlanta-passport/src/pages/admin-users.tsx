import { useState } from "react";
import {
  useListStaffUsers,
  useUpdateStaffUser,
  useListAdminAuditLog,
  useGetLegacyAccessStatus,
  useSetLegacyAccessStatus,
  getListStaffUsersQueryKey,
  getListAdminAuditLogQueryKey,
  getGetLegacyAccessStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Activity, User, Save, RefreshCw, Key, Shield } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminGate from "@/components/AdminGate";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  return (
    <AdminGate>
      {(adminKey) => <AdminUsersContent adminKey={adminKey} />}
    </AdminGate>
  );
}

function AdminUsersContent({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useListStaffUsers({
    query: { queryKey: getListStaffUsersQueryKey() },
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const updateStaffUser = useUpdateStaffUser({
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const { data: legacyStatus, isLoading: legacyLoading } = useGetLegacyAccessStatus({
    query: { queryKey: getGetLegacyAccessStatusQueryKey() },
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const setLegacyStatus = useSetLegacyAccessStatus({
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const { data: auditLog, isLoading: auditLoading } = useListAdminAuditLog({ limit: 50 }, {
    query: { queryKey: getListAdminAuditLogQueryKey({ limit: 50 }) },
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");

  const handleUpdateStatus = (id: string, newStatus: "active" | "disabled") => {
    updateStaffUser.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStaffUsersQueryKey() });
          toast({ title: "User updated" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to update user", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleSaveEmail = (id: string) => {
    updateStaffUser.mutate(
      { id, data: { email: editEmail || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStaffUsersQueryKey() });
          setEditingUserId(null);
          toast({ title: "Email updated" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to update email", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleToggleLegacy = () => {
    if (!legacyStatus) return;
    const newEnabled = !legacyStatus.enabled;
    setLegacyStatus.mutate(
      { data: { enabled: newEnabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLegacyAccessStatusQueryKey() });
          toast({ title: `Legacy access ${newEnabled ? 'enabled' : 'disabled'}` });
        },
        onError: (err: any) => {
          toast({ title: "Failed to update legacy access", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminNav />

        <div>
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
            Staff & Security
          </h1>
          <p className="text-foreground/70 text-sm">
            Manage admin accounts, legacy access, and view action history.
          </p>
        </div>

        {/* Legacy Access Card */}
        <div className="card-pop bg-white p-5 border-2 border-foreground">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-5 h-5 text-foreground/70" />
                <h2 className="font-black text-lg">Legacy Shared Key Access</h2>
              </div>
              <p className="text-sm text-foreground/60 max-w-xl">
                Controls whether the old single-password door remains active.
                <strong className="text-brand-red ml-1">Warning:</strong> Disabling this turns off the old shared-password completely. Ensure all staff have individual accounts first.
              </p>
            </div>
            
            {!legacyLoading && legacyStatus && (
              <div className="flex items-center gap-3 bg-brand-cream px-4 py-2 rounded-xl border-2 border-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {legacyStatus.enabled ? "Active" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleLegacy}
                  disabled={setLegacyStatus.isPending}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2 disabled:opacity-50",
                    legacyStatus.enabled ? "bg-brand-red" : "bg-foreground/20"
                  )}
                >
                  <span className="sr-only">Toggle legacy access</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      legacyStatus.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Staff Users Table */}
        <div className="card-pop bg-white border-2 border-foreground overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-foreground bg-brand-navy text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <h2 className="font-black text-lg">Staff Accounts</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-brand-cream border-b-2 border-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[10px]">Username</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[10px]">Email</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[10px]">Security</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[10px]">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground/10">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-foreground/50">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading staff...
                    </td>
                  </tr>
                ) : users?.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="px-4 py-3 font-bold">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-foreground/50" />
                        {user.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingUserId === user.id ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="border-2 border-foreground rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            placeholder="Email address"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveEmail(user.id)}
                              disabled={updateStaffUser.isPending}
                              className="button-pop bg-brand-lime text-foreground text-[10px] px-2 py-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="button-pop bg-brand-cream text-foreground text-[10px] px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group flex items-center gap-2"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditEmail(user.email || "");
                          }}
                        >
                          <span className={user.email ? "text-foreground" : "text-foreground/40 italic"}>
                            {user.email || "No email"}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-brand-sky font-bold">
                            Edit
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.status}
                        onChange={(e) => handleUpdateStatus(user.id, e.target.value as "active" | "disabled")}
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider rounded border-2 px-2 py-1 focus:outline-none",
                          user.status === "active" 
                            ? "bg-brand-lime border-foreground text-foreground" 
                            : "bg-brand-cream border-foreground/30 text-foreground/50"
                        )}
                        disabled={updateStaffUser.isPending}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {user.mustChangePassword ? (
                        <span className="badge-sticker bg-brand-red text-white text-[10px] inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Temp Password
                        </span>
                      ) : (
                        <span className="badge-sticker bg-brand-sky text-foreground text-[10px]">
                          Password Changed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/60 whitespace-nowrap">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))}
                {!usersLoading && users?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-foreground/50 font-bold">
                      No staff users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action History */}
        <div className="card-pop bg-white border-2 border-foreground">
          <div className="px-5 py-4 border-b-2 border-foreground bg-brand-cream flex items-center gap-2">
            <Activity className="w-5 h-5 text-foreground/70" />
            <h2 className="font-black text-lg">Action History</h2>
          </div>
          
          <div className="p-5">
            {auditLoading ? (
              <div className="py-8 text-center text-foreground/50">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading history...
              </div>
            ) : auditLog && auditLog.length > 0 ? (
              <div className="space-y-4">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex gap-4 items-start border-l-2 border-foreground/20 pl-4 ml-2 py-1">
                    <div className="flex-1">
                      <div className="text-xs mb-1">
                        <strong className="font-black">{entry.actor}</strong>
                        <span className="text-foreground/70 mx-1">did</span>
                        <span className="badge-sticker bg-brand-yellow text-[9px] mr-1">{entry.action}</span>
                        {entry.entityType && (
                          <span className="text-foreground/70">
                            on <strong className="text-foreground">{entry.entityType}</strong> 
                            {entry.entityId && <span className="font-mono text-[10px] ml-1 opacity-50">#{entry.entityId.slice(0, 8)}</span>}
                          </span>
                        )}
                      </div>
                      {entry.detail && (
                        <p className="text-xs text-foreground/60 mt-1 bg-brand-cream/50 p-2 rounded-lg border border-foreground/10 font-mono">
                          {entry.detail}
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-foreground/40 whitespace-nowrap pt-0.5">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-foreground/50 font-bold">
                No history records found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
