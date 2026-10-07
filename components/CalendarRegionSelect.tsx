"use client";

import { useRouter } from "next/navigation";
import { RegionPicker } from "@/components/RegionPicker";
import type { Region } from "@/lib/use-schedule-data";

interface Props {
  regions: Region[];
  region: string;
  month: string;
  group: string | null;
}

export function CalendarRegionSelect({ regions, region, month, group }: Props) {
  const router = useRouter();
  return (
    <RegionPicker
      regions={regions}
      value={region}
      onChange={(code) => {
        const q = new URLSearchParams({ region: code, month });
        if (group) q.set("group", group);
        router.push(`/calendar?${q}`);
      }}
    />
  );
}
