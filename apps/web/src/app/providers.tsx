"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState, useEffect, type ReactNode } from "react";
import { ToastProvider, useToast, setGlobalToast } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface ProvidersProps {
  children: ReactNode;
}

// 设置全局 Toast（用于非组件环境）
function GlobalToastSetter() {
  const { addToast } = useToast();
  
  useEffect(() => {
    setGlobalToast(addToast);
    return () => setGlobalToast(null);
  }, [addToast]);
  
  return null;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据过期时间：5分钟
            staleTime: 5 * 60 * 1000,
            // 缓存时间：30分钟
            gcTime: 30 * 60 * 1000,
            // 失败重试次数
            retry: 1,
            // 窗口聚焦时不自动重新获取
            refetchOnWindowFocus: false,
          },
          mutations: {
            // 失败重试次数
            retry: 0,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ErrorBoundary showDetails={process.env.NODE_ENV === "development"}>
            {children}
          </ErrorBoundary>
          <GlobalToastSetter />
        </ToastProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
