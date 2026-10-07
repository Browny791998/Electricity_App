"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="glass min-h-12 rounded-xl px-4 text-base font-bold disabled:opacity-60"
    >
      ထွက်မည်
    </button>
  );
}
