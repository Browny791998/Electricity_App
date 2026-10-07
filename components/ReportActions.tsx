"use client";

import { useState, useTransition } from "react";
import {
  deleteReport,
  setReportStatus,
  type ReportActionResult,
} from "@/app/admin/reports/actions";

export function ReportActions({ id, status }: { id: string; status: "new" | "done" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ReportActionResult>) {
    setError(null);
    start(async () => {
      const r = await action();
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setReportStatus(id, status === "new" ? "done" : "new"))}
          className="min-h-12 rounded-xl bg-primary px-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "new" ? "✅ ပြီးပြီ မှတ်မည်" : "↩️ အသစ်ပြန်မှတ်မည်"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("ဤ report နှင့် ဓာတ်ပုံများကို ဖျက်မလား?")) run(() => deleteReport(id));
          }}
          className="min-h-12 rounded-xl border-2 border-danger px-2 text-sm font-bold text-red-700 disabled:opacity-50 dark:text-red-300"
        >
          🗑️ ဖျက်မည်
        </button>
      </div>
      {error && <p role="alert" className="text-sm font-bold text-red-700 dark:text-red-300">❌ {error}</p>}
    </div>
  );
}
