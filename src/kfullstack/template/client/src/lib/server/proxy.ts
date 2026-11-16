// Server-only: forwards the browser's same-origin /admin/api/v1/* calls to the
// FastAPI service (BFF). The image does not bake an API URL at build time: it
// reads API_INTERNAL_URL at runtime, so one image runs on any domain. The
// refresh-token cookie stays first-party since the browser only talks to this origin.
import type { NextRequest } from "next/server";

const API_URL = (process.env.API_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");

const FORWARD_REQUEST = [
    "authorization",
    "content-type",
    "cookie",
    "accept",
    "accept-language",
    "locale",
    "user-agent",
];
const FORWARD_RESPONSE = ["content-type", "content-disposition", "cache-control", "x-request-id"];

/**
 * Original client IP, so the API's per-IP rate limits apply per visitor.
 * The LAST X-Forwarded-For entry is the one appended by the edge proxy
 * (e.g. Traefik); the first is whatever the browser chose to send.
 */
function clientIp(req: NextRequest): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",").at(-1)!.trim();
    return req.headers.get("x-real-ip") || "0.0.0.0";
}

export async function proxy(req: NextRequest, prefix: string, parts: string[]): Promise<Response> {
    // Dot segments would be normalised by fetch and could escape the prefix.
    if (parts.some(p => p === "." || p === ".." || p === "")) {
        return Response.json({ code: 404, msg: "Not found", data: null }, { status: 404 });
    }
    // FastAPI routes like `/user/` need their trailing slash (see
    // skipTrailingSlashRedirect in next.config.ts).
    const trailing = req.nextUrl.pathname.endsWith("/") ? "/" : "";
    const path = parts.map(encodeURIComponent).join("/") + trailing;

    const headers = new Headers();
    for (const name of FORWARD_REQUEST) {
        const value = req.headers.get(name);
        if (value) headers.set(name, value);
    }
    headers.set("x-forwarded-for", clientIp(req));
    headers.set("x-forwarded-proto", req.nextUrl.protocol.replace(":", ""));

    const hasBody = !["GET", "HEAD"].includes(req.method);
    let upstream: Response;
    try {
        upstream = await fetch(`${API_URL}${prefix}/${path}${req.nextUrl.search}`, {
            method: req.method,
            headers,
            body: hasBody ? await req.arrayBuffer() : undefined,
            cache: "no-store",
            redirect: "manual",
        });
    } catch {
        return Response.json({ code: 502, msg: "API unreachable", data: null }, { status: 502 });
    }

    const out = new Headers();
    for (const name of FORWARD_RESPONSE) {
        const value = upstream.headers.get(name);
        if (value) out.set(name, value);
    }
    // Several Set-Cookie headers must stay separate (refresh token + deletes).
    for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);

    return new Response(upstream.body, { status: upstream.status, headers: out });
}
