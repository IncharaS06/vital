// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const withNextIntl = require("next-intl/plugin")(
  path.resolve("./i18n/request.ts")
);

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = { reactStrictMode: true };

export default withNextIntl(withPWA(nextConfig));
