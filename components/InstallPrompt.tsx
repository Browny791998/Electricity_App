"use client";

import { useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Env = "server" | "installed" | "ios" | "other";

function detectEnv(): Env {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other";
}

// The install event can fire before this component mounts, so capture it once.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function InstallPrompt() {
  const env = useSyncExternalStore(() => () => {}, detectEnv, () => "server" as Env);
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const [showIos, setShowIos] = useState(false);

  if (env === "server" || env === "installed") return null;

  if (canPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          const e = deferred;
          if (!e) return;
          await e.prompt();
          await e.userChoice;
        }}
        className="glass flex min-h-14 w-full items-center justify-center rounded-2xl px-3 text-base font-bold text-primary dark:text-secondary"
      >
        📲 App အဖြစ် install လုပ်မည်
      </button>
    );
  }

  if (env === "ios") {
    return (
      <div className="glass rounded-2xl p-3 text-center">
        <button
          type="button"
          aria-expanded={showIos}
          onClick={() => setShowIos((v) => !v)}
          className="min-h-12 text-base font-bold text-primary dark:text-secondary"
        >
          📲 iPhone မှာ App အဖြစ် ထည့်နည်း
        </button>
        {showIos && (
          <p className="pt-1 text-sm leading-relaxed">
            Safari ရဲ့ အောက်က <b>Share (⬆️)</b> ခလုတ်ကို နှိပ်ပြီး{" "}
            <b>“Add to Home Screen”</b> ကို ရွေးပါ။
          </p>
        )}
      </div>
    );
  }

  return null;
}
