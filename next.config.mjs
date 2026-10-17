/** @type {import('next').NextConfig} */
const serverUrl = (
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:9000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const nextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${serverUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;