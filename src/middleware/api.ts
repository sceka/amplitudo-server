import { Request, Response, NextFunction, RequestHandler } from "express";
import { getDecodedJWTokenFromRequest } from "../util/auth";
import { JwtPayload } from "jsonwebtoken";

export type GenericEndpointResponse = { status?: number } & Record<string, unknown>;

export function wrapError<CustomRequest extends Request>(
	fn: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void | Response>
): RequestHandler {
	return ((req: CustomRequest, res: Response, next: NextFunction) => {
		try {
			const routePromise = fn(req, res, next);
			if (!routePromise || !routePromise.catch) {
				throw new Error("wrapped a method not returning a promise? " + req.originalUrl);
			} else {
				routePromise.catch(err => next(err));
			}
		} catch (err) {
			console.log(err);
			next(err);
		}
	}) as RequestHandler;
}
