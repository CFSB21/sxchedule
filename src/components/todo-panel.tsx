import { useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListTree,
  Plus,
} from "lucide-react";
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
import {
  childrenOf,
  isGroup,
  listComplete,
  rootsOnDate,
} from "@/lib/alba/todos";
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
  const moveTodo = useRoutineStore((s) => s.moveTodo);
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
          {roots.map((item, index) => {
            const kids = childrenOf(dayTodos, item.id);
            const expanded = openGroups[item.id] ?? true;
            const done = isGroup(item)
              ? listComplete(dayTodos, item.id)
              : item.done;
            return (
              <li key={item.id} className="space-y-1.5">
                {isGroup(item) ? (
                  <ListHeader
                    item={item}
                    done={done}
                    expanded={expanded}
                    canUp={index > 0}
                    canDown={index < roots.length - 1}
                    onExpand={() =>
                      setOpenGroups((g) => ({ ...g, [item.id]: !expanded }))
                    }
                    onAdd={() =>
                      openAdd({
                        step: "name",
                        kind: "task",
                        parentId: item.id,
                      })
                    }
                    onMove={(dir) => moveTodo(item.id, dir)}
                    onEdit={() => {
                      setEditing(item);
                      setEditTitle(item.title);
                    }}
                  />
                ) : (
                  <TaskRow
                    item={item}
                    canUp={index > 0}
                    canDown={index < roots.length - 1}
                    onToggle={() => toggleTodo(item.id)}
                    onMove={(dir) => moveTodo(item.id, dir)}
                    onEdit={() => {
                      setEditing(item);
                      setEditTitle(item.title);
                    }}
                  />
                )}
                {isGroup(item) && expanded ? (
                  <ul className="ml-3 space-y-1.5 border-l border-border pl-3">
                    {kids.length === 0 ? (
                      <li className="px-2 py-1 text-xs text-muted-foreground">
                        Sin tareas dentro
                      </li>
                    ) : (
                      kids.map((child, childIndex) => (
                        <TaskRow
                          key={child.id}
                          item={child}
                          nested
                          canUp={childIndex > 0}
                          canDown={childIndex < kids.length - 1}
                          onToggle={() => toggleTodo(child.id)}
                          onMove={(dir) => moveTodo(child.id, dir)}
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
                  Una tarea suelta o una lista con tareas dentro.
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
                  Lista
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {adding?.kind === "group"
                    ? "Lista"
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
              {editing && isGroup(editing) ? "Editar lista" : "Editar tarea"}
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
              toast.success(
                isGroup(editing) ? "Lista actualizada" : "Tarea actualizada",
              );
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
                toast.success(
                  isGroup(editing) ? "Lista eliminada" : "Tarea eliminada",
                );
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

function ListHeader({
  item,
  done,
  expanded,
  canUp,
  canDown,
  onExpand,
  onAdd,
  onMove,
  onEdit,
}: {
  item: TodoItem;
  done: boolean;
  expanded: boolean;
  canUp: boolean;
  canDown: boolean;
  onExpand: () => void;
  onAdd: () => void;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
}) {
  const lp = useLongPress(onEdit);
  return (
    <div
      {...lp}
      className="flex select-none items-center gap-1 rounded-lg bg-secondary/70 px-1 py-1"
    >
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={expanded}
        aria-label={expanded ? "Ocultar lista" : "Mostrar lista"}
        className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
      <p
        className={cn(
          "min-w-0 flex-1 py-2 text-sm font-medium leading-snug",
          done && "text-muted-foreground line-through",
        )}
      >
        {item.title}
      </p>
      <MoveButtons canUp={canUp} canDown={canDown} onMove={onMove} />
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Añadir tarea a ${item.title}`}
        className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function TaskRow({
  item,
  nested,
  canUp,
  canDown,
  onToggle,
  onMove,
  onEdit,
}: {
  item: TodoItem;
  nested?: boolean;
  canUp: boolean;
  canDown: boolean;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
}) {
  const lp = useLongPress(onEdit);
  return (
    <div
      {...lp}
      className={cn(
        "flex select-none items-center gap-2 rounded-lg bg-secondary/70 px-2 py-1.5",
        nested && "bg-secondary/40",
      )}
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
        {item.done ? (
          <Check className="size-4" />
        ) : (
          <span className="size-2 rounded-full bg-border" />
        )}
      </button>
      <p
        className={cn(
          "min-w-0 flex-1 py-2 text-sm font-medium leading-snug",
          item.done && "text-muted-foreground line-through",
        )}
      >
        {item.title}
      </p>
      <MoveButtons canUp={canUp} canDown={canDown} onMove={onMove} />
    </div>
  );
}

function MoveButtons({
  canUp,
  canDown,
  onMove,
}: {
  canUp: boolean;
  canDown: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        aria-label="Subir"
        disabled={!canUp}
        onClick={() => onMove(-1)}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Bajar"
        disabled={!canDown}
        onClick={() => onMove(1)}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
