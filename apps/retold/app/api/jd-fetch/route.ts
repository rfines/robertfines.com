import { NextResponse } from "next/server";
import { load } from "cheerio";
import { requireAuth } from "@/lib/route-helpers";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Block requests to private/internal network ranges to prevent SSRF
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();

  // Block hostnames by name
  const blockedHostnames = [
    "localhost",
    "metadata.google.internal",
    "metadata.google",
    "computemetadata",
  ];
  if (blockedHostnames.some((b) => h === b || h.endsWith("." + b))) return true;

  // Block IPv4 private ranges and link-local (AWS/GCP metadata)
  const ipv4Patterns = [
    /^127\./,                                       // 127.0.0.0/8 — loopback
    /^10\./,                                        // 10.0.0.0/8 — private
    /^172\.(1[6-9]|2\d|3[01])\./,                  // 172.16.0.0/12 — private
    /^192\.168\./,                                  // 192.168.0.0/16 — private
    /^169\.254\./,                                  // 169.254.0.0/16 — link-local (AWS metadata)
    /^0\./,                                         // 0.0.0.0/8
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,   // 100.64.0.0/10 — CGNAT
  ];
  if (ipv4Patterns.some((r) => r.test(h))) return true;

  // Block IPv6 private/loopback
  const ipv6Patterns = [
    /^::1$/,    // IPv6 loopback
    /^\[::1\]/, // Bracketed IPv6 loopback
    /^fc00:/i,  // IPv6 unique local
    /^fd/i,     // IPv6 unique local (fd00::/8)
    /^fe80:/i,  // IPv6 link-local
  ];
  if (ipv6Patterns.some((r) => r.test(h))) return true;

  return false;
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // 30 fetches per hour per user
  const rl = await checkRateLimit(session.user.id, {
    action: "jd-fetch",
    limit: 30,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Only allow http/https
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http and https URLs are allowed" }, { status: 400 });
  }

  // Block internal/private hosts to prevent SSRF
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  // Reject ports commonly used by internal services
  const blockedPorts = new Set(["22", "25", "3306", "5432", "6379", "27017", "2181", "9200"]);
  if (parsed.port && blockedPorts.has(parsed.port)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch that URL (HTTP ${res.status})` },
        { status: 400 }
      );
    }

    // Enforce max response size before reading full body
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Response too large" }, { status: 400 });
    }

    const html = await res.text();
    // Guard against in-memory DoS from large responses without content-length
    if (html.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Response too large" }, { status: 400 });
    }

    const $ = load(html);

    // Remove noise
    $("script, style, nav, header, footer, [aria-hidden='true'], noscript, iframe").remove();

    // Extract body text, collapse whitespace, trim
    const text = ($("body").text() ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    if (!text) {
      return NextResponse.json({ error: "Could not extract text from that URL" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return NextResponse.json(
      {
        error: isTimeout
          ? "Request timed out — try pasting the job description directly"
          : "Could not fetch that URL",
      },
      { status: 400 }
    );
  }
}
