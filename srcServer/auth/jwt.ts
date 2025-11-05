import jwt, { JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "superhemligt";

export interface MyJwtPayload extends JwtPayload {
  userId: string;
  email?: string;
  name: string;
  role?: string;
}

export function createToken(payload: MyJwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function verifyToken(token: string): MyJwtPayload | null {
  if (!token) return null;

  try {
    //TODO  return as
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return null;
    return decoded as MyJwtPayload;
  } catch {
    // Fångar upp gäst
    if (token.startsWith("guest-token:")) {
      const name = token.split(":")[1] || "Gäst";
      return {
        userId: `guest-${Date.now()}`,
        name,
        role: "guest",
        iat: Math.floor(Date.now() / 1000),
      };
    }

    return null;
  }
}
