import { useState, useEffect } from "react";
import {
  useGetAdminInsights,
  getGetAdminInsightsQueryKey,
} from "@workspace/api-client-react";
import { Loader2, Download, RefreshCw, BarChart3, Users, Mail, Activity } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminGate from "@/components/AdminGate";

export default function AdminInsights() {
  return (
    <AdminGate>
      {(adminKey) => <AdminInsightsInner adminKey={adminKey} />}
    </AdminGate>
  );
}

function AdminInsightsInner({ adminKey }: { adminKey: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const { data: insights, isLoading, refetch } = useGetAdminInsights({
    query: { queryKey: getGetAdminInsightsQueryKey() },
    request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined,
  });

  const handleExport = async () => {
    if (!adminKey) return;
    setIsExporting(true);
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/admin/newsletter-export`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `newsletter-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export newsletter CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AdminNav />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Platform Insights</h1>
            <p className="text-muted-foreground">High-level metrics and system health diagnostics.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="button-pop button-pop-yellow text-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Newsletter CSV
            </button>
            <button
              onClick={() => refetch()}
              className="button-pop bg-white text-foreground text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
          </div>
        ) : insights ? (
          <div className="space-y-12">
            
            <div>
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-red" />
                Audience & Engagement
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Users</div>
                  <div className="text-3xl font-display font-black">{insights.registeredUsers}</div>
                </div>
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">New (30d)</div>
                  <div className="text-3xl font-display font-black text-brand-navy">{insights.newUsersLast30Days}</div>
                </div>
                <div className="card-pop bg-brand-lime p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 mb-1">Active Stampers</div>
                  <div className="text-3xl font-display font-black">{insights.activeStampers}</div>
                </div>
                <div className="card-pop bg-brand-yellow p-5 text-brand-yellow-foreground">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Promo Opt-ins</div>
                  <div className="text-3xl font-display font-black flex items-center gap-2">
                    <Mail className="w-6 h-6 opacity-50" />
                    {insights.promoOptIns}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-navy" />
                Usage & Content
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Stamps</div>
                  <div className="text-3xl font-display font-black">{insights.totalStamps}</div>
                </div>
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stamps (7d)</div>
                  <div className="text-3xl font-display font-black">{insights.stampsLast7Days}</div>
                </div>
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Redemptions</div>
                  <div className="text-3xl font-display font-black">{insights.totalRedemptions}</div>
                </div>
                <div className="card-pop bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Live Events</div>
                  <div className="text-3xl font-display font-black">{insights.publishedEvents}</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-foreground" />
                System Diagnostics
              </h2>
              <div className="card-pop bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {insights.diagnostics.map((diag, i) => (
                      <tr key={i} className="border-b-2 border-foreground/10 last:border-0">
                        <td className="p-4 font-bold">{diag.label}</td>
                        <td className="p-4 font-mono">{diag.value}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded border-2 border-foreground text-[10px] font-black uppercase tracking-wider ${
                            diag.status === 'ok' ? 'bg-brand-lime text-foreground' :
                            diag.status === 'warn' ? 'bg-brand-yellow text-foreground' :
                            'bg-brand-red text-white'
                          }`}>
                            {diag.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground font-bold">
            No data available.
          </div>
        )}

      </div>
    </div>
  );
}
