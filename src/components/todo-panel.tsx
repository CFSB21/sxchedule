import { useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronRight, ListTree, Plus } from "lucide-react";
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
import { childrenOf, isGroup, rootsOnDate } from "@/lib/alba/todos";
import { formatLongDate, fromDateKey } from "@/lib/alba/time";
import type { TodoItem, TodoKind } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

type AddMode =
  | null
  | { step: "pick" }
  | { step: "name"; kind: TodoKind; parentId?: string };

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
  const [adding, setAdding] = useState<AddMode>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const dayTodos = todos.filter((t) => t.date === date);
  const roots = rootsOnDate(dayTodos, date);

  function openAdd(mode: AddMode) {
    setDraft("");
    setAdding(mode);
  }

  function submitAdd(e: FormEvent) {
    e.preventDefault();
    if (!adding || adding.step !== "name") return;
    addTodo(date, draft, {
      kind: adding.kind,
      parentId: adding.parentId,
    });
    if (adding.parentId) {
      setOpenGroups((g) => ({ ...g, [adding.parentId!]: true }));
    }
    setAdding(null);
    setDraft("");
  }

  return (
    <SidePanel
      open={open}
      side="right"
      title="To-Do"
      subtitle={formatLongDate(fromDateKey(date))}
      headerAction={
        <button
          type="button"
          onClick={() => openAdd({ step: "pick" })}
          className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Añadir"
        >
          <Plus className="size-4" />
        </button>
      }
      onClose={onClose}
    >
      {roots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin tareas para este día.
        </p>
      ) : (
        <ul className="space-y-2">
          {roots.map((item) => {
            const kids = childrenOf(dayTodos, item.id);
            const expanded = openGroups[item.id] ?? true;
            return (
              <li key={item.id} className="space-y-1.5">
                <TodoRow
                  item={item}
                  group={isGroup(item)}
                  expanded={expanded}
                  onToggle={() => toggleTodo(item.id)}
                  onExpand={
                    isGroup(item)
                      ? () =>
                          setOpenGroups((g) => ({
                            ...g,
                            [item.id]: !expanded,
                          }))
                      : undefined
                  }
                  onAddChild={
                    isGroup(item)
                      ? () =>
                          openAdd({
                            step: "name",
                            kind: "task",
                            parentId: item.id,
                          })
                      : undefined
                  }
                  onEdit={() => {
                    setEditing(item);
                    setEditTitle(item.title);
                  }}
                />
                {isGroup(item) && expanded ? (
                  <ul className="ml-4 space-y-1.5 border-l border-border pl-3">
                    {kids.length === 0 ? (
                      <li className="px-2 py-1 text-xs text-muted-foreground">
                        Sin tareas dentro
                      </li>
                    ) : (
                      kids.map((child) => (
                        <TodoRow
                          key={child.id}
                          item={child}
                          nested
                          onToggle={() => toggleTodo(child.id)}
                          onEdit={() => {
                            setEditing(child);
                            setEditTitle(child.title);
                          }}
                        />
                      ))
                    )}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={adding !== null}
        onOpenChange={(next) => {
          if (!next) setAdding(null);
        }}
      >
        <DialogContent>
          {adding?.step === "pick" ? (
            <>
              <DialogHeader>
                <DialogTitle>Añadir</DialogTitle>
                <DialogDescription>
                  Una tarea suelta o una mayor con lista dentro.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Button
                  onClick={() => openAdd({ step: "name", kind: "task" })}
                >
                  <Plus className="size-4" />
                  Tarea
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openAdd({ step: "name", kind: "group" })}
                >
                  <ListTree className="size-4" />
                  Tarea mayor
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {adding?.kind === "group"
                    ? "Tarea mayor"
                    : adding?.parentId
                      ? "Tarea de la lista"
                      : "Tarea"}
                </DialogTitle>
                <DialogDescription>Solo para este día.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={submitAdd}>
                <div className="grid gap-2">
                  <Label htmlFor="todo-new">Nombre</Label>
                  <Input
                    id="todo-new"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={80}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!draft.trim()}>
                  Añadir
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing && isGroup(editing) ? "Editar tarea mayor" : "Editar tarea"}
            </DialogTitle>
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
              <Label htmlFor="todo-edit">Nombre</Label>
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
  group,
  nested,
  expanded,
  onToggle,
  onExpand,
  onAddChild,
  onEdit,
}: {
  item: TodoItem;
  group?: boolean;
  nested?: boolean;
  expanded?: boolean;
  onToggle: () => void;
  onExpand?: () => void;
  onAddChild?: () => void;
  onEdit: () => void;
}) {
  const lp = useLongPress(onEdit);
  return (
    <div
      {...lp}
      className={cn(
        "flex select-none items-start gap-2 rounded-lg bg-secondary/70 px-2 py-2",
        nested && "bg-secondary/40",
      )}
    >
      {group ? (
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar lista" : "Mostrar lista"}
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      ) : null}
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
        {item.done ? (
          <Check className="size-4" />
        ) : (
          <span className="size-2 rounded-full bg-border" />
        )}
      </button>
      <p
        className={cn(
          "min-w-0 flex-1 py-2.5 text-sm font-medium break-words",
          item.done && "text-muted-foreground line-through",
        )}
      >
        {item.title}
      </p>
      {onAddChild ? (
        <button
          type="button"
          onClick={onAddChild}
          aria-label={`Añadir tarea a ${item.title}`}
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
