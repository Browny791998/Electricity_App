import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "အင်တာနက် မရှိပါ" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="text-6xl" aria-hidden>📡</div>
      <h1 className="text-2xl font-extrabold">အင်တာနက် မရှိပါ</h1>
      <p className="text-base leading-relaxed opacity-80">
        အင်တာနက် ချိတ်ဆက်မှု မရှိလို့ ဒီစာမျက်နှာကို မဖွင့်နိုင်ပါ။
        ချိတ်ဆက်မှု ပြန်ရတဲ့အခါ ထပ်ကြိုးစားပါ။ ပင်မစာမျက်နှာကို ယခင်က ဖွင့်ဖူးရင် နောက်ဆုံးသိမ်းထားတဲ့ ဇယားကို ပြပေးပါမယ်။
      </p>
      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 text-base font-bold text-white"
      >
        ပင်မစာမျက်နှာသို့ သွားမည်
      </Link>
    </main>
  );
}
