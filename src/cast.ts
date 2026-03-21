import express from "express";
import database from "./db.js";
import type { Request, Response } from "express";
import { authmiddeware } from "./auth_middleware.js";

const cast = express.Router();

type CastRow = {
  name: string;
  profile_url: string;
  character_name: string;
};

cast.get("/get-cast", authmiddeware, async (req: Request, res: Response) => {
  try {
    const movie_id = req.query.movie_id;

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        message: "Movie ID is required",
      });
    }

    const { rows } = await database.query(
      `SELECT a.name, a.profile_url, mc.character_name 
       FROM movie_cast mc 
       JOIN actors a ON mc.actor_id = a.actor_id 
       WHERE mc.movie_id = $1`,
      [movie_id]
    );

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "No cast for this title"
          : "Cast fetched successfully",
      data: rows as CastRow[],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cast",
    });
  }
});

export default cast;