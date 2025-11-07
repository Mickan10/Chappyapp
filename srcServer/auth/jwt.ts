import jwt, { JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "superhemligt";

export interface MyJwtPayload extends JwtPayload {
  userId: string;
  email?: string;
  name: string;
  role?: string;
}

// Skapa token
export function createToken(payload: MyJwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

// Verifiera token
export function verifyToken(token: string): MyJwtPayload | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return null;
    return decoded as MyJwtPayload;
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}
