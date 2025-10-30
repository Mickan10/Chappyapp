import jwt, { JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "superhemligt";

export interface MyJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function createToken(payload: MyJwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function verifyToken(token: string): MyJwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    // Kontrollera att det verkligen är ett objekt
    if (typeof decoded === "string") return null;
    return decoded as MyJwtPayload;
  } catch {
    return null;
  }
}
