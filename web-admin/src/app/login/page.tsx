import { redirect } from "next/navigation";

const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000";

export default function LoginPage() {
	redirect(`${CLIENT_LOGIN_URL}/login`);
}