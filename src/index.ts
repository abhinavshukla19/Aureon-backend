import dotenv from "dotenv";
dotenv.config()
import express from "express"
import cors from "cors"
import auth from "./auth.js";
import profile from "./profile.js";
import setting from "./setting.js";
import movie from "./movie.js";
import mylist from "./mylist.js";
import cast from "./cast.js";
import devices from "./devices.js";
import otp from "./otp.js";
import health from "./healthcheck.js";
import update from "./credential_update.js";
import { verifyMailConnection } from "./utils/mail.js";

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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
