import { verifyToken } from "./jwt.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ success: false, error: "Invalid token" });
    }
    // Lägg till användardata i request-objektet
    req.user = decoded;
    next();
}
