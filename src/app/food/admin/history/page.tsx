import { db } from "@/lib/db";
import { foodUsers, foodRegistrations } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";

export default async function HistoryPage() {
  const now = new Date();
  const d90 = new Date(now.getTime() - 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const d30 = new Date(now.getTime() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  const topUsers = await db
    .select({
      userId: foodUsers.id,
      name: foodUsers.name,
      totalRegs: sql<number>`count(${foodRegistrations.id})`.as("total_regs"),
    })
    .from(foodUsers)
    .leftJoin(foodRegistrations, eq(foodUsers.id, foodRegistrations.userId))
    .groupBy(foodUsers.id, foodUsers.name)
    .orderBy(desc(sql`count(${foodRegistrations.id})`))
    .limit(10);

  const allUsers = await db
    .select({
      userId: foodUsers.id,
      name: foodUsers.name,
      personalNumber: foodUsers.personalNumber,
    })
    .from(foodUsers)
    .orderBy(foodUsers.name);

  const userStats = await Promise.all(
    allUsers.map(async (u) => {
      const [r90] = await db
        .select({ count: sql<number>`count(*)` })
        .from(foodRegistrations)
        .where(
          sql`${foodRegistrations.userId} = ${u.userId} AND ${foodRegistrations.date} >= ${d90}`,
        );
      const [r30] = await db
        .select({ count: sql<number>`count(*)` })
        .from(foodRegistrations)
        .where(
          sql`${foodRegistrations.userId} = ${u.userId} AND ${foodRegistrations.date} >= ${d30}`,
        );
      const [r7] = await db
        .select({ count: sql<number>`count(*)` })
        .from(foodRegistrations)
        .where(
          sql`${foodRegistrations.userId} = ${u.userId} AND ${foodRegistrations.date} >= ${d7}`,
        );

      return {
        ...u,
        last90: Number(r90.count),
        last30: Number(r30.count),
        last7: Number(r7.count),
      };
    }),
  );

  const badges = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historie</h1>

      {/* Top 10 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Top 10 Stammesser</h2>
        <div className="space-y-2">
          {topUsers.map((u, i) => (
            <div
              key={u.userId}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">
                  {badges[i] ?? `${i + 1}.`}
                </span>
                <span className="font-medium">{u.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {u.totalRegs} Anmeldungen
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  90 Tage
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  30 Tage
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  7 Tage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userStats.map((u) => (
                <tr key={u.userId} className="hover:bg-muted/30">
                  <td className="p-3 text-sm">{u.name}</td>
                  <td className="p-3 text-sm text-right">{u.last90}</td>
                  <td className="p-3 text-sm text-right">{u.last30}</td>
                  <td className="p-3 text-sm text-right">{u.last7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
