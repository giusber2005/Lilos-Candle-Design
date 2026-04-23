import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../dist/client");
  app.use(express.static(clientDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
