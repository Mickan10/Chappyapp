import express from "express";
import { db, myTable } from "../data/db.js";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { createToken, verifyToken } from "../auth/jwt.js";
import bcrypt from "bcrypt";
const router = express.Router();
//Registrera användare
router.post("/register", async (req, res) => {
    let { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json({ error: "Fyll i alla fält." });
    }
    email = email.trim().toLowerCase();
    name = name.trim();
    password = password.trim();
    try {
        // Kontrollera om e-post redan finns
        const existing = await db.send(new ScanCommand({
            TableName: myTable,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email },
        }));
        if (existing.Count && existing.Count > 0) {
            return res.status(400).json({ error: "Användare finns redan." });
        }
        // Hasha lösenord
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const newUser = {
            PK: `USER#${userId}`,
            SK: "META",
            email,
            name,
            password: hashedPassword,
            role: "user",
        };
        await db.send(new PutCommand({ TableName: myTable, Item: newUser }));
        return res.status(201).json({ message: "Användare skapad!" });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Serverfel vid registrering." });
    }
});
//Logga in
router.post("/login", async (req, res) => {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();
    if (!email || !password) {
        return res.status(400).json({ error: "Fyll i e-post och lösenord." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Ogiltig e-postadress." });
    }
    try {
        const result = await db.send(new ScanCommand({
            TableName: myTable,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email },
        }));
        const user = result.Items?.[0];
        if (!user) {
            return res.status(404).json({ error: "Användare saknas." });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Fel lösenord." });
        }
        const token = createToken({
            userId: user.PK,
            email: user.email,
            name: user.name,
            role: "user",
        });
        return res.status(200).json({
            token,
            name: user.name,
            userId: user.PK,
            role: "user",
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Serverfel vid inloggning." });
    }
});
//Gästinloggning
router.post("/guest", async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Namn krävs för gästinloggning." });
    }
    const guestName = name.trim();
    const guestId = `guest-${Date.now()}`;
    const token = createToken({
        userId: guestId,
        name: guestName,
        email: "guest@chappy",
        role: "guest",
    });
    return res.status(200).json({
        token,
        name: guestName,
        userId: guestId,
        role: "guest",
    });
});
//Hämta alla användare i chatten
router.get("/all", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Ingen token." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: "Ogiltig token." });
    }
    try {
        const result = await db.send(new ScanCommand({
            TableName: myTable,
            FilterExpression: "begins_with(PK, :prefix) AND SK = :meta AND PK <> :myId",
            ExpressionAttributeValues: {
                ":prefix": "USER#",
                ":meta": "META",
                ":myId": decoded.userId,
            },
            ProjectionExpression: "PK, #n, email",
            ExpressionAttributeNames: { "#n": "name" },
        }));
        const users = (result.Items || []);
        return res.status(200).json(users);
    }
    catch (err) {
        console.error("Fel vid hämtning av användare:", err);
        return res.status(500).json({ error: "Kunde inte hämta användare." });
    }
});
export default router;
