"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/ui/keyboard-shortcuts";
import { UndoRedoProvider } from "@/components/ui/undo-redo";
import { TourProvider } from "@/components/ui/onboarding-tour";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <KeyboardShortcutsProvider>
          <UndoRedoProvider maxStackSize={50}>
            <TourProvider>
              {children}
            </TourProvider>
          </UndoRedoProvider>
        </KeyboardShortcutsProvider>
        <Toaster theme="dark" position="top-right" richColors closeButton />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
