import { fkAuth } from "@/lib/fk-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FkLoginPage() {
  const session = await fkAuth();
  if (session) redirect("/fk/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            🚒
          </div>
          <CardTitle className="text-2xl">Führerscheinkontrolle</CardTitle>
          <CardDescription>
            Die Anmeldung erfolgt über das Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Bitte melde dich zuerst im Portal an und öffne dann die
            Führerscheinkontrolle über die App-Kachel.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Zum Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
