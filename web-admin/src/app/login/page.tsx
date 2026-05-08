import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000";

export default async function LoginPage() {
	const cookieStore = await cookies();
	const roleName = cookieStore.get("gp_role_name")?.value?.trim().toLowerCase() ?? "";

	if (roleName === "admin" || roleName === "employee") {
		redirect("/dashboard");
	}

	if (roleName === "customer") {
		redirect(`${CLIENT_LOGIN_URL}/login`);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">GreenPlus Admin</p>
				<h1 className="mt-3 text-3xl font-semibold">Admin login</h1>
				<p className="mt-3 text-sm leading-6 text-slate-600">
					This page stays on localhost:3001 so admin sessions remain local to the admin app.
					If you need to sign in first, open the shared portal and then return here.
				</p>
				<div className="mt-6 flex flex-col gap-3 sm:flex-row">
					<Link
						href={`${CLIENT_LOGIN_URL}/login`}
						className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
					>
						Open shared login
					</Link>
					<Link
						href="/dashboard"
						className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
					>
						Go to dashboard
					</Link>
				</div>
			</div>
		</main>
	);
}