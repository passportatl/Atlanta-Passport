import { useState, useEffect } from "react";
import {
  useListCrmRecords,
  useUpdateCrmRecord,
  getListCrmRecordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Store, Check, RefreshCw } from "lucide-react";
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
import { SALES_STAGES, PAYMENT_STATUSES } from "@workspace/pricing";

export default function AdminVendors() {
  return (
    <AdminGate>
      {(adminKey) => <AdminVendorsInner adminKey={adminKey} />}
    </AdminGate>
  );
}

function AdminVendorsInner({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const { data: records, isLoading, isError, refetch } = useListCrmRecords(
    { recordType: "vendor" },
    {
      query: {
        queryKey: getListCrmRecordsQueryKey({ recordType: "vendor" }),
      },
      request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
    }
  );

  const updateMutation = useUpdateCrmRecord({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });

  const handleUpdate = (id: string, field: string, value: any) => {
    if (!adminKey) return;
    updateMutation.mutate(
      {
        recordType: "vendor",
        id,
        data: { [field]: value },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListCrmRecordsQueryKey({ recordType: "vendor" }),
          });
        },
      }
    );
  };

  const filtered = (records || []).filter((r) => {
    const term = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.contactName || "").toLowerCase().includes(term) ||
      (r.contactEmail || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Vendor Hub</h1>
            <p className="text-muted-foreground">Manage market vendors and their applications.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="button-pop bg-white text-foreground"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="card-pop bg-white p-6 mb-8">
          <div className="flex items-center gap-4 border-2 border-foreground rounded-xl px-4 py-3 shadow-pop-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors..."
              className="border-0 focus-visible:ring-0 p-0 text-lg"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-brand-red font-bold">Failed to load vendors.</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((vendor) => (
              <div key={vendor.id} className="card-pop bg-white p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-5 h-5 text-brand-navy" />
                    <h3 className="font-bold text-xl">{vendor.name}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vendor.contactName} {vendor.contactEmail ? `· ${vendor.contactEmail}` : ""}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {vendor.packageId && (
                      <span className="badge-sticker bg-brand-cream text-foreground text-[10px]">
                        Pkg: {vendor.packageId}
                      </span>
                    )}
                    {vendor.listingPrice !== null && vendor.listingPrice !== undefined && (
                      <span className="badge-sticker bg-brand-lime text-foreground text-[10px]">
                        ${vendor.listingPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                  <div className="space-y-1 flex-1 md:flex-initial md:min-w-[140px]">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Sales Stage
                    </label>
                    <Select
                      value={vendor.salesStage || "new"}
                      onValueChange={(v) => handleUpdate(vendor.id, "salesStage", v)}
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
                  
                  <div className="space-y-1 flex-1 md:flex-initial md:min-w-[140px]">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Payment
                    </label>
                    <Select
                      value={vendor.paymentStatus || "unpaid"}
                      onValueChange={(v) => handleUpdate(vendor.id, "paymentStatus", v)}
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
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground font-bold">
                No vendors found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
