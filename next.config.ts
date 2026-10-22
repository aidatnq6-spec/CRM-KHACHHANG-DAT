import type { NextConfig } from "next";

const config: NextConfig = {
  distDir:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_CRM_TEST_MODE === "1"
      ? ".next-tests"
      : ".next",
  reactStrictMode: true,
  poweredByHeader: false,
};
export default config;
