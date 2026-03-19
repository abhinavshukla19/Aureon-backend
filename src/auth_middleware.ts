import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JWTPayload {
  user_id: number;  
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      authentication?: JWTPayload;
    }
  }
}

export const authmiddeware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret_key = process.env.jwt_secret_key;

    if (!secret_key) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    let token: string | undefined;

    const authHeader = req.headers.authorization;
    const headerToken = req.headers["token"] as string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (headerToken) {
      token = headerToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in."
      });
    }

   
    const decoded = jwt.verify(token, secret_key) as JWTPayload;
    req.authentication = decoded;
    next();

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please sign in again."
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again."
    });
  }
};