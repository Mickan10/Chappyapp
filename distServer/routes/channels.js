import express from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();
//Hämta alla kanaler
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
        const params = {
            TableName: myTable,
            FilterExpression: "begins_with(PK, :p) AND SK = :meta",
            ExpressionAttributeValues: {
                ":p": "CHANNEL_",
                ":meta": "META",
            },
            ProjectionExpression: "PK, SK, #nm, isPrivate",
            ExpressionAttributeNames: { "#nm": "name" },
        };
        const result = await db.send(new ScanCommand(params));
        const allChannels = (result.Items || []);
        //sortera kanalerna
        const sortedChannels = allChannels.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        const formatted = decoded.role === "guest"
            ? sortedChannels.map((ch) => ({ ...ch, isPrivate: ch.isPrivate === true }))
            : sortedChannels.map((ch) => ({ ...ch, isPrivate: false }));
        return res.status(200).json(formatted);
    }
    catch (err) {
        console.error("Fel vid hämtning av kanaler:", err);
        return res.status(500).json({ error: "Kunde inte hämta kanaler." });
    }
});
router.post("/messages", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Ingen token." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: "Ogiltig token." });
    }
    const { channelId, text } = req.body;
    if (!channelId || !text) {
        return res.status(400).json({ error: "Saknar kanal eller meddelande." });
    }
    try {
        if (decoded.role === "guest") {
            const checkChannel = await db.send(new ScanCommand({
                TableName: myTable,
                FilterExpression: "PK = :pk AND SK = :meta",
                ExpressionAttributeValues: {
                    ":pk": channelId,
                    ":meta": "META",
                },
            }));
            const channel = checkChannel.Items?.[0];
            if (channel?.isPrivate) {
                return res
                    .status(403)
                    .json({ error: "Denna kanal är låst för gäster." });
            }
        }
        const messageId = uuidv4();
        const messageItem = {
            senderId: decoded.userId,
            senderName: decoded.role === "guest" ? `Gäst – ${decoded.name}` : decoded.name,
            text,
            timestamp: Date.now(),
            receiverId: channelId,
        };
        const dbItem = {
            PK: channelId,
            SK: `MESSAGE#${messageId}`,
            ...messageItem,
        };
        await db.send(new PutCommand({ TableName: myTable, Item: dbItem }));
        return res.status(201).json({ success: true, message: messageItem });
    }
    catch (err) {
        console.error("Fel vid sparande av meddelande:", err);
        return res.status(500).json({ error: "Kunde inte spara meddelande." });
    }
});
router.get("/:channelId/messages", async (req, res) => {
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
        const result = await db.send(new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
            ExpressionAttributeValues: {
                ":pk": req.params.channelId,
                ":msg": "MESSAGE#",
            },
        }));
        return res.status(200).json(result.Items || []);
    }
    catch (err) {
        console.error("Fel vid hämtning av kanalmeddelanden:", err);
        return res
            .status(500)
            .json({ error: "Kunde inte hämta kanalmeddelanden." });
    }
});
export default router;
