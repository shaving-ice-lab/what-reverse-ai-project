"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin app error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-studio px-6">
      <div className="page-panel max-w-lg w-full p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive-200 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">System Error</h1>
          <p className="text-[12px] text-foreground-light mt-2">
            This error has been logged. Please try again later or return to the homepage.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            Retry
          </Button>
          <Link href="/">
            <Button>Back to Console</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
