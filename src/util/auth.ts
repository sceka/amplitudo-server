import { ACCESS_TOKEN_DURATION_S, DAY_S, MIN_S, REFRESH_TOKEN_DURATION_S } from "./constants";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export function decodeJWToken(token: string, type: "access" | "refresh" = "access") {
	const secret =
		type === "access" ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
	if (!secret) {
		throw new Error(`Cannot decode ${type} JWToken: secret is not defined`);
	}

	return jwt.verify(token, secret);
}

export function getDecodedJWTokenFromRequest(
	req: Request,
	tokenType: "access" | "refresh" = "access"
) {
	const encodedToken = getRawJWTokenFromRequest(req);

	if (!encodedToken) {
		throw new Error("No token found in request");
	}

	return decodeJWToken(encodedToken, tokenType);
}

export function getRawJWTokenFromRequest(req: Request, type: "access" | "refresh" = "access") {
	return req.cookies?.[`${type}_token`];
}

export function encodeJWToken(payload: JwtPayload, type: "access" | "refresh" = "access") {
	const secret =
		type === "access" ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
	if (!secret) {
		throw new Error(`Cannot encode ${type} JWToken: secret is not defined`);
	}

	let options = {};

	if (!payload.exp) {
		options = {
			expiresIn: type === "access" ? ACCESS_TOKEN_DURATION_S : REFRESH_TOKEN_DURATION_S
		};
	}

	return jwt.sign(payload, secret, options);
}

export function setTokenCookie(res: Response, type: "access" | "refresh", token: string) {
	res.cookie(`${type}_token`, token, {
		httpOnly: false,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
		maxAge: type === "access" ? ACCESS_TOKEN_DURATION_S * 1000 : REFRESH_TOKEN_DURATION_S * 1000
	});
}

export function removeAuthTokenCookies(res: Response) {
	res.clearCookie("access_token");
	res.clearCookie("refresh_token");
}
