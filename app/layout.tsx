import type { Metadata } from "next";
import { Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";

const notoSansMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-sans-myanmar",
  subsets: ["myanmar", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "မီးဇယား",
  description: "မြန်မာနိုင်ငံ လျှပ်စစ်မီး ဖွင့်/ပိတ် ဇယား",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="my"
      className={`${notoSansMyanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
