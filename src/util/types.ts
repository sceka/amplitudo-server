export type GenericRequest = {
	userId: string;
	role: "admin" | "user";
};

export type UserType = {
	_id: string;
	firstName: string;
	lastName: string;
	dateOfBirth?: Date;
	country?: string;
	image?: string;
	gender?: "male" | "female" | "other";
	school?: string;
	cv?: string;
	role: "user" | "admin";
	email: string;
	password: string;
	refreshTokenHash?: string;
};

export type LinkForms = {
	userId: string;
	active: boolean;
};
