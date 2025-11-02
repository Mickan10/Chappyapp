import express from "express";
import usersRouter from "./routes/users.js";
import chatRouter from "./routes/chat.js";
import channelsRouter from "./routes/channels.js";

const app = express();

const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/api/users", usersRouter);
app.use("/api/chats", chatRouter);
app.use("/api/channels", channelsRouter);

app.use(express.static("./dist/"));

app.listen(port, () => {
  console.log(`körs på http://localhost:${port}`);
});
