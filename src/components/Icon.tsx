import type { IconName } from "../schemas";
export type { IconName } from "../schemas";

export function Icon(props: { name: IconName; size?: number; strokeWidth?: number; class?: string }) {
  const size = () => props.size ?? 24;
  const common = {
    width: size(),
    height: size(),
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": props.strokeWidth ?? 1.8,
    "stroke-linecap": "round" as const,
    "stroke-linejoin": "round" as const,
    class: props.class
  };

  const paths = {
    inbox: <><path d="M4 4h16l2 8h-5l-2 3H9l-2-3H2l2-8Z"/><path d="M4 4 2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    tag: <><path d="M20 13 13 20a2 2 0 0 1-3 0l-7-7V4a1 1 0 0 1 1-1h9l7 7a2 2 0 0 1 0 3Z"/><circle cx="8" cy="8" r="1"/></>,
    chart: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M2 20h20"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4v-4h.1A1.7 1.7 0 0 0 4.2 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.6 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.4h4v.1a1.7 1.7 0 0 0 1 1.7 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7 1Z"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    graduation: <><path d="m2 10 10-5 10 5-10 5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6"/></>,
    cart: <><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.5 11h11l2-7H7"/></>,
    bulb: <><path d="M9 18h6M10 22h4M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.4-1.2 2.5h-4.6c0-1.1-.4-1.9-1.2-2.5Z"/><path d="M12 2V0M4.2 4.2 2.8 2.8M19.8 4.2l1.4-1.4"/></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    book: <><path d="M3 5a4 4 0 0 1 4-2h5v18H7a4 4 0 0 0-4 2ZM21 5a4 4 0 0 0-4-2h-5v18h5a4 4 0 0 1 4 2Z"/></>,
    dumbbell: <><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/></>,
    plane: <><path d="M22 2 9 15M22 2l-7 20-4-9-9-4Z"/></>,
    checkSquare: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0Z"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    heartPulse: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M5 12h4l2-4 2 8 2-4h4"/></>,
    leaf: <><path d="M20 4c-9 0-15 4-15 11 0 3 2 5 5 5 7 0 11-7 10-16Z"/><path d="M4 22c2-6 7-10 13-13"/></>,
    mountain: <><path d="m3 19 6-11 4 7 2-4 6 8Z"/><path d="m7.5 11 1.5 1 1.4-1.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
    star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2l-5-4.9 6.9-1Z"/>,
    flag: <><path d="M5 22V4"/><path d="M5 4h11l-1 4 1 4H5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevronDown: <path d="m6 9 6 6 6-6"/>,
    chevronRight: <path d="m9 18 6-6-6-6"/>,
    archive: <><path d="M4 7h16v14H4Z"/><path d="M2 3h20v4H2ZM9 11h6"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></>,
    currency: <><path d="M7 7h10M7 11h10M9 4c5 0 6 8 0 8l7 8"/></>,
    expense: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10m0 0-4-4m4 4 4-4"/></>,
    payment: <><circle cx="12" cy="12" r="9"/><path d="M12 17V7m0 0-4 4m4-4 4 4"/></>,
    description: <><path d="M4 4h16v16H4Z"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    command: <path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z"/>,
    sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>
  };

  return <svg {...common} aria-hidden="true">{paths[props.name]}</svg>;
}
