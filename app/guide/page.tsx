import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "အသုံးပြုနည်း",
  description: "မီးဇယား အသုံးပြုနည်း လမ်းညွှန်",
};

const sections = [
  { id: "start", label: "စတင်ရန်" },
  { id: "home", label: "ပင်မစာမျက်နှာ" },
  { id: "calendar", label: "လအလိုက်ဇယား" },
  { id: "chat", label: "Chat" },
  { id: "faq", label: "မေးလေ့ရှိသော မေးခွန်း" },
];

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex min-w-14 items-center justify-center rounded-lg px-2 py-1 text-sm font-extrabold ${className}`}>
      {children}
    </span>
  );
}

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="glass scroll-mt-4 space-y-3 rounded-3xl p-5">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl bg-white/50 px-4 py-1 dark:bg-slate-800/50">
      <summary className="flex min-h-12 list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
        {q}
        <span aria-hidden className="transition group-open:rotate-90">›</span>
      </summary>
      <div className="pb-3 text-base leading-relaxed">{children}</div>
    </details>
  );
}

export default function GuidePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-6 md:max-w-2xl">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="ပင်မစာမျက်နှာ"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">❓ အသုံးပြုနည်း</h1>
      </header>

      <p className="text-base leading-relaxed">
        ဒီ app က သင့်မြို့မှာ <b>မီးလာချိန်၊ မီးပြတ်ချိန်</b> ကို ဇယားအတိုင်း ပြပေးတာပါ။
        အကောင့်ဖွင့်စရာ မလိုပါဘူး။ အချိန်အားလုံးကို <b>မြန်မာစံတော်ချိန်</b> နဲ့ ပြပါတယ်။
      </p>

      <nav aria-label="မာတိကာ" className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="glass flex min-h-11 items-center rounded-full px-4 text-sm font-bold"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <Card id="start" title="၁။ ပထမဆုံး အကြိမ် စတင်ရန်">
        <Steps
          items={[
            <>ပင်မစာမျက်နှာကို ဖွင့်ပါ။ <b>မြို့</b> ကို ရွေးပါ။</>,
            <>သင့်အိမ်ရာ၏ <b>Group A</b> သို့မဟုတ် <b>Group B</b> ကို နှိပ်ပါ။</>,
            <>ဒါပဲ ပြီးပါပြီ။ သင့်ရွေးချယ်မှုကို ဖုန်းထဲမှာ မှတ်ထားပေးမှာမို့ နောက်တစ်ခါ ပြန်ရွေးစရာ မလိုတော့ပါဘူး။</>,
          ]}
        />
        <p className="rounded-xl bg-warning/15 p-3 text-sm font-semibold">
          💡 Group A / B ကို မသိရင် မီးဇယားကြော်ငြာ သို့မဟုတ် အိမ်နီးချင်းကို မေးပါ။ နောက်မှ အပေါ်ဘက်က A / B ခလုတ်နဲ့ ပြောင်းလို့ရပါတယ်။
        </p>
      </Card>

      <Card id="home" title="၂။ ပင်မစာမျက်နှာ ဖတ်နည်း">
        <p>
          အပေါ်ဆုံးမှာ <b>မြို့</b> ရွေးတဲ့ box နဲ့ <b>A / B</b> ခလုတ် ရှိပါတယ်။ ပြောင်းလိုရင် ဒီနေရာမှာ ပြောင်းပါ။
        </p>

        <h3 className="font-extrabold">အခု အခြေအနေ (အကြီးကြီး ကတ်)</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-3"><Chip className="bg-success text-slate-900">🟢</Chip> <span><b>အခု မီးလာတယ်</b> — အခုချိန် မီးရှိရမယ့် အချိန်။</span></li>
          <li className="flex items-center gap-3"><Chip className="bg-danger text-white">🔴</Chip> <span><b>အခု မီးပြတ်နေတယ်</b> — အခုချိန် မီးပြတ်ရမယ့် အချိန်။</span></li>
          <li className="flex items-center gap-3"><Chip className="bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200">မီးခိုး</Chip> <span><b>ဇယား မရှိသေးပါ</b> — ဒီမြို့အတွက် ဇယား မထည့်ရသေးပါ။</span></li>
        </ul>
        <p>
          ကတ်ထဲမှာ <b>နောက်တစ်ခါ ပြောင်းမယ့်အချိန်</b> နဲ့ <b>ကျန်ချိန်</b> (ဥပမာ “မီးပြတ်ဖို့ 1 နာရီ 25 မိနစ် ကျန်”) ကိုလည်း ပြပါတယ်။ ၃၀ စက္ကန့်တစ်ခါ အလိုလို ပြန်တွက်ပါတယ်။
        </p>
        <p className="rounded-xl bg-danger/10 p-3 text-sm font-semibold">
          ⚠️ ဇယားမရှိရင် “မီးအမြဲရှိတယ်” လို့ မဆိုလိုပါဘူး။ ဇယား မရှိသေးတာကိုပဲ ပြတာပါ။
        </p>

        <h3 className="font-extrabold">ယနေ့ / မနက်ဖြန် ဇယား</h3>
        <p>တစ်ရက်ကို အချိန်ပိုင်း ၅ ပိုင်း ပိုင်းထားပါတယ်။</p>
        <ul className="grid grid-cols-5 gap-1.5 text-center text-xs font-bold">
          {["05-09", "09-13", "13-17", "17-21", "21-05"].map((t) => (
            <li key={t} className="rounded-lg bg-slate-200 py-2 dark:bg-slate-700">{t}</li>
          ))}
        </ul>
        <ul className="space-y-2">
          <li className="flex items-center gap-3"><Chip className="bg-success text-slate-900">လာ</Chip> <span>အဲဒီအချိန်ပိုင်း မီးလာမယ်</span></li>
          <li className="flex items-center gap-3"><Chip className="bg-danger text-white">ပြတ်</Chip> <span>အဲဒီအချိန်ပိုင်း မီးပြတ်မယ်</span></li>
          <li className="flex items-center gap-3"><Chip className="bg-warning/30 ring-2 ring-warning">အဝါ</Chip> <span>အဝါရောင်ဘောင် = <b>အခု ရောက်နေတဲ့</b> အချိန်ပိုင်း</span></li>
        </ul>
        <p className="text-sm opacity-80">
          နောက်ဆုံးအပိုင်း (21-05) က သန်းခေါင်ကျော်ပြီး မနက် ၅ နာရီအထိ ဆက်ပါတယ်။ သန်းခေါင်ကျော် ၀၀:၀၀–၀၄:၅၉ ကို မနေ့ညပိုင်းအဖြစ် ရေတွက်ပါတယ်။
          <br />
          “A+B” သို့မဟုတ် “B+A” ဆိုတာ <b>နှစ်ဖွဲ့လုံး</b> မီးရှိတဲ့ အချိန်ပါ။
        </p>

        <h3 className="font-extrabold">⚠️ အဝါရောင် သတိပေးချက်</h3>
        <p>
          တခါတလေ ဇယားနဲ့ မကိုက်ဘဲ လူအများ report လုပ်ထားတာ ပေါ်လာနိုင်ပါတယ်။ ဥပမာ “ဇယားအရ မီးပြတ်ရမယ့်အချိန် ဖြစ်ပေမယ့် 15 မိနစ်အတွင်း 4 ယောက်က မီးလာတယ်လို့ report လုပ်ထားတယ်”။
          ဒါက <b>လူတွေ ပြောထားတာကိုပဲ</b> ပြတာပါ။ မှန်ကန်ကြောင်း အတည်မပြုထားပါဘူး။
        </p>
      </Card>

      <Card id="calendar" title="၃။ လအလိုက် ဇယား">
        <Steps
          items={[
            <>ပင်မစာမျက်နှာအောက်က <b>“📅 လအလိုက် ဇယားအပြည့်အစုံ”</b> ကို နှိပ်ပါ။</>,
            <>အပေါ်က <b>‹ ›</b> ခလုတ် သို့မဟုတ် လနံပါတ်တွေနဲ့ လပြောင်းပါ။ မီးခိုးရောင်လ = ဇယား မရှိသေးတဲ့လ။</>,
            <>ရက်တစ်ရက်စီမှာ အချိန်ပိုင်း ၅ ခုကို အချိန်နဲ့တကွ တန်းပြထားပါတယ်။</>,
            <>ရက်ကို <b>နှိပ်ရင်</b> အချိန်အတိအကျ (ဥပမာ 05:00–09:00) ပြပါမယ်။ အဝါဘောင် = ဒီနေ့။</>,
          ]}
        />
        <p>
          <b>“ကျွန်တော့်အဖွဲ့ / တခြားအဖွဲ့”</b> ခလုတ်နဲ့ အိမ်နီးချင်း အုပ်စုရဲ့ ဇယားကိုလည်း ကြည့်လို့ရပါတယ်။
        </p>
        <p className="rounded-xl bg-primary/10 p-3 text-sm font-semibold">
          📤 စာမျက်နှာရဲ့ link (လိပ်စာ) ထဲမှာ မြို့၊ လ၊ အုပ်စု ပါပြီးသားမို့ Viber / Facebook မှာ copy ကူးပြီး မျှဝေလို့ ရပါတယ်။
        </p>
      </Card>

      <Card id="chat" title="၄။ မီးအခြေအနေ Chat">
        <p>
          မြို့တစ်မြို့ချင်းစီမှာ အခန်းတစ်ခန်း ရှိပါတယ်။ မီးလာတာ၊ ပြတ်တာကို အချင်းချင်း အသိပေးဖို့ပါ။
        </p>
        <Steps
          items={[
            <>ပင်မစာမျက်နှာအောက်က <b>“💬 မီးအခြေအနေ Chat”</b> ကို နှိပ်ပါ။</>,
            <>အပေါ်က box မှာ မြို့ကို ရွေးပါ။</>,
            <>“အမည်” ထည့်ချင်ရင် ထည့်ပါ (အများဆုံး စာလုံး ၂၀)။ မထည့်ရင် “ဧည့်သည်” လို့ ပေါ်ပါမယ်။</>,
            <>မီးလာလို့ <b>🟢 မီးလာပြီ</b>၊ မီးပြတ်လို့ <b>🔴 မီးပြတ်ပြီ</b> ကို နှိပ်ပါ။ သင့်အုပ်စုနဲ့ အချိန်ပါ အလိုလို ထည့်ပေးပါတယ်။</>,
          ]}
        />
        <ul className="list-disc space-y-1 pl-5 text-base">
          <li>ပြီးခဲ့တဲ့ <b>၆ နာရီ</b> အတွင်း report တွေကို ပြပါတယ်။ စာတွေကို <b>၂၄ နာရီ</b> ကြာရင် အလိုလို ဖျက်ပါတယ်။</li>
          <li>မကြာခဏ ဆက်တိုက်နှိပ်ရင် <b>“ခဏစောင့်ပါ”</b> လို့ ပေါ်ပါမယ်။ ခဏနေမှ ထပ်နှိပ်ပါ။</li>
          <li>စာရိုက်ရတဲ့ အပိုင်းကို အခုအချိန်မှာ မဖွင့်သေးပါဘူး (ခလုတ်နှစ်ခုသာ)။ <b>Link</b> ထည့်လို့ မရပါ။</li>
        </ul>
        <p className="rounded-xl bg-warning/15 p-3 text-sm font-bold">
          မီးအခြေအနေအတွက်သာ၊ ကိုယ်ရေးအချက်အလက် မရေးပါနဲ့ — ဖုန်းနံပါတ်၊ လိပ်စာ၊ နာမည်အပြည့်အစုံ စတာတွေ မထည့်ပါနဲ့။
        </p>
      </Card>

      <Card id="faq" title="၅။ မေးလေ့ရှိသော မေးခွန်းများ">
        <div className="space-y-2">
          <Faq q="မြို့ သို့မဟုတ် အုပ်စု မှားရွေးမိရင်?">
            ပင်မစာမျက်နှာ အပေါ်ဆုံးက မြို့ box နဲ့ A / B ခလုတ်မှာ ပြန်ပြောင်းလို့ရပါတယ်။
          </Faq>
          <Faq q="“ဇယား မရှိသေးပါ” ဆိုတာ ဘာကြောင့်လဲ?">
            ဒီမြို့ (သို့) ဒီလအတွက် ဇယား မထည့်ရသေးလို့ပါ။ ဇယားထွက်လာရင် အလိုလို ပေါ်လာပါမယ်။ ဇယားမရှိတာကို မီးအမြဲရှိတယ်လို့ မယူဆပါနဲ့။
          </Faq>
          <Faq q="ပြတဲ့ အချိန်က ကျွန်တော့်ဖုန်းအချိန်နဲ့ မတူဘူး?">
            ဒီ app က ဖုန်းအချိန်ကို မသုံးဘဲ <b>မြန်မာစံတော်ချိန် (ရန်ကုန်)</b> နဲ့ပဲ တွက်ပါတယ်။ ဖုန်းအချိန် မှားနေလည်း မထိခိုက်ပါဘူး။
          </Faq>
          <Faq q="Report တွေကို အပြည့်အဝ ယုံလို့ရလား?">
            မရပါဘူး။ ဒါက လူတွေ ကိုယ်တိုင်ပို့တဲ့ အစီရင်ခံချက်ပါ။ တစ်ခါတစ်ရံ မှားနိုင်ပါတယ်။ တရားဝင်ဇယားကိုပဲ အဓိက ကြည့်ပါ။
          </Faq>
          <Faq q="အကောင့်ဖွင့်ရမလား? ကျွန်တော့် အချက်အလက် သိမ်းလား?">
            အကောင့် မလိုပါဘူး။ Chat သုံးတဲ့အခါ အမည်မသိ အသုံးပြုသူအဖြစ်သာ ချိတ်ဆက်ပါတယ်။ ရွေးထားတဲ့ မြို့၊ အုပ်စု၊ အမည်ကို သင့်ဖုန်းထဲမှာပဲ သိမ်းထားပါတယ်။
          </Faq>
          <Faq q="ကျွန်တော့်မြို့ ဇယား မရှိသေးရင် / မှားနေရင် ဘယ်လိုပို့မလဲ?">
            Admin က မြို့အားလုံးရဲ့ ဇယားကို မသိနိုင်လို့ သင်တို့ ပို့မှ ထည့်နိုင်ပါတယ်။ ပင်မစာမျက်နှာအောက်က <b>“📷 ဇယား မရှိ / မှားနေရင် ပို့မည်”</b> ကို နှိပ်ပါ (ဇယားမရှိတဲ့ ကတ်ထဲက “ဇယား ပို့ပေးမယ်” ခလုတ်ကိုလည်း နှိပ်လို့ရပါတယ်)။
            “ဇယား မရှိသေးဘူး” သို့မဟုတ် “ဇယား မှားနေတယ်” ကို ရွေးပြီး မြို့နဲ့ ဇယားဓာတ်ပုံ (အများဆုံး ၃ ပုံ) ထည့်ပို့ပါ။ မြို့စာရင်းထဲ မပါရင် “တခြားမြို့” ကို ရွေးပြီး အမည်ရေးပါ။ စစ်ဆေးပြီးမှ ထည့်သွင်း / ပြင်ဆင်ပါမယ်၊ ချက်ချင်း မပေါ်နိုင်ပါ။
          </Faq>
          <Faq q="App ကို ဖုန်းထဲ ထည့်ထားလို့ရလား? အင်တာနက်မရှိရင် သုံးလို့ရလား?">
            ရပါတယ်။ ပင်မစာမျက်နှာအောက်က <b>“📲 App အဖြစ် install လုပ်မည်”</b> ကို နှိပ်ပါ (Android / Chrome)။
            iPhone မှာတော့ Safari ရဲ့ <b>Share (⬆️)</b> ကို နှိပ်ပြီး <b>“Add to Home Screen”</b> ကို ရွေးပါ။
            ထည့်ပြီးရင် အခြား app တွေလို ဖွင့်လို့ရပါတယ်။ အင်တာနက်မရှိရင်လည်း နောက်ဆုံး သိမ်းထားတဲ့ ဇယားကို ပြပေးပါမယ် (အနည်းဆုံး တစ်ခါ အင်တာနက်နဲ့ ဖွင့်ဖူးမှ ရပါမယ်)။ Chat နဲ့ ဇယားအသစ်ကတော့ အင်တာနက်လိုပါတယ်။
          </Faq>
          <Faq q="Chat မှာ မလိုလားအပ်တဲ့ စာတွေ တွေ့ရင်?">
            ဒီ app မှာ စီမံသူက မလိုလားအပ်တဲ့ စာများကို ဖျက်ပေးနိုင်ပါတယ်။ ကိုယ်ပိုင်အချက်အလက် မပို့ဖို့ပဲ သတိပြုပါ။
          </Faq>
          <Faq q="ဇယား မပေါ်ဘူး / App ဖွင့်လို့ မရဘူး (အင်တာနက် ရှိပါလျက်)?">
            တချို့ အင်တာနက် လိုင်းတွေမှာ ဒေတာ server ကို ချိတ်ဆက်ခွင့် မပေးတာ ရှိနိုင်ပါတယ်။
            အင်တာနက် ရှိပါလျက် ဇယား မပေါ်ရင် <b>VPN ဖွင့်ပြီး ပြန်ကြိုးစားကြည့်ပါ</b>။
            တစ်ခါ အောင်မြင်စွာ ဖွင့်ပြီးရင် ဇယားကို ဖုန်းထဲမှာ သိမ်းထားပေးမှာမို့ နောက်တစ်ခါ VPN မလိုတော့ဘဲ နောက်ဆုံးသိမ်းထားတဲ့ ဇယားကို ပြနိုင်ပါတယ်။
          </Faq>
          <Faq q="Chat ပို့လို့ မရဘူး / ချိတ်ဆက်လို့ မရဘူး?">
            အင်တာနက် စစ်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပြီး ထပ်ကြိုးစားပါ။ “ခဏစောင့်ပါ” ပေါ်ရင် စက္ကန့်အနည်းငယ် ကြာမှ ထပ်နှိပ်ပါ။
          </Faq>
        </div>
      </Card>

      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary text-base font-bold text-white"
      >
        ပင်မစာမျက်နှာသို့ ပြန်သွားမည်
      </Link>
    </main>
  );
}
