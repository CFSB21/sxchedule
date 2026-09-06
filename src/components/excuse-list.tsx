import { useMemo } from "react";
import { useStatsYear } from "@/components/year-select";
import { excuseCounts } from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";

export function ExcuseList() {
  const completions = useRoutineStore((s) => s.completions);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const { range } = useStatsYear();
  const { start, asOf } = range;
  const rows = useMemo(
    () => excuseCounts(completions, start, asOf, passiveChecks),
    [completions, passiveChecks, start, asOf],
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="alba-enter alba-enter-4 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <h2 className="font-medium">Excusas</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {total === 0
          ? "Motivos tras un incumplimiento"
          : `${total} incumplimiento${total === 1 ? "" : "s"}`}
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay excusas registradas.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.excuse}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <p className="min-w-0 flex-1 text-sm break-words">{row.excuse}</p>
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                ×{row.count}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
