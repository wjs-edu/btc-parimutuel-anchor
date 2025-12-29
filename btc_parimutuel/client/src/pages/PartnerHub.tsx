import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";

const MARKETS = [
  {
    id: "mkt_882910",
    title: "Fed Interest Rate Decision (Dec 2025)",
    status: "OPEN",
    label: "Commitment window open",
    closeTime: "2025-12-18T14:00:00Z",
    minOpen: "$500,000",
    cancelRule: "Automatic refund if < $500k committed",
  },
  {
    id: "mkt_112093",
    title: "SpaceX Starship Orbital Test Flight 6",
    status: "CANCELED",
    label: "Canceled — refund available",
    closeTime: "2025-11-20T10:00:00Z",
    minOpen: "$250,000",
    cancelRule: "Launch scrubbed > 48h",
    link: "/verify/canceled",
  },
  {
    id: "mkt_992102",
    title: "Bitcoin > $100k by Q1 2026",
    status: "RESOLVED",
    label: "Resolved — claim available",
    closeTime: "2026-03-31T23:59:59Z",
    minOpen: "$1,000,000",
    cancelRule: "Oracle failure or flash crash > 50%",
    link: "/verify/resolved",
  },
];

export default function PartnerHub() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Outcome Markets (Pilot)
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm text-muted-foreground font-serif">
                <span>Protocol Version 0.1.0 — Alpha</span>
                <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 border border-border">Region: Determined by request origin</span>
            </div>
        </div>

        <div className="space-y-4">
          {MARKETS.map((market) => (
            <Card
              key={market.id}
              className="p-0 border border-border shadow-none rounded-none overflow-hidden bg-white"
            >
              <div className="p-4 md:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="inline-flex items-center px-2 py-0.5 border border-border bg-gray-50 text-[10px] uppercase tracking-wider font-mono font-medium text-muted-foreground">
                      {market.id}
                    </div>
                    <h3 className="text-lg font-medium text-foreground">
                      {market.title}
                    </h3>
                  </div>
                  <div
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium border ${
                      market.status === "OPEN"
                        ? "bg-blue-50 text-blue-800 border-blue-100"
                        : market.status === "CANCELED"
                        ? "bg-amber-50 text-amber-800 border-amber-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-100"
                    }`}
                  >
                    {market.label}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-muted-foreground">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      Commitment Close
                    </span>
                    <span className="text-foreground">
                      {new Date(market.closeTime).toLocaleString("en-US", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      Minimum to Open
                    </span>
                    <span className="text-foreground">{market.minOpen}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      Cancel Rule
                    </span>
                    <span className="text-foreground">{market.cancelRule}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-border p-3 flex justify-between items-center">
                <a
                  href="#"
                  className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5 text-gray-400 group-hover:text-foreground" />
                  Verify market rules & history
                </a>

                {market.link ? (
                   <Link href={market.link} className="text-xs font-mono border border-border bg-white px-3 py-1.5 hover:bg-gray-50 transition-colors">
                     View Details
                   </Link>
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">
                    Active
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Participation Section - Non-US View */}
        <div className="border border-border p-6 bg-white">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground font-serif">
                   Execution and custody are handled by a regulated partner.
                </div>
                <button className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity w-full md:w-auto rounded-none flex items-center justify-center gap-2">
                  <span>Participate via Partner Name</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </button>
             </div>
        </div>
      </div>
    </Layout>
  );
}
