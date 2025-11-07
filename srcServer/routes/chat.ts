import express from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

//Hämta privata meddelanden
router.get("/messages", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Ingen token." });

  const decoded = verifyToken(auth.split(" ")[1]);
  if (!decoded)
    return res.status(403).json({ error: "Ogiltig token." });

  try {
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": decoded.userId },
      })
    );
    res.json(result.Items || []);
  } catch (err) {
    console.error("Fel vid hämtning:", err);
    res.status(500).json({ error: "Kunde inte hämta meddelanden." });
  }
});

//Skicka meddelande
router.post("/messages", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Ingen token." });

  const decoded = verifyToken(auth.split(" ")[1]);
  if (!decoded)
    return res.status(403).json({ error: "Ogiltig token." });

  const { receiverId, text } = req.body;
  if (!receiverId || !text)
    return res.status(400).json({ error: "Mottagare eller text saknas." });

  try {
    const senderId = decoded.userId;
    const senderName = decoded.name;
    const messageId = uuidv4();

    const message = {
      PK: senderId,
      SK: `MESSAGE#${messageId}`,
      senderId,
      senderName,
      receiverId,
      text,
      timestamp: Date.now(),
    };

    await db.send(new PutCommand({ 
      TableName: myTable, 
      Item: message }));

    await db.send(new PutCommand({ 
      TableName: myTable, 
      Item: { ...message, 
      PK: receiverId },}));

    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid skickning:", err);
    res.status(500).json({ error: "Kunde inte skicka meddelande." });
  }
});

export default router;
