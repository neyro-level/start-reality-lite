import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/platform/security";
import { analytics } from "./src/project/analytics.config";
import { media } from "./src/project/media.config";

const nextConfig: NextConfig = {
  env: {
    PROJECT_FIXTURE: process.env.PROJECT_FIXTURE ?? "fixture-demo",
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  trailingSlash: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./fixtures/**/*", "./docs/seo/**/*"],
  },
  images: {
    loader: "custom",
    loaderFile: "./src/project/image-loader.ts",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          mediaOrigin: media.origin,
          analyticsOrigins: analytics.origins,
          hsts: process.env.NODE_ENV === "production",
        }),
      },
    ];
  },
};

export default nextConfig;
