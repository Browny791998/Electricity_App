// Pure chat helpers (no React, no Supabase).

export type MessageKind = "text" | "power_on" | "power_off";

export interface ChatMessage {
  id: number;
  region: string;
  township: string | null;
  group_tag: "A" | "B" | null;
  kind: MessageKind;
  nickname: string;
  body: string;
  author: string;
  created_at: string;
}

export const MESSAGE_COLUMNS =
  "id,region,township,group_tag,kind,nickname,body,author,created_at";
export const NICKNAME_MAX = 20;
export const BODY_MAX = 200;
export const DEFAULT_NICKNAME = "ဧည့်သည်";
const MAX_KEPT = 300;

/** Merge by id (newer data wins), oldest first, capped to the latest messages. */
export function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
    .slice(-MAX_KEPT);
}

export function chatErrorMessage(message: string | undefined): string {
  const m = message ?? "";
  if (m.includes("RATE_LIMIT")) return "ခဏစောင့်ပါ";
  if (m.includes("NO_LINKS")) return "Link မထည့်ရပါ";
  return "ပို့၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ";
}
