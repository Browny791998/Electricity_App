import type { Metadata, Viewport } from "next";
import { Noto_Sans_Myanmar } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
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
  applicationName: "မီးဇယား",
  appleWebApp: { capable: true, title: "မီးဇယား", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="my"
      className={`${notoSansMyanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
