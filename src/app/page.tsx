import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Route root "/" to the user's preferred locale (from cookie) or English.
export default async function RootPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("nightcap-lang")?.value;
  redirect(lang === "zh-CN" ? "/zh-CN" : "/en");
}

export const dynamic = "force-dynamic";