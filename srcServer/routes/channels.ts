import express from "express";
import { db, myTable } from "../data/db.js";
import { verifyToken } from "../auth/jwt.js";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

//Hämta alla kanaler
router.get("/all", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Ingen token." });

  const decoded = verifyToken(auth.split(" ")[1]);
  if (!decoded)
    return res.status(403).json({ error: "Ogiltig token." });

  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "begins_with(PK, :p) AND SK = :meta",
        ExpressionAttributeValues: {
          ":p": "CHANNEL_",
          ":meta": "META",
        },
        ProjectionExpression: "PK, #n",
        ExpressionAttributeNames: { "#n": "name" },
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Fel vid hämtning:", err);
    res.status(500).json({ error: "Kunde inte hämta kanaler." });
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

  const { channelId, text } = req.body;
  if (!channelId || !text)
    return res.status(400).json({ error: "Kanal eller text saknas." });

  try {
    const message = {
      PK: channelId,
      SK: `MESSAGE#${uuidv4()}`,
      senderId: decoded.userId,
      text,
      timestamp: Date.now(),
    };

    await db.send(new PutCommand({ TableName: myTable, Item: message }));
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid skickning:", err);
    res.status(500).json({ error: "Kunde inte spara meddelande." });
  }
});

//Hämta meddelanden i kanal
router.get("/:channelId/messages", async (req, res) => {
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
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
        ExpressionAttributeValues: {
          ":pk": req.params.channelId,
          ":msg": "MESSAGE#",
        },
      })
    );
    res.json(result.Items || []);
  } catch (err) {
    console.error("Fel vid hämtning:", err);
    res.status(500).json({ error: "Kunde inte hämta kanalmeddelanden." });
  }
});

export default router;
