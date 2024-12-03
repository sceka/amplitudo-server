import passport from "passport";
import { UserType } from "./types";
import { User } from "../models/user";

export function tryCatch<T, F>(fn: () => T, fallback: F) {
	try {
		return fn();
	} catch {
		return fallback;
	}
}

export function serializeUser() {
	return passport.serializeUser((user: any, done: any) => {
		done(null, user._id);
	});
}

export function deserializeUser() {
	return passport.deserializeUser(async (id: string, done) => {
		const user = await User.findById(id);
		done(null, user);
	});
}
