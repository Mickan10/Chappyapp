import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET || "superhemligt";
// Skapa token
export function createToken(payload) {
    return jwt.sign(payload, secret, { expiresIn: "1h" });
}
// Verifiera token
export function verifyToken(token) {
    if (!token)
        return null;
    try {
        const decoded = jwt.verify(token, secret);
        if (typeof decoded === "string")
            return null;
        return decoded;
    }
    catch (err) {
        console.error("JWT verify error:", err);
        return null;
    }
}
