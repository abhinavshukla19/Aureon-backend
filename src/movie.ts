import express from "express";
import database from "./db.ts";
import type { Request, Response } from "express";
import { authmiddeware } from "./auth_middleware.ts";

const movie = express.Router();

type MovieRow = {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
  duration: number;
  genre: string;
  banner_url: string;
  movie_url: string;
  audio_languages: string;
  subtitle_languages: string;
  type: string;
  created_at: Date | null;
  // top movies
  rank_position?: number;
  // continue watching
  progress?: number;
  remaining_time?: number;
  watched_percent?: number;
  updated_at?: Date;
};



// ─────────────────────────────────────────────
// GET ALL MOVIES
// ─────────────────────────────────────────────
movie.get("/get_all_movie", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const { rows } = await database.query("SELECT * FROM movies");

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: rows as MovieRow[],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching movies",
    });
  }
});


// ─────────────────────────────────────────────
// TOP 5 MOVIES
// ─────────────────────────────────────────────
movie.get("/topfivemovies", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const { rows } = await database.query(
      `SELECT m.movie_id, m.title, m.banner_url, tm.rank_position 
       FROM top_movies tm 
       JOIN movies m ON tm.movie_id = m.movie_id 
       ORDER BY tm.rank_position ASC`
    );

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: rows as MovieRow[],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching top movies",
    });
  }
});


// ─────────────────────────────────────────────
// MOVIE DETAIL BY ID
// ─────────────────────────────────────────────
movie.get("/moviedetailbyid/:id", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const movie_id = req.params.id;

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        message: "Movie ID is required",
      });
    }

    const { rows } = await database.query(
      "SELECT * FROM movies WHERE movie_id = $1",
      [movie_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie fetched successfully",
      data: rows[0] as MovieRow,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching movie",
    });
  }
});


// ─────────────────────────────────────────────
// CONTINUE WATCHING — fetch
// ─────────────────────────────────────────────
movie.get("/continue_watching", authmiddeware, async (req: Request, res: Response) => {
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
          cw.*,
          m.banner_url,
          m.title,
          m.duration,
          GREATEST(m.duration - cw.progress, 0) AS remaining_time,
          LEAST(ROUND((cw.progress / NULLIF(m.duration, 0)) * 100), 100) AS watched_percent
       FROM continue_watching cw
       JOIN movies m ON cw.movie_id = m.movie_id
       WHERE cw.user_id = $1
       ORDER BY cw.updated_at DESC`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: rows as MovieRow[],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching continue watching",
    });
  }
});


// ─────────────────────────────────────────────
// CONTINUE WATCHING — add/update timestamp
// ─────────────────────────────────────────────
movie.post("/add_watching_timesatmp", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { movie_id, progress } = req.body;
    const user_id = req.authentication?.user_id;

    if (!movie_id || progress == null) {
      return res.status(400).json({
        success: false,
        message: "Movie ID and progress are required",
      });
    }

    if (typeof progress !== "number" || progress < 0) {
      return res.status(400).json({
        success: false,
        message: "Progress must be a positive number",
      });
    }

    await database.query(
      `INSERT INTO continue_watching (user_id, movie_id, progress, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, movie_id) DO UPDATE
       SET progress = EXCLUDED.progress,
           updated_at = NOW()`,
      [user_id, movie_id, progress]
    );

    return res.status(200).json({
      success: true,
      message: "Progress saved successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error saving progress",
    });
  }
});


export default movie;