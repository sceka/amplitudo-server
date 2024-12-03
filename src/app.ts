import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import allApiRoutes from "./api";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieSession from "cookie-session";
import "./util/passport";
import passport from "passport";

dotenv.config();

const server = express();
server.use(express.json());

const PORT = process.env.PORT || 3001;

server.use(
	cookieSession({
		name: "google-auth-session",
		keys: ["key1", "key2"]
	})
);

server.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true
	})
);

server.use(passport.initialize());
server.use(passport.session());

mongoose
	.connect("mongodb://127.0.0.1:27017/")
	.then(() => console.log("Connected to MongoDB"))
	.catch(err => console.log(err));

server.use(cookieParser());

server.use("/api", allApiRoutes);

server.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
