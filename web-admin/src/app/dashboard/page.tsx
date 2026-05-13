import Dashboard from "../../../frontend/dashboard/Dashboard";

// const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000";

// export const metadata: Metadata = {
// 	title: "Admin Dashboard",
// };

// export default async function Page() {
// 	const cookieStore = await cookies();
// 	const roleName = cookieStore.get("gp_role_name")?.value?.trim().toLowerCase() ?? "";

// 	if (!roleName) {
// 		redirect("/login");
// 	}

// 	if (roleName === "customer") {
// 		redirect(`${CLIENT_LOGIN_URL}/login`);
// 	}

// 	if (roleName && roleName !== "admin" && roleName !== "employee") {
// 		redirect("/login");
// 	}

// 	if (roleName !== "admin" && roleName !== "employee") {
// 		redirect("/login");
// 	}

// 	return <Dashboard />;
// }

export default Dashboard;