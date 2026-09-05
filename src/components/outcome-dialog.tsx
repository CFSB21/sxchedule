import { useEffect, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OutcomeDialog({
  open,
  habitName,
  startOnExcuse = false,
  onOpenChange,
  onDone,
  onFail,
}: {
  open: boolean;
  habitName: string;
  startOnExcuse?: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  onFail: (excuse: string) => void;
}) {
  const [mode, setMode] = useState<"choose" | "excuse">(
    startOnExcuse ? "excuse" : "choose",
  );
  const [excuse, setExcuse] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(startOnExcuse ? "excuse" : "choose");
    setExcuse("");
  }, [open, habitName, startOnExcuse]);

  function submitExcuse(e: FormEvent) {
    e.preventDefault();
    const text = excuse.trim();
    if (!text) return;
    onFail(text);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {mode === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Cómo salió?</DialogTitle>
              <DialogDescription>
                El tiempo de {habitName} terminó. Márcalo para cerrar el ciclo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Button
                className="w-full"
                onClick={() => {
                  onDone();
                  onOpenChange(false);
                }}
              >
                <Check className="size-4" />
                Completada
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode("excuse")}
              >
                <X className="size-4" />
                Fallida
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={submitExcuse} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Excusa</DialogTitle>
              <DialogDescription>
                Cuenta por qué no se completó {habitName}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="excuse">Motivo</Label>
              <Textarea
                id="excuse"
                value={excuse}
                onChange={(e) => setExcuse(e.target.value)}
                maxLength={280}
                required
                placeholder="Se me hizo tarde, cambió el plan…"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {!startOnExcuse ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode("choose")}
                >
                  Atrás
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={!excuse.trim()}>
                Guardar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
