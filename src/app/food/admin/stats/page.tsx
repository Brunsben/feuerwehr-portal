import { db } from "@/lib/db";
import { foodMenus, foodRegistrations, foodGuests } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function StatsPage() {
  const avgResult = await db
    .select({
      avgCount: sql<number>`round(avg(cnt), 1)`.as("avg_count"),
    })
    .from(
      db
        .select({
          date: foodRegistrations.date,
          cnt: sql<number>`count(*)`.as("cnt"),
        })
        .from(foodRegistrations)
        .groupBy(foodRegistrations.date)
        .as("daily_counts"),
    );

  const avgPerDay = avgResult[0]?.avgCount ?? 0;

  const recentDays = await db
    .select({
      date: foodMenus.date,
      description: foodMenus.description,
      zweiMenuesAktiv: foodMenus.zweiMenuesAktiv,
    })
    .from(foodMenus)
    .orderBy(desc(foodMenus.date))
    .limit(14);

  const dayStats = await Promise.all(
    recentDays.map(async (day) => {
      const [regCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(foodRegistrations)
        .where(eq(foodRegistrations.date, day.date));

      const guestRows = await db
        .select({ count: foodGuests.count })
        .from(foodGuests)
        .where(eq(foodGuests.date, day.date));

      const guestTotal = guestRows.reduce((sum, g) => sum + g.count, 0);

      return {
        ...day,
        registrations: Number(regCount.count),
        guests: guestTotal,
        total: Number(regCount.count) + guestTotal,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistiken</h1>
        <Link
          href="/api/food/stats/export"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          CSV Export
        </Link>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Durchschnitt pro Tag</p>
        <p className="text-4xl font-bold mt-1 text-blue-500">{avgPerDay}</p>
        <p className="text-sm text-muted-foreground mt-1">Anmeldungen</p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Datum
                </th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Menü
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  Anmeldungen
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  Gäste
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dayStats.map((day) => (
                <tr key={day.date} className="hover:bg-muted/30">
                  <td className="p-3 text-sm">
                    {new Date(day.date).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                    {day.description}
                  </td>
                  <td className="p-3 text-sm text-right">
                    {day.registrations}
                  </td>
                  <td className="p-3 text-sm text-right text-muted-foreground">
                    {day.guests}
                  </td>
                  <td className="p-3 text-sm text-right font-semibold">
                    {day.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
