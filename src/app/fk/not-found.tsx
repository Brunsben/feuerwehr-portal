import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FkNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            🔍
          </div>
          <CardTitle className="text-2xl">Seite nicht gefunden</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Die angeforderte Seite existiert nicht.
          </p>
          <a
            href="/fk/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Zum Dashboard
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
