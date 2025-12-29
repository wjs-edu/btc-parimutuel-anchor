import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, CheckCircle, Clock, Link as LinkIcon, FileJson, ArrowRight, Copy } from "lucide-react";
import { useRoute } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MID_DEFAULT } from "@/lib/constants";
import { InvalidMid } from "@/components/InvalidMid";


export default function CanceledVerifier() {
  const [match, params] = useRoute("/verify/canceled/:mid");
  const mid = params?.mid || MID_DEFAULT;

  if (mid && isNaN(Number(mid))) {
    return <InvalidMid />;
  }


  return (
    <Layout>
      <div className="space-y-8">
        {/* Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
             <div className="flex items-center gap-4">
                 <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none rounded-sm px-3 py-1 font-mono text-xs uppercase tracking-wider font-bold">
                    CANCELED
                 </Badge>
                 <div className="h-6 w-px bg-gray-200"></div>
                 <div className="flex flex-col">
                     <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Market ID</span>
                     <span className="font-mono text-sm text-slate-900 font-medium">{mid}</span>
                 </div>
             </div>
             <div className="text-right">
                 <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Program ID</div>
                 <div className="font-mono text-xs text-slate-600">328SxemHPfb2Y2pBeH5FgZfP3dtquXUhTCYQ7L2XDf4r</div>
             </div>
        </div>

        {/* Compliance Facts (Condensed) */}
        <div className="border border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
             <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Compliance Facts (Immutable)</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Schema Version</div>
                    <div className="font-mono text-sm text-slate-900">vfinal-p0</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Rule Version</div>
                    <div className="font-mono text-sm text-slate-900">vFinal</div>
                </div>
                <div className="md:col-span-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Params Hash</div>
                    <div className="font-mono text-sm text-slate-900 truncate" title="0x8a2f9c...b1e4">0x8a2f9c...b1e4</div>
                </div>
                <div className="md:col-span-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Commit Close</div>
                    <div className="font-mono text-sm text-slate-900">2026-03-31T23:59:59Z</div>
                </div>
                <div className="md:col-span-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Cancellation Reason</div>
                    <div className="font-mono text-sm text-amber-700">threshold not met at commit_close_ts</div>
                </div>
            </div>
            <div className="p-6 pt-0 grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Total Committed</div>
                      <div className="font-mono text-lg font-medium text-slate-900">$142,390</div>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Min Threshold</div>
                      <div className="font-mono text-lg font-medium text-slate-900">$250,000</div>
                 </div>
            </div>
        </div>

        {/* Evidence Chain */}
        <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Evidence Chain</h3>
             <div className="border border-slate-200 rounded-sm bg-white divide-y divide-slate-100">
                  <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></span>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Publish tx</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-400">ZDNT...taG</span>
                          <Copy className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400" />
                      </div>
                  </a>
                  <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700">Cancel / Settle tx</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-400">5GbY...dheU</span>
                          <Copy className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400" />
                      </div>
                  </a>
                  <div className="p-4 bg-slate-50/50 space-y-3">
                       <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                           <span>Refund txs</span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="text-blue-600 hover:underline cursor-pointer">View list (8)</button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Refund txs</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                        <div className="bg-slate-50 p-2 text-[10px] text-slate-500 font-mono mb-2 border border-slate-100">
                                            Ordered by slot asc.
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {Array.from({length: 8}).map((_, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 border border-slate-100 rounded bg-white text-xs font-mono">
                                                    <span className="text-slate-600">refund-{String(i + 1).padStart(3, '0')}</span>
                                                    <span className="text-slate-400">5GbY...dheU</span>
                                                    <div className="flex gap-2">
                                                        <Copy className="w-3 h-3 text-slate-300" />
                                                        <ExternalLink className="w-3 h-3 text-slate-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </DialogContent>
                           </Dialog>
                       </div>
                  </div>
                  <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                          <FileJson className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Status JSON (canonical)</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                  </a>
             </div>
             <div className="pl-1 space-y-1">
                 <p className="text-[10px] text-slate-400 font-mono">All links are sufficient to independently recompute lifecycle state from chain.</p>
                 <p className="text-[10px] text-slate-500 font-medium italic">For disputes, share this link. It proves protocol-enforced state transitions and referenced transactions.</p>
             </div>
        </div>

        {/* Raw Evidence Accordions */}
        <Accordion type="single" collapsible className="w-full space-y-2 pt-4">
            <AccordionItem value="status-json" className="border border-slate-200 rounded-sm bg-white px-0">
                <AccordionTrigger className="hover:no-underline px-6 py-4 text-sm font-bold text-slate-700 font-mono">
                    Raw status.json (vfinal-p0)
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                     <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                        <p className="text-xs text-slate-400 italic mb-2">Hidden by default</p>
                     </div>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="snapshot-json" className="border border-slate-200 rounded-sm bg-white px-0">
                <AccordionTrigger className="hover:no-underline px-6 py-4 text-sm font-bold text-slate-700 font-mono">
                    Raw market snapshot JSON
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                    <div className="bg-slate-50 p-6 rounded-sm text-center border border-slate-100 border-dashed">
                        <p className="text-xs text-slate-400 font-mono">Hidden by default (no blobs embedded)</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}
