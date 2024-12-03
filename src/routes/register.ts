import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { User } from "../models/user";
import { wrapError } from "../middleware/api";
import { UserType } from "../util/types";
import { upload } from "../util/upload";
import { REFRESH_TOKEN_SALT_ROUNDS } from "../util/constants";
import { sendEmail } from "../util/emailService";
import { LinkForm } from "../models/linkForms";
const router = Router();

async function registerUser(req: Request, res: Response) {
	const { image, cv } = req.files as { [filename: string]: Express.Multer.File[] };
	const user = req.body;

	const userExists = await User.findOne({ email: user.email });
	if (userExists) return res.sendStatus(400);

	const userToSave = new User({
		...user,
		cv: cv ? cv[0].path : null,
		image: image ? image[0].path : null,
		role: "user"
	});

	const savedUser = await userToSave.save();

	const templateData = {
		createPasswordLink: `http://localhost:3000/create-password?userId=${savedUser._id}`
	};
	await sendEmail(user.email, "login", templateData);

	const linkForm = new LinkForm({
		active: true,
		userId: savedUser._id
	});

	await linkForm.save();

	return res.sendStatus(200);
}

router.post("/", upload.fields([{ name: "image" }, { name: "cv" }]), wrapError(registerUser));

export default router;
