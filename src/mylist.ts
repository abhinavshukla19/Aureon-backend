import express from "express";
import database from "./db.js";
import type { Request, Response } from "express";
import { authmiddeware } from "./auth_middleware.js";

const mylist = express.Router();

type MyListRow = {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
  duration: number;
  genre: string;
  banner_url: string;
  type: string;
};


// ─────────────────────────────────────────────
// TOGGLE — add or remove from list
// ─────────────────────────────────────────────
mylist.post("/add-to-mylist", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { movie_id } = req.body;
    const user_id = req.authentication?.user_id;  // no await needed

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        message: "Movie ID is required",
      });
    }

    const { rows: existing } = await database.query(
      "SELECT 1 FROM my_list WHERE user_id = $1 AND movie_id = $2 LIMIT 1",
      [user_id, movie_id]
    );

    if (existing.length > 0) {
      await database.query(
        "DELETE FROM my_list WHERE user_id = $1 AND movie_id = $2",
        [user_id, movie_id]
      );
      return res.status(200).json({
        success: true,       
        message: "Removed from list",
      });
    }

    await database.query(
      "INSERT INTO my_list (user_id, movie_id) VALUES ($1, $2)",
      [user_id, movie_id]
    );

    return res.status(200).json({
      success: true,
      message: "Added to list",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update list",
    });
  }
});


// ─────────────────────────────────────────────
// GET MY LIST
// ─────────────────────────────────────────────
mylist.get("/get_my_list", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const { rows } = await database.query(
      `SELECT m.movie_id, m.title, m.banner_url, m.description, m.type 
       FROM my_list ml 
       JOIN movies m ON ml.movie_id = m.movie_id 
       WHERE ml.user_id = $1 
       ORDER BY ml.created_at DESC`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: "List fetched successfully",
      data: rows as MyListRow[],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list",
    });
  }
});


// ─────────────────────────────────────────────
// REMOVE FROM LIST (explicit remove)
// ─────────────────────────────────────────────
mylist.post("/remove-from-mylist", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { movie_id } = req.body;
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        message: "Movie ID is required",
      });
    }

    const result = await database.query(
      "DELETE FROM my_list WHERE user_id = $1 AND movie_id = $2",
      [user_id, movie_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found in your list",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Removed from list",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from list",
    });
  }
});


export default mylist;