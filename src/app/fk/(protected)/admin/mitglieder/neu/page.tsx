import { redirect } from "next/navigation";

// Mitglieder werden zentral im Portal verwaltet
export default function NewMemberPage() {
  redirect("/fk/admin/mitglieder");
}
