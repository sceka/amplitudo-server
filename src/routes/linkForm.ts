import { Router, Request, Response } from "express";
import { LinkForm } from "../models/linkForms";
import { wrapError } from "../middleware/api";

const router = Router();

async function checkLinkForm(req: Request, res: Response) {
	const { id } = req.params;

	const linkForm = await LinkForm.findOne({ userId: id });
	console.log({ linkForm });

	if (!linkForm || !linkForm.active) {
		return res.sendStatus(403);
	}

	res.sendStatus(200);
}

router.get("/check-link/:id", wrapError(checkLinkForm));

export default router;
