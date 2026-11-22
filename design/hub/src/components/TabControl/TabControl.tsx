import { useRef, type KeyboardEvent } from "react";
import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./TabControl.module.css";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Shown but not selectable, and skipped by the arrow keys. */
  disabled?: boolean;
}

/**
 * segmented: the grey track with a raised white chip, used on the Files page.
 * page: the tab bar in a detail page's title band. Switches views of one page.
 * filter: a white bordered track of options. A choice, not a view, so it is a radio group.
 */
export type TabVariant = "segmented" | "page" | "filter";

interface TabControlProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Names the group for screen readers, for example "View". */
  label: string;
  variant?: TabVariant;
  /** `filter` only: the wider chips used by Sizes (20px across, not 12px). */
  spacious?: boolean;
  /** `page` only: each tab gets an id and points at the panel it shows. See `tabId`. */
  panelId?: string;
}

/** The id of one tab button, so a panel can name the tab that labels it. */
export function tabId(panelId: string, id: string): string {
  return `${panelId}-tab-${id}`;
}

/** A control for switching between views or options. Arrow keys move between items. */
export function TabControl({
  items,
  value,
  onChange,
  label,
  variant = "segmented",
  spacious = false,
  panelId,
}: TabControlProps) {
  const list = useRef<HTMLDivElement>(null);
  const radio = variant === "filter";
  const itemRole = radio ? "radio" : "tab";

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const at = items.findIndex((i) => i.id === value);
    const enabled = items.map((_, i) => i).filter((i) => !items[i].disabled);
    if (enabled.length === 0) return;
    let next = at;
    if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    else {
      const forward = (e.key === "ArrowRight") !== rtl;
      do next = (next + (forward ? 1 : -1) + items.length) % items.length;
      while (items[next].disabled);
    }
    onChange(items[next].id);
    list.current?.querySelectorAll<HTMLElement>(`[role="${itemRole}"]`)[next]?.focus();
  }

  const track = [styles.tabs, styles[variant], spacious && styles.spacious].filter(Boolean).join(" ");

  return (
    <div
      ref={list}
      className={track}
      role={radio ? "radiogroup" : "tablist"}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            id={panelId && !radio ? tabId(panelId, item.id) : undefined}
            type="button"
            role={itemRole}
            {...(radio ? { "aria-checked": selected } : { "aria-selected": selected })}
            aria-controls={panelId && !radio && selected ? panelId : undefined}
            disabled={item.disabled}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.tabSelected : ""}`}
            onClick={() => onChange(item.id)}
          >
            <span className={styles.content}>
              {item.icon && <Icon name={item.icon} />}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
