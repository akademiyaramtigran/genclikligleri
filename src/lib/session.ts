import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "dgl_session";
const MAX_AGE = 60 * 60 * 12; // 12 saat

export type SessionPayload = { uid: string; role: string; scope: string; name: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET tanımlı değil veya çok kısa");
    return new TextEncoder().encode("gelistirme-ortami-icin-gecici-anahtar-degistir");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE;
