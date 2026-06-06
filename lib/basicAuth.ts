import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function verifyBasicAuth(
  header: string | null | undefined,
  expected: { user: string; password: string },
): boolean {
  if (!header || !header.startsWith("Basic ")) return false;
  const b64 = header.slice("Basic ".length).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return false;
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return safeEqual(user, expected.user) && safeEqual(pass, expected.password);
}
