import express from "express";
import usersRouter from "./routes/users.js";
import chatRouter from "./routes/chat.js";

const app = express();

const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/api/users", usersRouter);
app.use("/api/chats", chatRouter);
app.use(express.static("./dist/"));

// Gör så att React Router fungerar vid omladdning???
app.use((_, res) => {
  res.sendFile("./dist/index.html", { root: "." });
});

app.listen(port, () => {
  console.log(`körs på http://localhost:${port}`);
});
