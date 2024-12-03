import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user";
import dotenv from "dotenv";

dotenv.config();

passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser(function (user, done) {
	done(null, User);
});

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			callbackURL: "http://localhost:3001/api/auth/google/callback",
			passReqToCallback: true
		},
		function (request, accessToken, refreshToken, profile, done) {
			console.log({ profile });
			return done(null, profile);
		}
	)
);
