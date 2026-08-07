import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("accueil");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1
        data-testid="accroche"
        className="font-serif text-4xl text-encre sm:text-5xl"
      >
        {t("accroche")}
      </h1>
    </main>
  );
}
