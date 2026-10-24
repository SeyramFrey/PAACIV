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
  },
};

export default withNextIntl(nextConfig);
