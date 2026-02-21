import express from "express"
import type { Request , Response } from "express"
import { authmiddeware } from "./auth_middleware.js";
import database from "./db.js";
const setting=express.Router()


//      Setting Detail

setting.get("/settings", authmiddeware, async (req: Request, res: Response) => {
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
          u.email,
          u.phone_number,
          us.end_date AS next_billing_date,
          us.status,
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
      message: "Settings fetched successfully",
      data: {
        email: user.email,
        phone_number: user.phone_number,
        next_billing: user.next_billing_date || null,
        plan_name: user.plan_name || "Free Plan",
        status: user.status || null,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

export default setting;
