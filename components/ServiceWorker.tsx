"use client";

import { useEffect } from "react";

/** Registers /sw.js in production only (a cached dev server would be confusing). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((e) => console.error("service worker registration failed", e));
  }, []);
  return null;
}
