import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScriptTheme } from "@/components/ScriptTheme";
import { Grain } from "@/components/ui/Grain";
import { Revelations } from "@/components/ui/Revelations";
import { FournisseurSoutien } from "@/components/soutenir/ContexteSoutien";
import { chargerTextes, texte } from "@/lib/data/contenu-site";
import "../globals.css";

// Le layout lit désormais Supabase via `chargerTextes()`, un simple `fetch`
// et non une API dynamique de Next : sans ce drapeau, il serait prérendu au
// build et les textes du pied de page y resteraient figés pour toujours.
export const dynamic = "force-dynamic";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PAACIV",
  description: "Portail de l'architecture et du patrimoine de Côte d'Ivoire.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const textes = await chargerTextes();
  const paiement = texte(textes, "soutien_paiement", locale);

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <ScriptTheme />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider>
          <FournisseurSoutien paiement={paiement}>
            <Grain />
            <Revelations />
            <SiteHeader />
            {children}
            <SiteFooter />
          </FournisseurSoutien>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
