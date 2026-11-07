import { redirect } from "next/navigation";
import { getMyCompanies } from "@/lib/company";

// Home: go straight into the user's first company, or set one up.
export default async function Home() {
  const companies = await getMyCompanies();
  if (companies.length === 0) redirect("/companies/new");
  if (companies.length === 1) redirect(`/c/${companies[0].id}/dashboard`);
  redirect("/companies");
}
