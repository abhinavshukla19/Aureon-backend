import express from "express"
import { database } from "./db.js"
import type{ Request , Response } from "express"
import authmiddeware from "./auth_middleware.js"
const movie=express.Router()


type rowdata={
     movie_id: number,
    title: string,
    description: string,
    release_year: number,
    duration: number,
    genre: string,
    banner_url: string,
    movie_url: string,
    audio_languages: string,
    subtitle_languages: string,
    type: string,
    created_at: null
  }

// <-------------------------->
//         movie fetch
// <-------------------------->

movie.get("/get_all_movie", authmiddeware ,async(req:Request , res:Response)=>{
    try{
        const user_id = req.authentication?.user_id;
        if(!user_id){
            return res.status(400).json({success :false , message:"Don't be oversmart! Sign in first"})
        }
        
        const[rows]=await database.query("select * from movies");
        const typedRows = rows as rowdata[]
        const moviedata=typedRows;

        return res.status(200).json({success:true , 
            data:moviedata,
            message:"Data Fetched sucessfully"})
        
    }
    catch(error){
        console.log(error)
        return res.status(404).json({success:false , message:"Error in fetching data"})
    }
})



// <-------------------------------->
//         top 5 movie fetch
// <-------------------------------->

movie.get("/topfivemovies", authmiddeware ,async(req:Request , res:Response)=>{
    try {
        const user_id=req.authentication?.user_id;
        if(!user_id){
            return res.status(400).json({success :false , message:"Don't be oversmart! Sign in first"})
        }
        
        const[rows]=await database.query("SELECT m.movie_id, m.title, m.banner_url, tm.rank_position FROM top_movies tm JOIN movies m ON tm.movie_id = m.movie_id ORDER BY tm.rank_position ASC;");
        const movierows = rows as rowdata[]

        return res.status(200).json({success:true , 
            data:movierows,
            message:"Data Fetched sucessfully"})
        
        
    } catch (error) {
        console.log(error)
        return res.status(404).json({success:false , message:"Error in fetching movie data"})
    }
})


                                            //   MOST IMPORTANT    \\

// <------------------------------------->
//         movie detail movie fetch
// <------------------------------------->

movie.get("/moviedetailbyid/:id", authmiddeware , async(req:Request , res:Response)=>{
    try {
        const user_id=req.authentication?.user_id;
        if(!user_id){
            return res.status(400).json({ message: "User ID is required" });
        }
        const movie_id  = req.params.id;
        if (!movie_id) {
            return res.status(400).json({ message: "Movie ID is required" });
        }
        const [rows]=await database.query("select * from movies where movie_id=?",[movie_id])
        return res.status(200).json({success:true , data:rows})
    } catch (error) {
        console.log(error)
        return res.status(400).json({success:false , message:"error in fetching data"})
    }
    
})



// <--------------------------------------------->
//         continue-watching movie fetch
// <--------------------------------------------->

movie.get("/continue_watching", authmiddeware ,async(req:Request , res:Response)=>{
    try {
        const user_id=req.authentication?.user_id;
        if(!user_id){
            return res.status(400).json({success :false , message:"Don't be oversmart! Sign in first"})
        }
        const[rows]=await database.query(
            `select  
            cw.*,
            m.banner_url,
            m.title,
            m.duration,
            greatest(m.duration-cw.progress,0) as remaining_time,
            LEAST(ROUND((cw.progress / NULLIF(m.duration, 0)) * 100), 100) AS watched_percent
            FROM continue_watching cw
            join movies m
            on cw.movie_id=m.movie_id
            where cw.user_id=?
            order by cw.updated_at desc;
        `   ,[user_id]);
        
        const movierows = rows as rowdata[]

        return res.status(200).json({success:true , 
            data:movierows,
            message:"Data Fetched sucessfully"})
        
    } catch (error) {
        console.log(error)
        return res.status(404).json({success:false , message:"Error in fetching movie data"})
    }
})




// <--------------------------------------------->
//         continue-watching movie adding
// <--------------------------------------------->\

movie.post("/add_watching_timesatmp", authmiddeware , async(req:Request , res:Response)=>{
    try {
        const { movie_id , progress } = req.body;
        const user_id = req.authentication?.user_id;

        if (!movie_id || progress == null) {
        return res.status(400).json({ success: false, message: "Invalid data" });
        }

        await database.query(
        `INSERT INTO continue_watching (user_id, movie_id, progress, updated_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        progress = VALUES(progress),
        updated_at = NOW();`,
        [user_id, movie_id, progress]
        );

        return res.status(200).json({success:true})
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
})






export default movie;