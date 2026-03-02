import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import type { Role } from "./homeAccess";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authRequired = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({message: "Missing token"});
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      sub: string;
      role: Role;
    };

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({message: "Invalid token"});
  }
};
