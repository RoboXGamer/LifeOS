import type { IconName } from "../../Icon";
import type { ItemType } from "./context";

export const itemTypes: ItemType[] = [
  "Task",
  "Note",
  "Event",
  "Expense",
  "Payment",
];

export function itemIcon(type: ItemType | undefined): IconName {
  if (type === "Task") return "checkSquare";
  if (type === "Event") return "calendar";
  if (type === "Expense") return "expense";
  if (type === "Payment") return "payment";
  if (type === "Note") return "description";
  return "inbox";
}

export function dueDateLabel(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}
