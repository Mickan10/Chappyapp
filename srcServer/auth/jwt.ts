import jwt from "jsonwebtoken";

// nyckel från .env 
const secret = process.env.JWT_SECRET || "superhemligt";

// Skapa token
export function createToken(payload: object): string {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

// Verifiera token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return null;
  }
}
