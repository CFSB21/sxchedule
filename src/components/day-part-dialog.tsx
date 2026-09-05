import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPartRange, hmInputValue } from "@/lib/alba/day-parts";
import { parseTimeToMinutes } from "@/lib/alba/time";
import type { DayPartConfig } from "@/lib/alba/types";

export function DayPartDialog({
  open,
  part,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  part: DayPartConfig | null;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: { name: string; startMin: number; endMin: number }) => void;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("05:00");
  const [end, setEnd] = useState("12:00");

  useEffect(() => {
    if (!open || !part) return;
    setName(part.name);
    setStart(hmInputValue(part.startMin));
    setEnd(hmInputValue(part.endMin));
  }, [open, part]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !part) return;
    onSave({
      name: trimmed,
      startMin: parseTimeToMinutes(start),
      endMin: parseTimeToMinutes(end),
    });
    onOpenChange(false);
  }

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Momento del día</DialogTitle>
          <DialogDescription>
            Cambia el nombre y el rango. Solo desde este día; el pasado no
            cambia. Ahora: {formatPartRange(part)}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="part-name">Nombre</Label>
            <Input
              id="part-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="part-start">Desde</Label>
              <Input
                id="part-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-end">Hasta</Label>
              <Input
                id="part-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si «Hasta» es más temprano que «Desde», el tramo cruza medianoche.
          </p>
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
