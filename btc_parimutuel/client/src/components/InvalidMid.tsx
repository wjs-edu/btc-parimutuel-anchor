import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MID_DEFAULT } from "@/lib/constants";

export function InvalidMid() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto border-destructive/20 shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Invalid ID Format</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The requested identifier is invalid. IDs must be numeric values.
            </p>
            
            <Link href={`/proof/${MID_DEFAULT}`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Default Proof Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
