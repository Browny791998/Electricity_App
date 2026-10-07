"use client";

import Link from "next/link";
import { RegionChat } from "@/components/RegionChat";
import { RegionPicker } from "@/components/RegionPicker";
import { useRegions } from "@/lib/use-schedule-data";
import { useUserPrefs } from "@/lib/use-user-prefs";

export function ChatPage() {
  const { ready, region, group, nickname, setRegion, setNickname } = useUserPrefs();
  const regions = useRegions();

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-3 px-5 py-4 md:max-w-2xl">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="ပင်မစာမျက်နှာ"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-xl font-extrabold">💬 မီးအခြေအနေ Chat</h1>
      </header>
      <RegionPicker regions={regions} value={region} onChange={setRegion} />
      {ready ? (
        <RegionChat
          region={region}
          group={group}
          nickname={nickname}
          onNicknameChange={setNickname}
        />
      ) : (
        <div className="flex-1" />
      )}
    </main>
  );
}
