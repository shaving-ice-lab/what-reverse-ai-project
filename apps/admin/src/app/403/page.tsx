"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogIn, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AdminForbiddenPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background-studio text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-100 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-200 border border-warning/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[14px] font-semibold text-foreground">
                Access Denied
              </div>
              <Badge variant="outline" size="sm">
                403
              </Badge>
            </div>
            <div className="mt-1 text-[12px] text-foreground-light">
              Your account is logged in but is not on the admin whitelist, or lacks the required permission capabilities. Please switch accounts or contact an admin to grant access.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Go Back
          </Button>
          <Button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Sign In Again
          </Button>
        </div>

        <div className="mt-5 text-[11px] text-foreground-muted">
          You can also go back to the <Link className="text-brand-500 hover:underline" href="/">Console Home</Link>, or verify the admin whitelist in backend config (`Security.AdminEmails`).
        </div>
      </div>
    </div>
  );
}

