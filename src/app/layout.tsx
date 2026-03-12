import type { Metadata } from "next";
import { Zen_Maru_Gothic, Yuji_Boku } from "next/font/google";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-maru",
});

const yujiBoku = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-yuji-boku",
});

export const metadata: Metadata = {
  title: "酒ウンチク御殿",
  description:
    "お酒の名前を入れるだけで、飲み会で使えるウンチクが手に入る！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${zenMaru.variable} ${yujiBoku.variable} font-[family-name:var(--font-zen-maru)]`}>
        {children}
      </body>
    </html>
  );
}
