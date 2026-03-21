import dotenv from "dotenv";
dotenv.config()
import express from "express"
import cors from "cors"
import auth from "./auth.ts";
import profile from "./profile.ts";
import setting from "./setting.ts";
import movie from "./movie.ts";
import mylist from "./mylist.ts";
import cast from "./cast.ts";
import devices from "./devices.ts";
import otp from "./otp.ts";
import health from "./healthcheck.ts";
import update from "./credential_update.ts";
import { verifyMailConnection } from './utils/mail.ts';

const app=express();
const PORT= process.env.PORT || 3001;

app.use(express.json())
app.use(cors())

app.use("/api/auth", auth);
app.use("/api/otp", otp);
app.use("/api/profile", profile);
app.use("/api/setting", setting);
app.use("/api/movie", movie);
app.use("/api/mylist", mylist);
app.use("/api/cast", cast);
app.use("/api/devices", devices);
app.use("/api/update", update);
app.use("/api", health);


const start = async () => {
  await verifyMailConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
