import { Layout } from "@/components/Layout";
import { Shield, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function USGated() {
  return (
    <Layout>
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-gray-400" />
        </div>
        
        <div className="space-y-3 max-w-md mx-auto">
            <h1 className="text-xl font-semibold text-foreground">
                Participation via regulated partners only
            </h1>
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                Direct participation is not available in your region.
                Participation occurs through regulated partner platforms that handle execution and custody.
            </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
             <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-white text-sm font-medium hover:bg-gray-50 transition-colors text-foreground">
                View markets (read-only)
             </Link>
             <a href="#" className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <span>Verify market rules & history</span>
                <ExternalLink className="w-3 h-3 group-hover:text-foreground transition-colors" />
             </a>
        </div>
      </div>
    </Layout>
  );
}
