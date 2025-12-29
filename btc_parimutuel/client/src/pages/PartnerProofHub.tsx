import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, Lock, FileText, CheckCircle2, FileJson, Link as LinkIcon, Copy } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MID_DEFAULT } from "@/lib/constants";
import { InvalidMid } from "@/components/InvalidMid";
import { useToast } from "@/hooks/use-toast";

export default function PartnerProofHub() {
  const [match, params] = useRoute("/proof/:mid");
  const mid = params?.mid || MID_DEFAULT;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  if (mid && isNaN(Number(mid))) {
    return <InvalidMid />;
  }

  const copyLink = (path: string, label: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: `${label} copied to clipboard.`,
      duration: 2000,
    });
  };

  return (
    <Layout>
      <div className="space-y-10">
        
        {/* ABOVE THE FOLD: TRUST FIRST */}
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight text-center">Partner Proof Hub — MID {mid}</h1>
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] text-slate-600 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Intended for: Compliance, Engineering, Finance</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">Not for: Retail users, Traders, Protocol designers</span>
                    </div>
                </div>
            </div>

            {/* Compliance Facts (Immutable) Block - Compact for Single Screen */}
            <div className="border border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden max-w-4xl mx-auto">
                <div className="bg-slate-50/50 border-b border-slate-200 px-5 py-2.5 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        Compliance Facts (Immutable)
                    </h3>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] px-2 text-slate-500 hover:text-slate-900"
                            onClick={() => copyLink(`/proof/${mid}`, "Proof Hub URL")}
                        >
                            <Copy className="w-3 h-3 mr-1.5" />
                            Copy Proof Link
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] px-2 text-slate-500 hover:text-slate-900"
                            onClick={() => copyLink(`/status/${mid}.json`, "Status JSON URL")}
                        >
                            <FileJson className="w-3 h-3 mr-1.5" />
                            Copy Status JSON
                        </Button>
                    </div>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 mb-4">
                         <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Environment</div>
                            <div className="font-mono text-xs text-slate-900 font-medium bg-amber-50 text-amber-800 inline-block px-1.5 py-0.5 rounded border border-amber-100 select-all">Devnet (Evidence Only)</div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Program ID</div>
                            <div className="font-mono text-xs text-slate-700 select-all font-medium">328SxemHPfb2Y2pBeH5FgZfP3dtquXUhTCYQ7L2XDf4r</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Market ID (MID)</div>
                            <div className="font-mono text-xs text-slate-900 font-bold select-all">{mid}</div>
                        </div>
                        
                         <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Schema Version</div>
                            <div className="font-mono text-sm text-slate-900 select-all">vfinal-p0</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Rule Version</div>
                            <div className="font-mono text-sm text-slate-900 select-all">vFinal</div>
                        </div>
                        <div className="md:col-span-2">
                             <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Params Hash</div>
                             <div className="font-mono text-xs text-slate-600 truncate select-all" title="0x8a2f9c...b1e4">0x8a2f9c...b1e4</div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Commit Close Timestamp</div>
                            <div className="font-mono text-sm text-slate-900 select-all">2026-03-31T23:59:59Z</div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Resolution Timestamp</div>
                            <div className="font-mono text-sm text-slate-900 select-all">2026-04-01T09:15:22Z</div>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Signer Posture</div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed select-text">
                            Partner wallet signs all protocol transactions. CommitClose never receives signing keys and does not sign on the partner’s behalf.
                        </p>
                    </div>
                </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center gap-4">
                    <Link href={`/status/${mid}`}>
                        <Button variant="outline" className="h-10 px-6 font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-sm text-sm">
                            View Status (canonical)
                        </Button>
                    </Link>
                    <Link href={`/verify/resolved/${mid}`}>
                        <Button className="h-10 px-6 font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-sm shadow-sm text-sm">
                            View Verifier
                        </Button>
                    </Link>
                </div>
                 <a href="#" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    Integration Pack (Schema + Runbook)
                 </a>
            </div>
            
            {/* Protocol Posture Block - Sober Compliance Memo Style */}
            <div className="max-w-4xl mx-auto bg-slate-50 border-l-4 border-slate-400 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    Protocol Posture
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 leading-relaxed font-medium">
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        Partner retains custody, KYC, and UX.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        Partner wallet signs all protocol transactions.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        CommitClose never receives signing keys and does not sign on the partner’s behalf.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        No discretionary overrides exist.
                    </li>
                     <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        CommitClose provides read-only verification and does not participate in execution, custody, pricing, or allocation.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        CommitClose cannot pause, reverse, or modify outcomes.
                    </li>
                </ul>
            </div>

            {/* Proves / Does Not Prove */}
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
                        <div className="bg-emerald-100 p-1 rounded-full">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-900">
                            Proves
                        </h3>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-3 items-center">
                             <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                             <span className="text-sm text-slate-700 font-medium">Deterministic protocol-enforced lifecycle transitions</span>
                        </li>
                        <li className="flex gap-3 items-center">
                             <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                             <span className="text-sm text-slate-700 font-medium">Labeled transaction evidence</span>
                        </li>
                        <li className="flex gap-3 items-center">
                             <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                             <span className="text-sm text-slate-700 font-medium">Independent recomputation from on-chain links</span>
                        </li>
                    </ul>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <div className="bg-slate-100 p-1 rounded-full">
                            <X className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Does Not Prove
                        </h3>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-3 items-center">
                             <X className="w-4 h-4 text-slate-400 shrink-0" />
                             <span className="text-sm text-slate-500">Partner internal per-user ledgers or balances</span>
                        </li>
                        <li className="flex gap-3 items-center">
                             <X className="w-4 h-4 text-slate-400 shrink-0" />
                             <span className="text-sm text-slate-500">Eligibility enforcement (geo/KYC)</span>
                        </li>
                         <li className="flex gap-3 items-center">
                             <X className="w-4 h-4 text-slate-400 shrink-0" />
                             <span className="text-sm text-slate-500">Customer-level accounting</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Separator */}
        <div className="max-w-4xl mx-auto h-px bg-slate-100" />

        {/* Reserve Slot Section */}
        <div className="max-w-xl mx-auto space-y-8">
            {!isSubmitted ? (
                <>
                    <div className="text-center space-y-2">
                         <h2 className="text-lg font-semibold text-slate-900">Capacity Reservation (Non-Refundable Deposit)</h2>
                    </div>
                    
                    <Card className="p-8 border border-slate-200 shadow-sm rounded-sm bg-white space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Deposit options</label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center justify-center border border-slate-200 rounded-sm p-4 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900 has-[:checked]:bg-slate-50">
                                    <input type="radio" name="deposit" className="sr-only" defaultChecked />
                                    <span className="font-mono font-medium text-slate-900">$25k</span>
                                </label>
                                <label className="flex items-center justify-center border border-slate-200 rounded-sm p-4 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900 has-[:checked]:bg-slate-50">
                                    <input type="radio" name="deposit" className="sr-only" />
                                    <span className="font-mono font-medium text-slate-900">$50k</span>
                                </label>
                                <label className="flex items-center justify-center border border-slate-200 rounded-sm p-4 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900 has-[:checked]:bg-slate-50">
                                    <input type="radio" name="deposit" className="sr-only" />
                                    <span className="font-mono font-medium text-slate-900">$75k</span>
                                </label>
                            </div>
                             <p className="text-xs text-slate-600 leading-normal pt-1">
                                A $25k non-refundable deposit reserves execution capacity. Remaining fees are invoiced at Market #1 publish.
                             </p>
                              <p className="text-[11px] text-slate-500 italic leading-normal">
                                Worst-case exposure is limited to the deposit amount; no custody, trading, or customer funds risk.
                             </p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Company (Legal Entity)</label>
                                    <input type="text" className="w-full h-10 px-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-400 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Target Start Week</label>
                                    <input type="text" className="w-full h-10 px-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-400 transition-colors" placeholder="YYYY-W##" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-start gap-3 p-3 border border-slate-100 bg-slate-50 rounded-sm cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" className="mt-0.5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900" />
                                    <span className="text-xs font-medium text-slate-700">We confirm this cohort is non-US.</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Compliance Email</label>
                                    <input type="email" className="w-full h-10 px-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-400 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Infra Email</label>
                                    <input type="email" className="w-full h-10 px-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-400 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 space-y-4">
                            <Button 
                                onClick={() => setIsSubmitted(true)}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-sm shadow-sm text-sm tracking-wide"
                            >
                                Submit Reserve Slot Request
                            </Button>
                            
                             <div className="text-[10px] text-slate-500 text-center leading-relaxed px-2 bg-slate-50 py-2 rounded border border-slate-100">
                                <span className="font-semibold text-slate-700">Purchase Description:</span> Tier-1 Fast Track evaluation capacity and verifier access for an initial lifecycle run. No funds are collected on this page.
                             </div>

                            <div className="text-center pt-2">
                                <a href="#" className="text-xs text-slate-500 hover:text-slate-900 border-b border-transparent hover:border-slate-300 transition-all pb-0.5">
                                    Observe / Follow-up
                                </a>
                            </div>
                        </div>
                    </Card>
                </>
            ) : (
                <div className="max-w-xl mx-auto text-center space-y-6 pt-8">
                     <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-slate-900">Request Generated</h2>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">
                            Your capacity reservation request has been routed to our procurement team. An order form will be sent to the provided email addresses.
                        </p>
                     </div>
                     <div className="pt-4">
                        <Button 
                            variant="outline"
                            onClick={() => setIsSubmitted(false)}
                            className="border-slate-200 text-slate-600 hover:text-slate-900"
                        >
                            Return to Proof Hub
                        </Button>
                     </div>
                </div>
            )}
        </div>

         {/* Pilot Scope (Fast Track) - Accordion */}
        <div className="max-w-4xl mx-auto">
             <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="pilot-scope" className="border border-slate-200 rounded-sm bg-white">
                    <AccordionTrigger className="hover:no-underline px-6 py-4 text-sm font-bold text-slate-700">
                        Pilot Scope (Fast Track)
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-700">Included</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>– Verifiable evidence artifact</li>
                                    <li>– Verifier access</li>
                                    <li>– Dispute-resolution support macro</li>
                                </ul>
                            </div>
                             <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Excluded</h4>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li>– Custody</li>
                                    <li>– KYC / eligibility enforcement</li>
                                    <li>– Internal ledger operations</li>
                                    <li>– Execution or trading operations</li>
                                </ul>
                            </div>
                             <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-700">Success Criteria</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>– Internal forward confirmed</li>
                                    <li>– Lifecycle validated via verifier</li>
                                    <li>– Readiness for mainnet pilot</li>
                                </ul>
                            </div>
                        </div>
                    </AccordionContent>
                 </AccordionItem>
             </Accordion>
        </div>
      </div>
    </Layout>
  );
}
