import express from "express";
import usersRouter from "./routes/users.js";

const app = express();

const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/api/users", usersRouter);

// Serva byggd frontend från dist/
app.use(express.static("./dist/"));

// Gör så att React Router fungerar vid omladdning???
app.use((_, res) => {
  res.sendFile("./dist/index.html", { root: "." });
});

app.listen(port, () => {
  console.log(`körs på http://localhost:${port}`);
});
