import { bannerMessage, type BannerInfo } from "@/lib/banner";

export function ReportBanner({ info }: { info: BannerInfo }) {
  return (
    <aside
      role="status"
      className="flex gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4 text-sm font-semibold leading-relaxed text-amber-900 dark:text-amber-200"
    >
      <span aria-hidden className="text-xl">⚠️</span>
      <p>{bannerMessage(info)}</p>
    </aside>
  );
}
