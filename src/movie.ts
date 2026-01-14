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




// <------------------------------------->
//         movie detail movie fetch
// <------------------------------------->
movie.get("/moviedetailbyid/:id",async(req:Request , res:Response)=>{
    try {
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
        const[rows]=await database.query("SELECT cw.id, cw.progress_seconds, cw.updated_at, m.movie_id, m.title, m.banner_url, m.duration, m.type FROM continue_watching cw JOIN movies m ON cw.movie_id = m.movie_id WHERE cw.user_id = ? ORDER BY cw.updated_at DESC;",[user_id]);
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





//        continue watching adding logic to table






export default movie;