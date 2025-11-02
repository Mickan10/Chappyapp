import express from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// hämta privata meddelanden
router.get("/messages", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded)
    return res.status(403).json({ error: "Invalid or expired token" });

  try {
    const userId = decoded.userId;
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": userId },
      })
    );
    res.json(result.Items || []);
  } catch (err) {
    console.error("Error loading messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// skicka meddelande mellan användare
router.post("/messages", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded)
    return res.status(403).json({ error: "Invalid or expired token" });

  const { receiverId, text } = req.body;
  if (!receiverId || !text)
    return res.status(400).json({ error: "Missing receiverId or text" });

  try {
    const senderId = decoded.userId;
    const messageId = uuidv4();

    const messageItem = {
      PK: senderId,
      SK: `MESSAGE#${messageId}`,
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
    };

    await db.send(new PutCommand(
      { TableName: myTable, 
        Item: messageItem }));

    await db.send(new PutCommand(
      { TableName: myTable, 
        Item: { ...messageItem, 
          PK: receiverId } }));

    res.json({ success: true });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
