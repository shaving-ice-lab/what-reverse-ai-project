"use client";

import Link from "next/link";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-studio px-6">
      <div className="page-panel max-w-lg w-full p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-surface-200 flex items-center justify-center">
          <FileX className="w-6 h-6 text-foreground-light" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Page Not Found</h1>
          <p className="text-[12px] text-foreground-light mt-2">
            This page may have been moved or deleted. Please return to the console to continue.
          </p>
        </div>
        <Link href="/">
          <Button>Back to Console</Button>
        </Link>
      </div>
    </div>
  );
}
