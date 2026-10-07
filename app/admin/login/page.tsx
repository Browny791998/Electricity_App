"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAdminUser } from "@/lib/admin-check";
import { createClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !isAdminUser(data.user)) {
      // A valid non-admin account must not stay signed in here.
      if (!signInError) await supabase.auth.signOut();
      setError("အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ");
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <div className="text-5xl" aria-hidden>🔐</div>
        <h1 className="mt-2 text-3xl font-extrabold">Admin ဝင်ရန်</h1>
      </header>

      <form onSubmit={onSubmit} className="glass flex flex-col gap-4 rounded-3xl p-5">
        <label className="flex flex-col gap-2 text-base font-semibold">
          အီးမေးလ်
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-xl border border-slate-300 bg-white/80 px-3 text-base font-normal text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-base font-semibold">
          စကားဝှက်
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 rounded-xl border border-slate-300 bg-white/80 px-3 text-base font-normal text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-danger/15 p-3 text-sm font-semibold text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-base font-bold text-white disabled:opacity-60"
        >
          {busy ? "ဝင်နေသည်…" : "ဝင်မည်"}
        </button>
      </form>
    </main>
  );
}
