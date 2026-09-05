import type { TodoItem, TodoKind } from "./types";

export function isGroup(item: TodoItem) {
  return item.kind === "group";
}

export function childrenOf(todos: TodoItem[], parentId: string) {
  return todos
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function rootsOnDate(todos: TodoItem[], date: string) {
  return todos
    .filter((t) => t.date === date && !t.parentId)
    .sort((a, b) => a.order - b.order);
}

export function todoProgress(todos: TodoItem[], date: string) {
  const day = todos.filter((t) => t.date === date);
  const roots = rootsOnDate(day, date);
  let done = 0;
  let total = 0;
  for (const root of roots) {
    const kids = childrenOf(day, root.id);
    if (isGroup(root) && kids.length > 0) {
      total += kids.length;
      done += kids.filter((k) => k.done).length;
    } else {
      total += 1;
      if (root.done) done += 1;
    }
  }
  return { done, total };
}

export function nextOrder(items: TodoItem[]) {
  return items.reduce((m, t) => Math.max(m, t.order), -1) + 1;
}

export function normalizeTodo(item: TodoItem): TodoItem {
  const kind: TodoKind = item.kind === "group" ? "group" : "task";
  return {
    ...item,
    kind,
    parentId: kind === "group" ? undefined : (item.parentId ?? undefined),
  };
}
