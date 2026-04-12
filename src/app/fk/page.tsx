import { redirect } from "next/navigation";
import { fkAuth } from "@/lib/fk-auth";

export default async function FkHome() {
  const session = await fkAuth();

  if (session) {
    redirect("/fk/dashboard");
  } else {
    redirect("/fk/login");
  }
}
