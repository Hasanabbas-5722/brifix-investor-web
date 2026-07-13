import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  allowedDevOrigins: ['192.168.1.76','127.0.0.1','34.14.191.69'],
};

export default nextConfig;
