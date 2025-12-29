import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, FileJson, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { MID_DEFAULT } from "@/lib/constants";

export default function RestrictedRegion() {
  const mid = MID_DEFAULT;

  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-lg w-full space-y-8 text-center">
             <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                Environment: DEVNET (evidence only)
             </div>

             <div className="space-y-4">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Restricted Region — Read-only Evidence Only
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Direct participation is not available from this region. <br/>
                    Read-only evidence is available via verifier links.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 <Link href={`/verify/resolved/${mid}`}>
                    <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-sm shadow-sm">
                        View Verifier
                    </Button>
                 </Link>
                 <Link href={`/status/${mid}`}>
                    <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-sm font-mono text-xs">
                        <FileJson className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        View Status JSON (canonical)
                    </Button>
                 </Link>
             </div>

             <div className="pt-12 text-left">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-sm space-y-3 text-sm text-slate-700">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Responsibility & Non-discretion</h3>
                    <ul className="space-y-2 text-slate-600 text-xs font-medium">
                        <li>• Partner retains custody/KYC/UX; partner wallet signs all protocol transactions; CommitClose never receives signing keys and does not sign on the partner’s behalf.</li>
                        <li>• No discretionary overrides exist.</li>
                        <li>• Does not prove partner internal per-user ledger allocations or eligibility enforcement (geo/KYC).</li>
                    </ul>
                </div>
             </div>
        </div>
      </div>
    </Layout>
  );
}
