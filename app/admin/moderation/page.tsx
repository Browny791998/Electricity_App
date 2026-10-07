import Link from "next/link";
import { Suspense } from "react";
import { ModerationList } from "@/components/ModerationList";
import { requireAdmin } from "@/lib/admin";
import { MESSAGE_COLUMNS, type ChatMessage } from "@/lib/chat";

export default function ModerationPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin"
          aria-label="Admin သို့ ပြန်သွားရန်"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Chat စီမံရန်</h1>
      </header>
      <p className="text-sm opacity-70">မြို့အားလုံးမှ နောက်ဆုံး message 50 ခု</p>
      <Suspense fallback={<p className="py-16 text-center opacity-70">ရယူနေသည်…</p>}>
        <Messages />
      </Suspense>
    </main>
  );
}

async function Messages() {
  const { supabase } = await requireAdmin();

  const [messages, regions] = await Promise.all([
    supabase
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("regions").select("code,name_mm"),
  ]);

  if (messages.error || regions.error) {
    return (
      <p className="glass rounded-3xl p-8 text-center text-lg font-semibold">
        data ရယူ၍ မရပါ
      </p>
    );
  }

  const regionNames = Object.fromEntries(regions.data.map((r) => [r.code, r.name_mm]));
  return (
    <ModerationList messages={messages.data as ChatMessage[]} regionNames={regionNames} />
  );
}
