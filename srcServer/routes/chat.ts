import express, { Request, Response } from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { DecodedToken, Message } from "../types.js";

const router = express.Router();

//Hämta privata meddelanden
router.get("/messages", async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Ingen token." });
  }

  const token = auth.split(" ")[1];
  const decoded = verifyToken(token) as DecodedToken | null;
  if (!decoded) {
    return res.status(403).json({ error: "Ogiltig token." });
  }

  try {
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": decoded.userId },
      })
    );

    const messages = (result.Items || []) as Message[];
    return res.status(200).json(messages);
  } catch (err) {
    console.error("Fel vid hämtning:", err);
    return res.status(500).json({ error: "Kunde inte hämta meddelanden." });
  }
});

//Skicka meddelande
router.post("/messages", async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Ingen token." });
  }

  const token = auth.split(" ")[1];
  const decoded = verifyToken(token) as DecodedToken | null;
  if (!decoded) {
    return res.status(403).json({ error: "Ogiltig token." });
  }

  const { receiverId, text } = req.body as { receiverId: string; text: string };
  if (!receiverId || !text) {
    return res.status(400).json({ error: "Mottagare eller text saknas." });
  }

  try {
    const senderId = decoded.userId;
    const senderName = decoded.name;
    const messageId = uuidv4();

    const messageItem: Message = {
      senderId,
      senderName,
      receiverId,
      text,
      timestamp: Date.now(), 
    };

    const dbItem = {
      PK: senderId,
      SK: `MESSAGE#${messageId}`,
      ...messageItem,
    };

    // spara för avsändare
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: dbItem,
      })
    );

    // spara för mottagaren
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: { ...dbItem, PK: receiverId },
      })
    );

    return res.status(201).json({ success: true, message: messageItem });
  } catch (err) {
    console.error("Fel vid skickning:", err);
    return res.status(500).json({ error: "Kunde inte skicka meddelande." });
  }
});

export default router;
