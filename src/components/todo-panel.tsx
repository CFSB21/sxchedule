import { useState, type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { SidePanel } from "@/components/side-panel";
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
import { useLongPress } from "@/lib/alba/long-press";
import { useRoutineStore } from "@/lib/alba/store";
import { formatLongDate, fromDateKey } from "@/lib/alba/time";
import type { TodoItem } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

export function TodoPanel({
  open,
  date,
  onClose,
}: {
  open: boolean;
  date: string;
  onClose: () => void;
}) {
  const todos = useRoutineStore((s) => s.todos);
  const addTodo = useRoutineStore((s) => s.addTodo);
  const toggleTodo = useRoutineStore((s) => s.toggleTodo);
  const updateTodo = useRoutineStore((s) => s.updateTodo);
  const deleteTodo = useRoutineStore((s) => s.deleteTodo);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const items = todos
    .filter((t) => t.date === date)
    .sort((a, b) => a.order - b.order);

  function submit(e: FormEvent) {
    e.preventDefault();
    addTodo(date, draft);
    setDraft("");
  }

  return (
    <SidePanel
      open={open}
      side="right"
      title="To-Do"
      subtitle={formatLongDate(fromDateKey(date))}
      onClose={onClose}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin tareas para este día.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <TodoRow
              key={item.id}
              item={item}
              onToggle={() => toggleTodo(item.id)}
              onEdit={() => {
                setEditing(item);
                setEditTitle(item.title);
              }}
            />
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nueva tarea"
          maxLength={80}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Añadir tarea"
          disabled={!draft.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </form>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
            <DialogDescription>Solo para este día.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing) return;
              updateTodo(editing.id, editTitle);
              setEditing(null);
              toast.success("Tarea actualizada");
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="todo-edit">Tarea</Label>
              <Input
                id="todo-edit"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={80}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!editing) return;
                deleteTodo(editing.id);
                setEditing(null);
                toast.success("Tarea eliminada");
              }}
            >
              Eliminar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SidePanel>
  );
}

function TodoRow({
  item,
  onToggle,
  onEdit,
}: {
  item: TodoItem;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const lp = useLongPress(onEdit);
  return (
    <li
      {...lp}
      className="flex select-none items-center gap-3 rounded-lg bg-secondary/70 px-2 py-2"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={item.done}
        aria-label={
          item.done ? `Desmarcar ${item.title}` : `Completar ${item.title}`
        }
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-md transition-colors",
          item.done
            ? "bg-primary text-primary-foreground"
            : "bg-card text-muted-foreground",
        )}
      >
        {item.done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-border" />}
      </button>
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          item.done && "text-muted-foreground line-through",
        )}
      >
        {item.title}
      </p>
    </li>
  );
}
