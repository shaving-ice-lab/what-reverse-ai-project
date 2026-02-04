"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { reportError, reportTTI, reportWebVital } from "@/lib/telemetry";

const getTTI = () => {
  if (typeof performance === "undefined") return null;
  const [navEntry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (navEntry?.domInteractive) {
    return Math.round(navEntry.domInteractive);
  }
  if ("timing" in performance) {
    const timing = performance.timing;
    if (timing.domInteractive && timing.navigationStart) {
      return Math.round(timing.domInteractive - timing.navigationStart);
    }
  }
  return null;
};

export function ClientTelemetry() {
  useReportWebVitals((metric) => {
    reportWebVital(metric);
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportError(event.error ?? event.message, {
        source: "window.error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason ?? "Unhandled promise rejection", {
        source: "unhandledrejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  useEffect(() => {
    const emitTTI = () => {
      const tti = getTTI();
      if (tti !== null) {
        reportTTI(tti);
      }
    };

    if (document.readyState === "complete") {
      emitTTI();
    } else {
      window.addEventListener("load", emitTTI, { once: true });
    }

    return () => window.removeEventListener("load", emitTTI);
  }, []);

  return null;
}
