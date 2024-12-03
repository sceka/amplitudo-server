import { Router, Request, Response } from "express";
import { User } from "../models/user";
import { authRole, authUser } from "../middleware/auth";
import { wrapError } from "../middleware/api";
import { encodeJWToken, getRawJWTokenFromRequest, setTokenCookie } from "../util/auth";
import { sendEmail } from "../util/emailService";
import bcrypt from "bcrypt";
import { LinkForm } from "../models/linkForms";

const router = Router();

async function getAllUsers(req: Request, res: Response) {
	console.log("upada");
	const page = Number(req.query.page) || 0;
	const limit = Number(req.query.limit) || 10;
	const skip = page * limit;

	const projection = {
		_id: 1,
		firstName: 1,
		lastName: 1,
		country: 1,
		cv: 1,
		dateOfBirth: 1,
		image: 1,
		role: 1,
		school: 1,
		gender: 1,
		email: 1,
		password: 1
	};

	const result = await User.aggregate([
		{
			$match: { role: "user" }
		},
		{
			$facet: {
				users: [
					{
						$skip: skip
					},
					{
						$limit: limit
					},
					{
						$project: projection
					}
				],
				totalCount: [{ $count: "total" }]
			}
		}
	]);

	const users = result[0]?.users || [];
	const totalCount = result[0].totalCount[0]?.total || 0;

	return res.json({ users, totalCount });
}

async function getUser(req: Request, res: Response) {
	const { userId } = req.body;
	console.log({ userId });
	const user = await User.findById(userId);
	if (!user) {
		return res.status(404).send("User doesn't exist");
	}

	res.status(200).json(user);
}

async function deleteUser(req: Request, res: Response) {
	const { id } = req.params;
	try {
		const result = await User.findByIdAndDelete(id);

		if (!result) {
			return res.status(404).send("User not found");
		}

		res.status(200).send("User deleted successfully");
	} catch (error) {
		res.status(500).send("Internal Server Error");
	}
}

async function createNewUser(req: Request, res: Response) {
	try {
		const { email, firstName, lastName } = req.body.user;
		const newUser = new User({
			email: email,
			firstName: firstName,
			lastName: lastName,
			role: "user"
		});

		const savedUser = await newUser.save();

		const templateData = {
			createPasswordLink: `http://localhost:3000/create-password?userId=${savedUser._id}`
		};
		await sendEmail(email, "login", templateData);

		const linkForm = new LinkForm({
			active: true,
			userId: savedUser._id
		});

		await linkForm.save();

		res.sendStatus(200);
	} catch (error) {
		console.log(error);
		res.status(500).send("Internal Server Error");
	}
}

async function createUserPassword(req: Request, res: Response) {
	const { password, userId } = req.body;
	const user = await User.findById(userId);

	bcrypt.hash(password, 10, async (err, hash) => {
		if (err) {
			return res.status(500).send("Internal Server Error");
		}

		await User.updateOne({ _id: userId }, { password: hash });
	});

	const tokenPayload = {
		userId: user?._id,
		role: user?.role
	};

	const accessToken = encodeJWToken(tokenPayload);
	const refreshToken = encodeJWToken(tokenPayload, "refresh");

	setTokenCookie(res, "access", accessToken);
	setTokenCookie(res, "refresh", refreshToken);

	await LinkForm.updateOne({ userId: user?._id }, { active: false });

	return res.sendStatus(200);
}

router.get("/all", authUser, authRole, wrapError(getAllUsers));
router.get("/", authUser, wrapError(getUser));
router.post("/", authUser, authRole, wrapError(createNewUser));
router.delete("/:id", authUser, authRole, wrapError(deleteUser));
router.post("/create-password", wrapError(createUserPassword));

export default router;
