import mongoose, { Schema } from "mongoose";
import { UserType } from "../util/types";

const userSchema = new Schema<UserType>({
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	country: String,
	cv: String,
	dateOfBirth: Date,
	image: String,
	role: {
		type: String,
		required: true
	},
	school: String,
	gender: String,
	email: {
		type: String,
		required: true
	},
	password: {
		type: String
	},
	refreshTokenHash: {
		type: String
	}
});

userSchema.index({ name: "text", city: "text", country: "text" });

export const User = mongoose.model<UserType>("User", userSchema);
