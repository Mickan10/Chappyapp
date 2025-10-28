import express from "express";
import { db, myTable } from "../data/db.js";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { createToken } from "../auth/jwt.js";

const router = express.Router();

// skapa ny användare
router.post("/register", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }

  try {
    // kolla om email redan finns reg.
    const existing = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    if (existing.Count && existing.Count > 0) {
      return res.status(400).json({ success: false, error: "User already exists." });
    }

    // skapar ett unikt user#id
    const userId = uuidv4();

    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: {
          PK: `USER#${userId}`,
          SK: "META",
          email,
          name,
          password,
        },
      })
    );

    res.json({ success: true, message: "User created successfully." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: "Server error during registration." });
  }
});

// LOGIN redan reg användare
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing email or password." });
  }

  try {
    // hitta användare via email
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const user = result.Items[0];

    if (user.password !== password) {
      return res.status(401).json({ success: false, error: "Invalid password." });
    }

    // skapa JWT
    const token = createToken({
      userId: user.PK,
      email: user.email,
      name: user.name,
    });

    res.json({ success: true, token, name: user.name });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Server error during login." });
  }
});

export default router;
