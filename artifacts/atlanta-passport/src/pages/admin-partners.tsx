import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Clipboard,
  Loader2,
  MailPlus,
  RefreshCw,
  Users,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import {
  ADMIN_KEY_STORAGE,
  ADMIN_UNLOCK_KEY,
  restoreAdminKey,
} from "@/lib/adminSession";

type Organization = { id: string; name: string; slug: string; status: string };
type Location = {
  id: string;
  organizationId: string | null;
  name: string;
  category: string;
  neighborhood: string;
  publicStatus: string;
};
type Event = {
  id: string;
  organizationId: string | null;
  name: string;
  venue: string;
  date: string;
  workflowStatus: string;
};
type PartnerHubData = {
  organizations: Organization[];
  memberships: Array<{
    id: string;
    organizationId: string;
    email: string;
    displayName: string;
    role: string;
    status: string;
  }>;
  invitations: Array<{
    id: string;
    organizationId: string;
    intendedEmail: string;
    role: string;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
  }>;
  locations: Location[];
  events: Event[];
  activity: Array<{
    id: string;
    organizationId: string;
    action: string;
    changeSummary: string | null;
    createdAt: string;
  }>;
};

async function adminRequest<T>(
  key: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": key,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export default function AdminPartners() {
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<PartnerHubData | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("owner");
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [invitationUrl, setInvitationUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (key: string) => {
    const result = await adminRequest<PartnerHubData>(
      key,
      "/admin/partner-hub",
    );
    setData(result);
    setSelectedOrganizationId(
      (current) => current || result.organizations[0]?.id || "",
    );
  }, []);

  useEffect(() => {
    void restoreAdminKey().then((key) => {
      if (!key) return;
      setAdminKey(key);
      setUnlocked(true);
      void load(key);
    });
  }, [load]);

  const selectedOrganization = data?.organizations.find(
    (item) => item.id === selectedOrganizationId,
  );
  const organizationMembers = useMemo(
    () =>
      data?.memberships.filter(
        (item) => item.organizationId === selectedOrganizationId,
      ) ?? [],
    [data, selectedOrganizationId],
  );
  const organizationInvitations = useMemo(
    () =>
      data?.invitations.filter(
        (item) => item.organizationId === selectedOrganizationId,
      ) ?? [],
    [data, selectedOrganizationId],
  );

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      await load(keyInput);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
      setAdminKey(keyInput);
      setUnlocked(true);
    } catch {
      setMessage("Incorrect admin password.");
    }
  };

  const createOrganization = async () => {
    if (!organizationName.trim()) return;
    setBusy(true);
    try {
      const organization = await adminRequest<Organization>(
        adminKey,
        "/admin/partner-organizations",
        { method: "POST", body: JSON.stringify({ name: organizationName }) },
      );
      setOrganizationName("");
      setSelectedOrganizationId(organization.id);
      setMessage(`${organization.name} created.`);
      await load(adminKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const createInvitation = async () => {
    if (!selectedOrganizationId || !inviteEmail.trim()) return;
    setBusy(true);
    try {
      const result = await adminRequest<{ acceptancePath: string }>(
        adminKey,
        `/admin/partner-organizations/${selectedOrganizationId}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );
      setInvitationUrl(`${window.location.origin}${result.acceptancePath}`);
      setInviteEmail("");
      setMessage("Invitation created. Copy and send the secure link.");
      await load(adminKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invitation failed.");
    } finally {
      setBusy(false);
    }
  };

  const assignOwnership = async () => {
    if (!selectedOrganizationId) return;
    setBusy(true);
    try {
      await adminRequest(
        adminKey,
        `/admin/partner-organizations/${selectedOrganizationId}/ownership`,
        {
          method: "PATCH",
          body: JSON.stringify({
            businessIds: [...selectedLocationIds],
            eventIds: [...selectedEventIds],
          }),
        },
      );
      setSelectedLocationIds(new Set());
      setSelectedEventIds(new Set());
      setMessage("Selected records assigned.");
      await load(adminKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assignment failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
        <form
          onSubmit={unlock}
          className="card-pop w-full max-w-sm space-y-4 bg-white p-8"
        >
          <h1 className="font-display text-3xl">Partner Hub</h1>
          <input
            type="password"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border-2 border-foreground px-4 py-3"
          />
          {message && <p className="font-bold text-brand-red">{message}</p>}
          <button className="button-pop button-pop-dark w-full" type="submit">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <AdminNav onLock={() => setUnlocked(false)} />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Partner Hub</h1>
            <p className="mt-1 text-muted-foreground">
              Create organizations, invite owners, and assign records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(adminKey)}
            className="button-pop button-pop-cream inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        {message && (
          <div className="mb-5 rounded-xl border-2 border-foreground bg-white p-4 font-bold">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="card-pop bg-white p-5">
              <h2 className="font-display text-xl">New organization</h2>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Organization name"
                className="mt-4 w-full rounded-lg border-2 border-foreground px-3 py-2"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createOrganization()}
                className="button-pop button-pop-yellow mt-3 w-full"
              >
                Create
              </button>
            </section>
            <section className="card-pop bg-white p-5">
              <h2 className="font-display text-xl">Organizations</h2>
              <div className="mt-4 space-y-2">
                {data?.organizations.map((organization) => (
                  <button
                    type="button"
                    key={organization.id}
                    onClick={() => setSelectedOrganizationId(organization.id)}
                    className={`w-full rounded-lg border-2 border-foreground p-3 text-left font-bold ${
                      selectedOrganizationId === organization.id
                        ? "bg-brand-yellow"
                        : "bg-white"
                    }`}
                  >
                    {organization.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            {!selectedOrganization ? (
              <div className="card-pop bg-white p-10 text-center">
                Create or select an organization.
              </div>
            ) : (
              <>
                <section className="card-pop bg-white p-6">
                  <h2 className="font-display text-2xl">
                    {selectedOrganization.name}
                  </h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold">
                        <Users className="h-4 w-4" /> Members
                      </h3>
                      <div className="mt-3 space-y-2">
                        {organizationMembers.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No active members yet.
                          </p>
                        )}
                        {organizationMembers.map((member) => (
                          <div
                            key={member.id}
                            className="rounded-lg bg-brand-cream p-3"
                          >
                            <strong>{member.displayName}</strong>
                            <div className="break-all text-sm">
                              {member.email}
                            </div>
                            <div className="text-sm capitalize">
                              {member.role} · {member.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 font-bold">
                        <MailPlus className="h-4 w-4" /> Invite partner
                      </h3>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="Partner email"
                        className="mt-3 w-full rounded-lg border-2 border-foreground px-3 py-2"
                      />
                      <select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value)}
                        className="mt-2 w-full rounded-lg border-2 border-foreground px-3 py-2"
                      >
                        {[
                          "owner",
                          "manager",
                          "editor",
                          "analyst",
                          "billing",
                        ].map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void createInvitation()}
                        className="button-pop button-pop-yellow mt-3 w-full"
                      >
                        Create invitation
                      </button>
                      {invitationUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(invitationUrl)
                          }
                          className="mt-3 flex w-full items-center gap-2 break-all rounded-lg border-2 border-foreground bg-brand-lime p-3 text-left text-sm font-bold"
                        >
                          <Clipboard className="h-4 w-4 shrink-0" />
                          {invitationUrl}
                        </button>
                      )}
                    </div>
                  </div>
                  {organizationInvitations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold">Invitation history</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        {organizationInvitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="rounded-lg bg-brand-cream p-3"
                          >
                            {invitation.intendedEmail} · {invitation.role} ·{" "}
                            {invitation.acceptedAt ? "accepted" : "pending"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="card-pop bg-white p-6">
                  <h2 className="font-display text-2xl">Assign records</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Only checked records will be assigned. Existing ownership is
                    shown beside each item.
                  </p>
                  <div className="mt-5 grid gap-6 md:grid-cols-2">
                    <RecordPicker
                      title="Locations"
                      records={(data?.locations ?? []).map((item) => ({
                        id: item.id,
                        label: item.name,
                        detail: `${item.category} · ${item.neighborhood}`,
                        owner: item.organizationId,
                      }))}
                      selected={selectedLocationIds}
                      onChange={setSelectedLocationIds}
                    />
                    <RecordPicker
                      title="Events"
                      records={(data?.events ?? []).map((item) => ({
                        id: item.id,
                        label: item.name,
                        detail: `${item.date} · ${item.venue}`,
                        owner: item.organizationId,
                      }))}
                      selected={selectedEventIds}
                      onChange={setSelectedEventIds}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      (selectedLocationIds.size === 0 &&
                        selectedEventIds.size === 0)
                    }
                    onClick={() => void assignOwnership()}
                    className="button-pop button-pop-dark mt-6 inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Assign selected records
                  </button>
                </section>

                <section className="card-pop bg-white p-6">
                  <h2 className="font-display text-2xl">Recent activity</h2>
                  <div className="mt-4 space-y-3">
                    {(data?.activity ?? [])
                      .filter(
                        (item) =>
                          item.organizationId === selectedOrganizationId,
                      )
                      .slice(0, 20)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="border-b border-foreground/20 pb-3"
                        >
                          <strong>{item.action}</strong>
                          {item.changeSummary && (
                            <p className="text-sm">{item.changeSummary}</p>
                          )}
                          <time className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                          </time>
                        </div>
                      ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function RecordPicker({
  title,
  records,
  selected,
  onChange,
}: {
  title: string;
  records: Array<{
    id: string;
    label: string;
    detail: string;
    owner: string | null;
  }>;
  selected: Set<string>;
  onChange: (value: Set<string>) => void;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold">
        <Building2 className="h-4 w-4" /> {title}
      </h3>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {records.map((record) => (
          <label
            key={record.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-foreground p-3"
          >
            <input
              type="checkbox"
              checked={selected.has(record.id)}
              onChange={() => {
                const next = new Set(selected);
                if (next.has(record.id)) next.delete(record.id);
                else next.add(record.id);
                onChange(next);
              }}
              className="mt-1"
            />
            <span>
              <strong className="block">{record.label}</strong>
              <span className="block text-sm">{record.detail}</span>
              <span className="block text-xs text-muted-foreground">
                {record.owner ? "Currently assigned" : "Unassigned"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
