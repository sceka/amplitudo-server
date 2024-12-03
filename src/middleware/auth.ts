import { NextFunction, Request, Response } from "express";
import { getDecodedJWTokenFromRequest } from "../util/auth";
import { JwtPayload } from "jsonwebtoken";

export function authUser(req: Request, res: Response, next: NextFunction) {
	try {
		const tokenData = getDecodedJWTokenFromRequest(req);

		req.body.userId = (tokenData as JwtPayload).userId;
		req.body.role = (tokenData as JwtPayload).role;

		next();
	} catch (err) {
		res.sendStatus(401);
	}
}

export function authRole(req: Request, res: Response, next: NextFunction) {
	try {
		console.log("upada odje");
		const tokenData = getDecodedJWTokenFromRequest(req);
		console.log({ tokenData });
		(tokenData as JwtPayload).role === "admin";
		next();
	} catch (err) {
		res.sendStatus(401);
	}
}
