import express from "express";
import cors from "cors";

const app = express();

app.use(cors({origin: "http://localhost:5173"}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({status: "ok"});
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
