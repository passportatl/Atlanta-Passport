import { useState, useEffect } from "react";
import {
  useListCrmRecords,
  useUpdateCrmRecord,
  useGetPartnersSummary,
  useRunReminderCheck,
  getListCrmRecordsQueryKey,
  getGetPartnersSummaryQueryKey,
  type ListCrmRecordsBucket,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Loader2, RefreshCw, Send, DollarSign, Briefcase, Calendar, MapPin, Store, CalendarClock } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminGate from "@/components/AdminGate";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SALES_STAGES, PAYMENT_STATUSES } from "@workspace/pricing";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TABS: { id: ListCrmRecordsBucket | "all"; label: string }[] = [
  { id: "all", label: "All Records" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "unassigned", label: "Unassigned" },
  { id: "paid", label: "Paid" },
];

export default function AdminPartners() {
  return (
    <AdminGate>
      {(adminKey) => <AdminPartnersInner adminKey={adminKey} />}
    </AdminGate>
  );
}

function AdminPartnersInner({ adminKey }: { adminKey: string }) {
  const [activeTab, setActiveTab] = useState<ListCrmRecordsBucket | "all">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary, refetch: refetchSummary } = useGetPartnersSummary({
    query: { queryKey: getGetPartnersSummaryQueryKey() },
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const { data: records, isLoading, refetch: refetchRecords } = useListCrmRecords(
    { bucket: activeTab === "all" ? undefined : activeTab },
    {
      query: {
        queryKey: getListCrmRecordsQueryKey({ bucket: activeTab === "all" ? undefined : activeTab }),
      },
      request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
    }
  );

  const updateMutation = useUpdateCrmRecord({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });
  const reminderMutation = useRunReminderCheck({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });

  const handleUpdate = (id: string, recordType: any, updates: any) => {
    if (!adminKey) return;
    updateMutation.mutate(
      {
        recordType,
        id,
        data: updates,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListCrmRecordsQueryKey({ bucket: activeTab === "all" ? undefined : activeTab }),
          });
          refetchSummary();
        },
      }
    );
  };

  const handleReminders = () => {
    if (!adminKey) return;
    reminderMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Reminders Check Complete",
          description: `Overdue: ${res.overdue}, Due Today: ${res.dueToday}. ${res.digestSent ? "Digest sent." : "Digest skipped: " + res.digestSkippedReason}`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Reminders Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AdminNav />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Unified Partner CRM</h1>
            <p className="text-muted-foreground">Manage leads, pipeline, and follow-ups across all pipelines.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReminders}
              disabled={reminderMutation.isPending}
              className="button-pop button-pop-yellow text-sm"
            >
              {reminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Reminders Now
            </button>
            <button
              onClick={() => { refetchRecords(); refetchSummary(); }}
              className="button-pop bg-white text-foreground text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="card-pop bg-brand-cream p-4">
              <div className="flex items-center gap-2 text-brand-navy mb-2 opacity-80">
                <Calendar className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Events</span>
              </div>
              <div className="text-2xl font-display font-black">{summary.events.total}</div>
            </div>
            <div className="card-pop bg-brand-cream p-4">
              <div className="flex items-center gap-2 text-brand-navy mb-2 opacity-80">
                <MapPin className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Locations</span>
              </div>
              <div className="text-2xl font-display font-black">{summary.locations.total}</div>
            </div>
            <div className="card-pop bg-brand-cream p-4">
              <div className="flex items-center gap-2 text-brand-navy mb-2 opacity-80">
                <Store className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Vendors</span>
              </div>
              <div className="text-2xl font-display font-black">{summary.vendors.total}</div>
            </div>
            <div className="card-pop bg-brand-cream p-4">
              <div className="flex items-center gap-2 text-brand-navy mb-2 opacity-80">
                <Briefcase className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Businesses</span>
              </div>
              <div className="text-2xl font-display font-black">{summary.businesses.total}</div>
            </div>
            <div className="card-pop bg-brand-lime p-4 text-foreground col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <DollarSign className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Revenue</span>
              </div>
              <div className="text-2xl font-display font-black">${summary.totalRevenue}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 font-display text-sm uppercase tracking-wider rounded-xl border-2 border-foreground transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-foreground text-white shadow-pop-sm"
                  : "bg-white text-foreground/70 hover:bg-brand-cream"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
          </div>
        ) : (
          <div className="grid gap-4">
            {(records || []).map((record) => (
              <div key={record.id} className="card-pop bg-white p-5">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-sticker bg-brand-cream text-[10px]">
                        {record.recordType}
                      </span>
                      {record.packageId && (
                        <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[10px]">
                          {record.packageId}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{record.name}</h3>
                    <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                      <span>{record.contactName || "No contact name"}</span>
                      <span>{record.contactEmail || "No email"}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 max-w-sm">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned To</label>
                        <Input 
                          value={record.assignedTo || ""} 
                          onChange={(e) => handleUpdate(record.id, record.recordType, { assignedTo: e.target.value })}
                          className="h-8 text-xs border-foreground/30"
                          placeholder="Staff name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Contact</label>
                        <Input 
                          type="date"
                          value={record.lastContactAt ? record.lastContactAt.split('T')[0] : ""} 
                          onChange={(e) => handleUpdate(record.id, record.recordType, { lastContactAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="h-8 text-xs border-foreground/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sales Stage</label>
                      <Select
                        value={record.salesStage}
                        onValueChange={(v) => handleUpdate(record.id, record.recordType, { salesStage: v })}
                      >
                        <SelectTrigger className="h-8 text-xs border-2 border-foreground font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SALES_STAGES.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Status</label>
                      <Select
                        value={record.paymentStatus}
                        onValueChange={(v) => handleUpdate(record.id, record.recordType, { paymentStatus: v })}
                      >
                        <SelectTrigger className="h-8 text-xs border-2 border-foreground font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Follow Up</label>
                      <Input 
                        type="date"
                        value={record.nextFollowUpAt ? record.nextFollowUpAt.split('T')[0] : ""} 
                        onChange={(e) => handleUpdate(record.id, record.recordType, { nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="h-8 text-xs border-foreground/30"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-72">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Notes</label>
                    <Textarea 
                      value={record.crmNotes || ""} 
                      onChange={(e) => handleUpdate(record.id, record.recordType, { crmNotes: e.target.value })}
                      placeholder="Add notes..."
                      className="h-full min-h-[120px] text-xs resize-none border-foreground/30"
                    />
                  </div>

                </div>
              </div>
            ))}
            
            {records?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground font-bold">
                No records in this view.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
