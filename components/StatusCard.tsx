import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { nowInYangon, type ScheduleStatus } from "@/lib/schedule";

const pad = (n: number) => String(n).padStart(2, "0");

export function StatusCard({ status, region }: { status: ScheduleStatus; region?: string }) {
  if (status.hasPower === null) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <p className="text-2xl font-bold">ဒီမြို့အတွက် ဇယား မရှိသေးပါ</p>
        <p className="mt-2 text-sm opacity-80">သင့်မြို့ ဇယား ရှိရင် ဓာတ်ပုံ ပို့ပေးပါ၊ Admin က ထည့်ပေးပါမယ်</p>
        <Link
          href={`/report?kind=new${region ? `&region=${region}` : ""}`}
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-base font-bold text-white"
        >
          📷 ဇယား ပို့ပေးမယ်
        </Link>
      </section>
    );
  }

  const on = status.hasPower;
  const change = status.nextChangeAt ? nowInYangon(status.nextChangeAt) : null;

  return (
    <section
      aria-live="polite"
      className={`rounded-3xl p-8 text-center text-white shadow-xl ${
        on
          ? "bg-gradient-to-br from-success to-green-600 shadow-success/30"
          : "bg-gradient-to-br from-danger to-red-600 shadow-danger/30"
      }`}
    >
      <p className="text-3xl font-extrabold leading-snug">
        {on ? "🟢 အခု မီးလာတယ်" : "🔴 အခု မီးပြတ်နေတယ်"}
      </p>
      {status.minutesLeft !== null && change ? (
        <>
          <p className="mt-4 text-xl font-semibold leading-relaxed">
            {on ? "မီးပြတ်ဖို့" : "မီးလာဖို့"} {formatDuration(status.minutesLeft)} ကျန်
          </p>
          <p className="mt-1 text-base opacity-90">
            {pad(change.hour)}:{pad(change.minute)} နာရီတွင်
          </p>
        </>
      ) : (
        <p className="mt-4 text-base opacity-90">
          နောက်ပြောင်းမည့် အချိန်ကို ဇယားတွင် မတွေ့သေးပါ
        </p>
      )}
    </section>
  );
}
