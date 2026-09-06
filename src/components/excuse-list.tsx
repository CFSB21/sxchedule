import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useStatsYear } from "@/components/year-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { excuseCounts } from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";

export function ExcuseList() {
  const completions = useRoutineStore((s) => s.completions);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const { range } = useStatsYear();
  const { start, asOf } = range;
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => excuseCounts(completions, start, asOf, passiveChecks),
    [completions, passiveChecks, start, asOf],
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const hint =
    total === 0
      ? "Motivos tras un incumplimiento"
      : `${total} incumplimiento${total === 1 ? "" : "s"}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="alba-enter alba-enter-4 mt-6 flex w-full items-center gap-3 rounded-xl bg-card p-5 text-left shadow-(--shadow-border)"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Excusas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excusas</DialogTitle>
            <DialogDescription>{hint}</DialogDescription>
          </DialogHeader>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay excusas registradas.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {rows.map((row) => (
                <li
                  key={row.excuse}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 flex-1 text-sm break-words">
                    {row.excuse}
                  </p>
                  <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    ×{row.count}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
