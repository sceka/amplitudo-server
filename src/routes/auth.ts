import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user";

import {
	decodeJWToken,
	encodeJWToken,
	getDecodedJWTokenFromRequest,
	getRawJWTokenFromRequest,
	removeAuthTokenCookies,
	setTokenCookie
} from "../util/auth";
import { wrapError } from "../middleware/api";
import { authUser } from "../middleware/auth";
import { tryCatch } from "../util/helper";
import { JwtPayload } from "jsonwebtoken";
import { UserType } from "../util/types";
import { REFRESH_TOKEN_SALT_ROUNDS } from "../util/constants";
import passport from "passport";
import axios from "axios";

const router = Router();

async function loginUser(req: Request, res: Response) {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		return res.sendStatus(500);
	}

	const isPasswordCorrect = await bcrypt.compare(password, user.password);

	if (!isPasswordCorrect) {
		return res.sendStatus(401);
	}

	const tokenPayload = {
		userId: user._id,
		role: user.role
	};

	const jwtToken = encodeJWToken(tokenPayload);
	const refreshJwtToken = encodeJWToken(tokenPayload, "refresh");

	const refreshTokenHash = await bcrypt.hash(refreshJwtToken, REFRESH_TOKEN_SALT_ROUNDS);

	await User.updateOne({ _id: user._id }, { refreshTokenHash });

	setTokenCookie(res, "access", jwtToken);
	setTokenCookie(res, "refresh", refreshJwtToken);

	res.status(200).json(user.role);
}

async function getUserAuthStatus(req: Request, res: Response) {
	res.sendStatus(200);
}

async function refreshUserTokenPair(req: Request, res: Response) {
	const existingRefreshToken = getRawJWTokenFromRequest(req, "refresh");

	const tokenPayload = tryCatch(() => decodeJWToken(existingRefreshToken, "refresh"), null);
	if (!tokenPayload) {
		removeAuthTokenCookies(res);
		return res.sendStatus(401);
	}

	const { role, userId } = tokenPayload as JwtPayload;
	const user = (await User.findOne({ _id: userId, role })) as unknown as UserType | null;
	if (!user) {
		return res.sendStatus(500);
	}

	const isRefreshTokenValid = user?.refreshTokenHash
		? await bcrypt.compare(existingRefreshToken, user.refreshTokenHash)
		: false;

	if (!isRefreshTokenValid) {
		removeAuthTokenCookies(res);
		return res.sendStatus(404);
	}

	const newAccessToken = encodeJWToken(tokenPayload as JwtPayload, "access");
	const newRefreshToken = encodeJWToken(tokenPayload as JwtPayload, "refresh");

	const refreshTokenHash = await bcrypt.hash(newRefreshToken, REFRESH_TOKEN_SALT_ROUNDS);

	await User.updateOne({ _id: userId }, { refreshTokenHash });

	setTokenCookie(res, "access", newAccessToken);
	setTokenCookie(res, "refresh", newRefreshToken);

	res.sendStatus(200);
}

async function logout(req: Request, res: Response) {
	const { userId, role } = req.body;

	await User.updateOne({ _id: userId }, { refreshTokenHash: null });

	removeAuthTokenCookies(res);

	res.sendStatus(200);
}

async function googleCallback(req: Request, res: Response) {
	try {
		const { code } = req.query;
		try {
			const { data } = await axios.post("https://oauth2.googleapis.com/token", {
				client_id: process.env.GOOGLE_CLIENT_ID,
				client_secret: process.env.GOOGLE_CLIENT_SECRET,
				code,
				redirect_uri: "http://localhost:3001/api/auth/google/callback",
				grant_type: "authorization_code"
			});

			const { access_token } = data;

			const { data: profile } = await axios.get(
				"https://www.googleapis.com/oauth2/v1/userinfo",
				{
					headers: { Authorization: `Bearer ${access_token}` }
				}
			);

			const email = profile.email;
			const displayName = profile.name;
			const firstName = displayName.split(" ")[0];
			const lastName = displayName.split(" ")[1] || "";

			let user = await User.findOne({ email });
			let jwtPayload = {};
			if (!user) {
				user = new User({
					email,
					firstName,
					lastName,
					role: "user"
				});
				const savedUser = await user.save();
				jwtPayload = {
					userId: savedUser._id,
					role: savedUser.role
				};
			}

			jwtPayload = { userId: user._id, role: user.role };

			const accessToken = encodeJWToken(jwtPayload);
			const refreshToken = encodeJWToken(jwtPayload, "refresh");

			setTokenCookie(res, "access", accessToken);
			setTokenCookie(res, "refresh", refreshToken);

			res.redirect("http://localhost:3000/");
		} catch (error) {
			console.error("Error:", error);
			res.redirect("/login");
		}
	} catch (error) {
		console.error("Error during Google callback:", error);
		res.status(500).send("An error occurred during authentication.");
	}
}

router.post("/", wrapError(loginUser));
router.get("/auth-status", authUser, wrapError(getUserAuthStatus));
router.get("/refresh", wrapError(refreshUserTokenPair));
router.post("/logout", authUser, wrapError(logout));
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", wrapError(googleCallback));

export default router;
