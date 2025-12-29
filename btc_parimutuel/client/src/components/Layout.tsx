import React from "react";
import { Link, useLocation } from "wouter";
import { MID_DEFAULT, PROGRAM_ID, SUPPORT_EMAIL, SECURITY_EMAIL } from "@/lib/constants";
import { BUILD_VERSION, BUILD_DATE } from "@/lib/buildInfo";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const mid = MID_DEFAULT;
  const programId = PROGRAM_ID;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-100 flex flex-col">
      {/* Environment Banner - Header */}
      <div className="bg-amber-100 text-amber-900 border-b border-amber-200 text-[11px] font-mono font-bold py-2 px-4 text-center tracking-widest uppercase flex flex-col md:flex-row justify-center gap-1 md:gap-4">
        <span>DEVNET — EVIDENCE ONLY</span>
        <span className="hidden md:inline text-amber-300">|</span>
        <span className="normal-case tracking-normal font-medium text-amber-800">Production execution occurs on mainnet after a paid launch slot is reserved.</span>
      </div>

      {/* Header - Visually Dominant */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-6 h-24 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-8">
                <Link href={`/proof/${mid}`} className="font-bold text-xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
                  CommitClose
                </Link>
                
                <div className="h-8 w-px bg-gray-200" />
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold">Program ID</span>
                    <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-600 select-all">{programId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold">MID</span>
                    <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-medium select-all">{mid}</span>
                  </div>
                </div>
             </div>

             <nav className="flex gap-6 text-sm font-medium text-slate-500">
                <Link href={`/proof/${mid}`} className={location.startsWith('/proof') ? "text-slate-900 border-b-2 border-slate-900 pb-1" : "hover:text-slate-900 pb-1 border-b-2 border-transparent transition-all"}>Partner Proof Hub</Link>
                <Link href={`/status/${mid}`} className={location.startsWith('/status') ? "text-slate-900 border-b-2 border-slate-900 pb-1" : "hover:text-slate-900 pb-1 border-b-2 border-transparent transition-all"}>Status</Link>
                <Link href={`/verify/resolved/${mid}`} className={location.includes('/resolved') ? "text-slate-900 border-b-2 border-slate-900 pb-1" : "hover:text-slate-900 pb-1 border-b-2 border-transparent transition-all"}>Verifier</Link>
             </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-12">
        {children}
      </main>

      {/* Footer - Operational Assurance */}
      <footer className="bg-white border-t border-gray-200 py-16 mt-auto">
        <div className="max-w-[1100px] mx-auto px-6">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Operational Assurance</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-slate-500">
                <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        Evidence retained for ≥30 days
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        Canonical status endpoint: <span className="font-mono text-xs bg-slate-50 px-1 py-0.5 rounded">/status/:mid.json</span> (schema_version=vfinal-p0)
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        Verifier and evidence are read-only
                    </li>
                     <li className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></span>
                        All evidence independently recomputable from on-chain links.
                    </li>
                </ul>
                <div className="space-y-4 md:text-right">
                    <div className="space-y-1">
                        <div className="text-xs font-mono text-slate-400">Incident & security contact</div>
                        <a href={`mailto:${SECURITY_EMAIL}`} className="text-slate-900 font-medium hover:underline block">{SECURITY_EMAIL}</a>
                    </div>
                     <div className="space-y-1">
                        <div className="text-xs font-mono text-slate-400">Support contact</div>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-900 font-medium hover:underline block">{SUPPORT_EMAIL}</a>
                    </div>
                    <div className="pt-2 text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded border border-amber-100 font-medium">
                        Devnet — Evidence Only. Production execution occurs on mainnet after a paid launch slot is reserved.
                    </div>
                </div>
            </div>
            
            {/* Version Stamp */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex justify-center">
              <span className="text-[10px] text-slate-300 font-mono">
                UI Version: {BUILD_VERSION} ({BUILD_DATE})
              </span>
            </div>
        </div>
      </footer>
    </div>
  );
}
