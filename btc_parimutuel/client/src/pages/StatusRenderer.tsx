import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, ArrowRight, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";
import { MID_DEFAULT } from "@/lib/constants";
import { InvalidMid } from "@/components/InvalidMid";

export default function StatusRenderer() {
    const [match, params] = useRoute("/status/:mid");
    const mid = params?.mid || MID_DEFAULT;
    const [isOpen, setIsOpen] = React.useState(false);

    if (mid && isNaN(Number(mid))) {
        return <InvalidMid />;
    }


    return (
        <Layout>
            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Status (canonical) — MID {mid}</h1>
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-wide">Human-readable renderer</p>
                </div>

                {/* Compliance Facts Block - Condensed for Status */}
                <div className="border border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
                    <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Compliance Facts (Immutable)</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                         <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Environment</div>
                            <div className="font-mono text-xs text-slate-900 font-medium bg-amber-50 text-amber-800 inline-block px-1.5 py-0.5 rounded border border-amber-100">Devnet (Evidence Only)</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Schema Version</div>
                            <div className="font-mono text-sm text-slate-900">vfinal-p0</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Rule Version</div>
                            <div className="font-mono text-sm text-slate-900">vFinal</div>
                        </div>
                         <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Params Hash</div>
                             <div className="font-mono text-xs text-slate-500 truncate" title="0x8a2f9c...b1e4">0x8a2f9c...b1e4</div>
                        </div>
                    </div>
                </div>

                <Card className="border border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
                    <div className="p-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Audit Status Fields</h3>
                            <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-sm">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 bg-slate-50/30 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">status</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 font-bold break-all">RESOLVED</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">schema_version</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 break-all">vfinal-p0</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 bg-slate-50/30 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">rule_version</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 break-all">vFinal</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">params_hash</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 text-xs break-all">0x8a2f9c...b1e4</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 bg-slate-50/30 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">commit_close_ts</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 break-all">2026-03-31T23:59:59Z</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 p-3 gap-1 sm:gap-0">
                                    <span className="font-mono text-slate-500 text-xs uppercase tracking-wide">resolution_ts</span>
                                    <span className="sm:col-span-2 font-mono text-slate-900 break-all">2026-04-01T09:15:22Z</span>
                                </div>
                            </div>
                        </div>

                         <div className="mt-6 border border-slate-200 rounded-sm">
                            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-2">
                                            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Tx Inventory (Deterministically Ordered slot asc)</span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">14,302 items</span>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-4 bg-white border-t border-slate-200 space-y-4">
                                     <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">Publish</span>
                                            <span className="text-slate-900">ZDNT...taG</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">Settle/Close</span>
                                            <span className="text-slate-900">5GbY...dheU</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">Resolve</span>
                                            <span className="text-slate-900">4zR3...YSHS</span>
                                        </div>
                                         <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">Receipt Init</span>
                                            <a href="#" className="text-blue-600 hover:underline">View list (12)</a>
                                        </div>
                                         <div className="flex items-center justify-between text-xs font-mono">
                                            <span className="text-slate-500">Claim</span>
                                            <a href="#" className="text-blue-600 hover:underline">View list (6)</a>
                                        </div>
                                     </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row gap-4">
                             <Button variant="outline" className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-sm font-mono text-xs">
                                <FileJson className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                View raw status.json
                             </Button>
                             <Link href={`/verify/resolved/${mid}`} className="flex-1">
                                <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-sm shadow-sm">
                                    View Verifier
                                </Button>
                             </Link>
                             <Link href={`/proof/${mid}`} className="flex-1">
                                <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-sm">
                                    View Proof Hub
                                </Button>
                             </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
