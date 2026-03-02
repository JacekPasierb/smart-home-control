import {Router} from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Role } from "./homeAccess";

const router = Router();

// MVP users (ETAP 3 -> DB)
const USERS = [
  {
    id: "u1",
    login: "user",
    passHash: "$2a$10$...", // wklej hash bcrypt
    role: "user",
    homes: ["123"],
  },
  {
    id: "a1",
    login: "admin",
    passHash: "$2a$10$...",
    role: "admin",
    homes: ["123", "456"],
  },
];

router.post("/login", async (req, res) => {
  const {login, password} = req.body;

  const user = USERS.find((u) => u.login === login);
  if (!user) return res.status(401).json({message: "Invalid credentials"});

  const ok = await bcrypt.compare(password, user.passHash);
  if (!ok) return res.status(401).json({message: "Invalid credentials"});

  const accessToken = jwt.sign(
    {sub: user.id, role: user.role as Role},
    process.env.JWT_SECRET as string,
    {expiresIn: "2h"}
  );

  return res.json({
    accessToken,
    user: {
      id: user.id,
      role: user.role,
      homes: user.homes,
    },
  });
});

export default router;
