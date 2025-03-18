import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(header, process.env.JWT_SECRET as string);
    // @ts-ignore
    req.userId = decoded.id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
  }
};