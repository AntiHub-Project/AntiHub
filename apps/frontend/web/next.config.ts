import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@antihub/components", "@antihub/utils"],
};

export default nextConfig;
