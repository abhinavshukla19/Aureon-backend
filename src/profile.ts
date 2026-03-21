import express from "express";
import type { Request, Response } from "express";
const profile = express.Router();
import { authmiddeware } from "./auth_middleware.ts";
import database from "./db.ts";



//     Profile get

profile.get("/profile", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const { rows } = await database.query(
      `SELECT 
          u.username,
          u.email,
          u.phone_number,
          u.isverified,
          u.created_at AS member_since,
          sp.plan_name
       FROM user_login AS u
       LEFT JOIN user_subscription AS us ON u.user_id = us.user_id AND us.status = 'active'
       LEFT JOIN subscription_plans AS sp ON us.plan_id = sp.plan_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        plan_name: user.plan_name || "Free Plan",
        member_since: user.member_since,
        emailVerified: user.isverified,  // fixed typo
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});



export default profile;