import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Self-contained server bundle for the Docker image (node server.js).
    output: "standalone",
    // FastAPI routes such as `/user/` keep their trailing slash: let the
    // /admin/api/v1 proxy forward the path untouched.
    skipTrailingSlashRedirect: true,
    async headers() {
        if (process.env.NODE_ENV === "development") {
            return [{ source: "/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] }];
        }
        return [
            {
                source: "/_next/static/:path*",
                headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
        ];
    },
};

export default nextConfig;
