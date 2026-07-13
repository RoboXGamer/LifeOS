import type { IconName } from "./components/Icon";

export type ItemColor = "violet" | "green" | "amber" | "blue" | "orange" | "indigo" | "teal" | "coral";
export type AreaTone = "violet" | "blue" | "green" | "amber" | "coral" | "teal";
export type ViewMode = "grid" | "list";
export type ItemViewMode = "list" | "compact";
export type ItemType = "Task" | "Note" | "Event" | "Expense" | "Payment";
export type ItemStatus = "Todo" | "In Progress" | "Done";
export type AppView = "inbox" | "areas" | "today" | "upcoming" | "search" | "tags" | "archive" | "settings";
export type ItemPanelMode = "view" | "edit" | "create" | "archived";

export type ItemFormValue = {
  title: string;
  type: ItemType;
  areaId: string | null;
  status?: ItemStatus;
  priority?: 1 | 2 | 3;
  dueDate?: string;
  amount?: number;
  isSettled?: boolean;
  description?: string;
  tags: string[];
  parentId?: string | null;
};

export type Item = {
  id: string;
  title: string;
  areaId: string | null;
  icon: IconName;
  color: ItemColor;
  type?: ItemType;
  status?: ItemStatus;
  priority?: 1 | 2 | 3;
  dueDate?: string;
  dueLabel?: string;
  amount?: number;
  isSettled?: boolean;
  description?: string;
  tags?: string[];
  parentId?: string | null;
  archived?: boolean;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Area = {
  id: string;
  name: string;
  icon: IconName;
  artIcon?: IconName;
  tone: AreaTone;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
