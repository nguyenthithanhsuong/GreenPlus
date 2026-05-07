import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000";

export default async function HomePage() {
	const cookieStore = await cookies();
	const roleName = cookieStore.get("gp_role_name")?.value?.trim().toLowerCase() ?? "";

	if (roleName === "customer") {
		redirect(`${CLIENT_LOGIN_URL}/login`);
	}

	if (roleName && roleName !== "admin" && roleName !== "employee") {
		redirect(`${CLIENT_LOGIN_URL}/login`);
	}

	if (roleName === "admin" || roleName === "employee") {
		redirect("/dashboard");
	}

	redirect(`${CLIENT_LOGIN_URL}/login`);
}

