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

export function siblingsOf(todos: TodoItem[], item: TodoItem) {
  if (item.parentId) return childrenOf(todos, item.parentId);
  return rootsOnDate(todos, item.date);
}

export function listComplete(todos: TodoItem[], groupId: string) {
  const kids = childrenOf(todos, groupId);
  return kids.length > 0 && kids.every((k) => k.done);
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
    } else if (!isGroup(root)) {
      total += 1;
      if (root.done) done += 1;
    }
  }
  return { done, total };
}

export function nextOrder(items: TodoItem[]) {
  return items.reduce((m, t) => Math.max(m, t.order), -1) + 1;
}

export function moveAmong(
  todos: TodoItem[],
  id: string,
  direction: -1 | 1,
): TodoItem[] {
  const item = todos.find((t) => t.id === id);
  if (!item) return todos;
  const siblings = siblingsOf(todos, item);
  const idx = siblings.findIndex((t) => t.id === id);
  const next = idx + direction;
  if (idx < 0 || next < 0 || next >= siblings.length) return todos;
  const reordered = [...siblings];
  const [moved] = reordered.splice(idx, 1);
  if (!moved) return todos;
  reordered.splice(next, 0, moved);
  const orderById = new Map(reordered.map((t, i) => [t.id, i]));
  return todos.map((t) => {
    const order = orderById.get(t.id);
    return order == null ? t : { ...t, order };
  });
}

export function normalizeTodo(item: TodoItem): TodoItem {
  const kind: TodoKind = item.kind === "group" ? "group" : "task";
  return {
    ...item,
    kind,
    parentId: kind === "group" ? undefined : (item.parentId ?? undefined),
  };
}
