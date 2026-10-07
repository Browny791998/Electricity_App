"use client";

import { useState, useTransition } from "react";
import {
  deleteAllFromAuthor,
  deleteMessage,
  type ModerationResult,
} from "@/app/admin/moderation/actions";
import type { ChatMessage } from "@/lib/chat";
import { formatYangonDateTime } from "@/lib/format";

interface Props {
  messages: ChatMessage[];
  regionNames: Record<string, string>;
}

const KIND_LABEL = {
  power_on: "🟢 မီးလာပြီ",
  power_off: "🔴 မီးပြတ်ပြီ",
  text: "",
} as const;

export function ModerationList({ messages, regionNames }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  function run(action: () => Promise<ModerationResult>, doneText: (n: number) => string) {
    setStatus(null);
    startTransition(async () => {
      const result = await action();
      setStatus(
        result.ok
          ? { ok: true, text: doneText(result.deleted) }
          : { ok: false, text: result.error },
      );
    });
  }

  if (messages.length === 0) {
    return (
      <p className="glass rounded-3xl p-8 text-center text-lg font-semibold">
        message မရှိသေးပါ
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={`rounded-2xl p-3 text-center font-bold ${
            status.ok ? "bg-success/20" : "bg-danger/15 text-red-700 dark:text-red-300"
          }`}
        >
          {status.ok ? "✅ " : "❌ "}
          {status.text}
        </p>
      )}

      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="glass space-y-3 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-primary px-1.5 py-0.5 font-bold text-white">
                {regionNames[m.region] ?? m.region}
              </span>
              {m.group_tag && (
                <span className="rounded bg-secondary px-1.5 py-0.5 font-bold text-slate-900">
                  {m.group_tag}
                </span>
              )}
              <span className="font-semibold">{m.nickname}</span>
              <time dateTime={m.created_at} className="opacity-70">
                {formatYangonDateTime(m.created_at)}
              </time>
              <span className="ml-auto font-mono opacity-50" title={m.author}>
                {m.author.slice(0, 8)}
              </span>
            </div>

            <p className="break-words text-base font-semibold">
              {KIND_LABEL[m.kind]} {m.body}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteMessage(m.id), () => "ဖျက်ပြီးပါပြီ")}
                className="min-h-12 rounded-xl bg-danger px-2 text-sm font-bold text-white disabled:opacity-50"
              >
                🗑️ ဖျက်မည်
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `${m.author.slice(0, 8)} ၏ message အားလုံးကို (မြို့အားလုံးမှ၊ ဤစာရင်းပြင်ပရှိသည်များပါ) ဖျက်မလား?`,
                    )
                  ) {
                    return;
                  }
                  run(
                    () => deleteAllFromAuthor(m.author),
                    (n) => `ဤသူ၏ message ${n} ခု ဖျက်ပြီးပါပြီ`,
                  );
                }}
                className="min-h-12 rounded-xl border-2 border-danger px-2 text-sm font-bold text-red-700 disabled:opacity-50 dark:text-red-300"
              >
                🚫 ဤသူ၏ အားလုံးဖျက်မည်
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
