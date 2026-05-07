import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_APP_URL = process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:3001";
const SHIPPER_APP_URL = process.env.NEXT_PUBLIC_WEB_SHIPPER_URL ?? "http://localhost:3002";

export default async function HomePage() {
	const cookieStore = await cookies();
	const roleName = cookieStore.get("gp_role_name")?.value?.trim().toLowerCase() ?? "";

	if (roleName === "admin" || roleName === "employee") {
		redirect(`${ADMIN_APP_URL}/dashboard`);
	}

	if (roleName === "shipper") {
		redirect(`${SHIPPER_APP_URL}/`);
	}

	redirect("/login");
}
