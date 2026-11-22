import { useRef, type KeyboardEvent } from "react";
import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./TabControl.module.css";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
}

interface TabControlProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Names the group for screen readers, for example "View". */
  label: string;
}

/** A segmented control for switching between views. Arrow keys move between tabs. */
export function TabControl({ items, value, onChange, label }: TabControlProps) {
  const list = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const at = items.findIndex((i) => i.id === value);
    let next = at;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else {
      const forward = (e.key === "ArrowRight") !== rtl;
      next = (at + (forward ? 1 : -1) + items.length) % items.length;
    }
    onChange(items[next].id);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div ref={list} className={styles.tabs} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
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
