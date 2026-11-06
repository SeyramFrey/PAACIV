import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Sur l'hébergement Hostinger, les processus enfants que Turbopack lance
    // pour PostCSS n'arrivent pas à ouvrir leur socket : le build échoue
    // (« node process exited before we could connect to it »). Les worker
    // threads tournent dans le processus de Next, sans socket.
    turbopackPluginRuntimeStrategy: "workerThreads",
    // L'admin téléverse des photos par Server Action. La limite par défaut
    // (1 Mo) refuse une photo ordinaire, et le proxy tronque au-delà de 10 Mo.
    // On garde une marge entre les deux valeurs pour l'enveloppe multipart.
    serverActions: { bodySizeLimit: "25mb" },
    proxyClientMaxBodySize: "26mb",
  },
  async rewrites() {
    return [
      {
        source: "/3d/hotel-du-district",
        destination: "/3d/hotel-du-district/index.html",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
