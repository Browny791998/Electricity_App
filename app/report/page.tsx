import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReportForm } from "@/components/ReportForm";

export const metadata: Metadata = {
  title: "ဇယား ပို့ရန်",
  description: "မြို့ဇယား မရှိသေးလျှင် ဓာတ်ပုံပို့ရန်၊ မှားနေလျှင် အကြောင်းကြားရန်",
};

export default function ReportPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-6 md:max-w-2xl">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="ပင်မစာမျက်နှာ"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">📷 ဇယား ပို့ရန်</h1>
      </header>
      <p className="text-base leading-relaxed">
        Admin က မြို့အားလုံးရဲ့ ဇယားကို မသိနိုင်လို့ <b>သင့်မြို့ ဇယား မရှိသေးရင်</b> ဓာတ်ပုံရိုက်ပြီး ပို့ပေးပါ။
        ရှိပြီးသား ဇယား <b>မှားနေရင်</b>လည်း အကြောင်းကြားပါ။ စစ်ဆေးပြီးမှ ထည့်သွင်း / ပြင်ဆင်ပါမယ်။
      </p>
      <Suspense fallback={<div className="min-h-96" />}>
        <ReportForm />
      </Suspense>
    </main>
  );
}
