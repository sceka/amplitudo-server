import { Router, Request, Response } from "express";
import { User } from "../models/user";
import { authRole, authUser } from "../middleware/auth";
import { wrapError } from "../middleware/api";

const router = Router();

async function searchUsers(req: Request, res: Response) {
	try {
		console.log(req.params);
		const { query } = req.params;
		console.log("query", query);

		const searchQuery = {
			$or: [
				{ firstName: { $regex: query, $options: "i" } },
				{ city: { $regex: query, $options: "i" } },
				{ country: { $regex: query, $options: "i" } }
			]
		};

		const items = await User.find(searchQuery);
		console.log({ items });
		res.json(items);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
}

router.get("/:query", authUser, authRole, wrapError(searchUsers));

export default router;
