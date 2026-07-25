import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

import { I18nProvider } from "@/components/I18nProvider";
import { HTML_LANG, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MyCartao — cartão de presença digital",
  description:
    "Crie e compartilhe seu cartão de presença online com QR, Presence Mode e planos Free e Pro.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html lang={HTML_LANG[locale]}>
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
