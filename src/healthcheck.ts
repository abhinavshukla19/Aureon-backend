import express from "express"
import type{Request, Response } from "express"

const health=express.Router()


health.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default health;
