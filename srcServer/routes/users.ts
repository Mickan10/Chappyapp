import express from "express";
import { db, myTable } from "../data/db.js";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { createToken, verifyToken } from "../auth/jwt.js";
import bcrypt from "bcrypt";

const router = express.Router();

//Registrera användare
router.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password)
    return res.status(400).json({ error: "Fyll i alla fält." });

  try {
    //Kolla om email redan finns
    const existing = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );
    if (existing.Count && existing.Count > 0)
      return res.status(400).json({ error: "Användare finns redan." });

    //Hasha lösenord
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: {
          PK: `USER#${userId}`,
          SK: "META",
          email,
          name,
          password: hashedPassword,
        },
      })
    );

    res.json({ message: "Användare skapad!" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Serverfel vid registrering." });
  }
});

//Logga in
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Fyll i email och lösenord." });

  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );
    const user = result.Items?.[0];
    if (!user) return res.status(404).json({ error: "Användare saknas." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Fel lösenord." });

    const token = createToken({
      userId: user.PK,
      email: user.email,
      name: user.name,
    });

    res.json({ token, name: user.name, userId: user.PK });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Serverfel vid inloggning." });
  }
});

//gästinloggning
router.post("/guest", async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Namn krävs för gästinloggning." });
  }

  const guestName = name.trim();
  const guestId = `guest-${Date.now()}`;
  const token = `guest-token:${guestName}`;

  return res.json({
    token,
    name: guestName,
    userId: guestId,
  });
});

//Hämta alla användare i chatten
router.get("/all", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Ingen token." });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ error: "Ogiltig token." });

  //Gäst hoppas över
  if (decoded.role === "guest") {
    return res.json([]); 
  }

  //Inloggade användare hämtas från databasen
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression:
          "begins_with(PK, :prefix) AND SK = :meta AND PK <> :myId",
        ExpressionAttributeValues: {
          ":prefix": "USER#",
          ":meta": "META",
          ":myId": decoded.userId,
        },
        ProjectionExpression: "PK, #n, email",
        ExpressionAttributeNames: { "#n": "name" },
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Gick inte hämta användare:", err);
    res.status(500).json({ error: "Kunde inte hämta användare." });
  }
});


export default router;
