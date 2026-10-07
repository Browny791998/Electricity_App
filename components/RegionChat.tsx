"use client";

import { useEffect, useRef, useState } from "react";
import {
  BODY_MAX,
  DEFAULT_NICKNAME,
  MESSAGE_COLUMNS,
  NICKNAME_MAX,
  chatErrorMessage,
  mergeMessages,
  type ChatMessage,
  type MessageKind,
} from "@/lib/chat";
import { ensureSession } from "@/lib/ensure-anon";
import { formatYangonTime } from "@/lib/format";
import type { Group } from "@/lib/schedule";
import { createClient } from "@/lib/supabase-browser";

const TEXT_CHAT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEXT_CHAT === "true";
const HISTORY_MS = 6 * 60 * 60 * 1000;
const NEAR_BOTTOM_PX = 80;
const NO_MESSAGES: ChatMessage[] = [];

interface Props {
  region: string;
  group: Group | null;
  nickname: string;
  onNicknameChange: (n: string) => void;
}

interface Store {
  region: string;
  messages: ChatMessage[];
  failed: boolean;
}

function MessageRow({ m, mine }: { m: ChatMessage; mine: boolean }) {
  const label =
    m.kind === "power_on" ? "🟢 မီးလာပြီ" : m.kind === "power_off" ? "🔴 မီးပြတ်ပြီ" : null;
  const tone =
    m.kind === "power_on"
      ? "bg-success/20"
      : m.kind === "power_off"
        ? "bg-danger/15"
        : "bg-white/70 dark:bg-slate-800/70";

  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${tone}`}>
        <div className="flex items-center gap-2 text-xs opacity-80">
          {m.group_tag && (
            <span className="rounded bg-primary px-1.5 py-0.5 font-bold text-white">
              {m.group_tag}
            </span>
          )}
          <span className="font-semibold">{m.nickname}</span>
          <time dateTime={m.created_at}>{formatYangonTime(m.created_at)}</time>
        </div>
        <p className="mt-1 break-words text-base font-semibold">{label ?? m.body}</p>
        {label && m.body && <p className="break-words text-sm">{m.body}</p>}
      </div>
    </li>
  );
}

export function RegionChat({ region, group, nickname, onNicknameChange }: Props) {
  const [store, setStore] = useState<Store>({ region: "", messages: [], failed: false });
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [text, setText] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const loading = store.region !== region;
  const messages = loading ? NO_MESSAGES : store.messages;

  // History (last 6h) + realtime INSERTs for the selected region.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const channel = supabase
      .channel(`chat:${region}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `region=eq.${region}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setStore((prev) =>
            prev.region === region
              ? { ...prev, messages: mergeMessages(prev.messages, [m]) }
              : prev,
          );
        },
      )
      .subscribe();

    (async () => {
      try {
        const user = await ensureSession(supabase);
        if (!cancelled) setUserId(user.id);

        const since = new Date(Date.now() - HISTORY_MS).toISOString();
        const { data, error } = await supabase
          .from("messages")
          .select(MESSAGE_COLUMNS)
          .eq("region", region)
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .limit(300);
        if (error) throw error;
        if (cancelled) return;
        stickToBottom.current = true;
        setStore((prev) => ({
          region,
          failed: false,
          messages: mergeMessages(prev.region === region ? prev.messages : [], data as ChatMessage[]),
        }));
      } catch (e) {
        console.error("chat load failed", e);
        if (!cancelled) setStore({ region, messages: [], failed: true });
      }
    })();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [region]);

  // Auto-scroll, unless the reader has scrolled up.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(kind: MessageKind, body = "") {
    if (sending) return;
    setSending(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const user = await ensureSession(supabase);
      setUserId(user.id);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          region,
          kind,
          group_tag: group,
          nickname: nickname.trim() || DEFAULT_NICKNAME,
          body,
        })
        .select(MESSAGE_COLUMNS)
        .single();
      if (error) {
        setNotice(chatErrorMessage(error.message));
        return;
      }
      stickToBottom.current = true;
      setStore((prev) =>
        prev.region === region
          ? { ...prev, messages: mergeMessages(prev.messages, [data as ChatMessage]) }
          : prev,
      );
      if (kind === "text") setText("");
    } catch (e) {
      console.error("chat send failed", e);
      setNotice("Chat သို့ ချိတ်ဆက်၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="rounded-xl bg-warning/15 p-3 text-center text-sm font-semibold text-amber-900 dark:text-amber-200">
        မီးအခြေအနေအတွက်သာ၊ ကိုယ်ရေးအချက်အလက် မရေးပါနဲ့
      </p>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
        }}
        className="glass min-h-48 flex-1 overflow-y-auto rounded-3xl p-3"
      >
        {loading ? (
          <p className="py-10 text-center opacity-70">ရယူနေသည်…</p>
        ) : store.failed ? (
          <p className="py-10 text-center font-semibold">
            Chat ရယူ၍ မရပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပါ
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center opacity-70">
            ပြီးခဲ့သော ၆ နာရီအတွင်း အစီရင်ခံချက် မရှိသေးပါ
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <MessageRow key={m.id} m={m} mine={m.author === userId} />
            ))}
          </ul>
        )}
      </div>

      {notice && (
        <p role="alert" className="rounded-xl bg-danger/15 p-3 text-center text-base font-bold text-red-700 dark:text-red-300">
          {notice}
        </p>
      )}

      <div className="glass space-y-3 rounded-3xl p-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          အမည်
          <input
            value={nickname}
            maxLength={NICKNAME_MAX}
            placeholder={DEFAULT_NICKNAME}
            onChange={(e) => onNicknameChange(e.target.value.slice(0, NICKNAME_MAX))}
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white/80 px-3 text-base font-normal text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={sending}
            onClick={() => send("power_on")}
            className="min-h-20 rounded-2xl bg-gradient-to-br from-success to-green-600 text-xl font-extrabold text-white shadow-lg shadow-success/30 transition active:scale-[0.97] disabled:opacity-50"
          >
            🟢 မီးလာပြီ
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => send("power_off")}
            className="min-h-20 rounded-2xl bg-gradient-to-br from-danger to-red-600 text-xl font-extrabold text-white shadow-lg shadow-danger/30 transition active:scale-[0.97] disabled:opacity-50"
          >
            🔴 မီးပြတ်ပြီ
          </button>
        </div>

        {TEXT_CHAT_ENABLED && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) send("text", text.trim());
            }}
            className="flex gap-2"
          >
            <input
              value={text}
              maxLength={BODY_MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder="မီးအခြေအနေ ရေးပါ"
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white/80 px-3 text-base text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="min-h-12 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-50"
            >
              ပို့မည်
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
