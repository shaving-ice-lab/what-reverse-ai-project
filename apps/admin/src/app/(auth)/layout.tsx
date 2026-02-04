import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background-studio text-foreground flex items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}

