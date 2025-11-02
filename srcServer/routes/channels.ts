import express from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// hämta alla kanaler
router.get("/all", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded)
    return res.status(403).json({ error: "Invalid or expired token" });

  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "begins_with(PK, :channelPrefix) AND SK = :meta",
        ExpressionAttributeValues: {
          ":channelPrefix": "CHANNEL#",
          ":meta": "META",
        },
        ProjectionExpression: "PK, #n",
        ExpressionAttributeNames: { "#n": "name" },
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Error fetching channels:", err);
    res.status(500).json({ error: "Failed to load channels" });
  }
});

// skicka nytt kanalmeddelande
router.post("/messages", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded)
    return res.status(403).json({ error: "Invalid or expired token" });

  const { channelId, text } = req.body;
  if (!channelId || !text)
    return res.status(400).json({ error: "Missing channelId or text" });

  try {
    const messageId = uuidv4();
    const senderId = decoded.userId;

    const messageItem = {
      PK: channelId,
      SK: `MESSAGE#${messageId}`,
      senderId,
      text,
      timestamp: Date.now(),
    };

    await db.send(new PutCommand({ TableName: myTable, Item: messageItem }));

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving channel message:", err);
    res.status(500).json({ error: "Failed to save channel message" });
  }
});

// hämta alla meddelanden i en kanal
router.get("/:channelId/messages", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded)
    return res.status(403).json({ error: "Invalid or expired token" });

  const { channelId } = req.params;

  try {
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
        ExpressionAttributeValues: {
          ":pk": channelId,
          ":msg": "MESSAGE#",
        },
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Error loading channel messages:", err);
    res.status(500).json({ error: "Failed to load channel messages" });
  }
});

export default router;
