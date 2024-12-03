import nodemailer from "nodemailer";
import { create } from "express-handlebars";
import path from "path";
import { LinkForm } from "../models/linkForms";

const hbs = create({
	extname: ".hbs",
	defaultLayout: false
});

export const sendEmail = async (to: string, templateName: string, templateData: object) => {
	const transporter = await setupEmailTranspoter();
	const mailOptions = await generateMailOptions(to, templateName, templateData);

	try {
		const info = await transporter.sendMail(mailOptions);

		console.log(`Message sent: ${info.messageId}`);
		console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
};

async function renderTemplate(templateName: string, data: any) {
	const templatePath = path.join(__dirname, "../templates", `${templateName}.hbs`);
	return hbs.renderView(templatePath, data);
}

async function generateMailOptions(to: string, templateName: string, templateData: any) {
	const html = await renderTemplate(templateName, templateData);

	const mailOptions = {
		from: "scekicm02@gmail.com",
		to: to,
		subject: "Login/Register Email",
		html
	};

	return mailOptions;
}

async function setupEmailTranspoter() {
	const testAccount = await nodemailer.createTestAccount();

	const transporter = nodemailer.createTransport({
		host: testAccount.smtp.host,
		port: testAccount.smtp.port,
		secure: testAccount.smtp.secure,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass
		}
	});

	return transporter;
}
