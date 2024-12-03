import mongoose, { Schema } from "mongoose";
import { LinkForms } from "../util/types";

const linkFormSchema = new Schema<LinkForms>({
	userId: String,
	active: Boolean
});

export const LinkForm = mongoose.model<LinkForms>("LinkForm", linkFormSchema);
