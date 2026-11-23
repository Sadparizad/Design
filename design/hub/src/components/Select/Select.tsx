import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "../Icon.tsx";
import field from "../SearchInput/Field.module.css";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown while `value` matches no option. */
  placeholder?: string;
  /** Names the field for screen readers. */
  label: string;
  /** Show the filter icon at the start, as the history page does. */
  filter?: boolean;
  /** field: the full-width input look. pill: a compact rounded control, as on the home page. */
  variant?: "field" | "pill";
}

/**
 * A select with the Hub's own dropdown menu (node 520:21525). It follows the select-only combobox
 * pattern: the button keeps focus, arrow keys move through the options, Enter or Space picks one,
 * Escape and Tab close the list.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  label,
  filter = false,
  variant = "field",
}: SelectProps) {
  const pill = variant === "pill";
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(selectedIndex, 0));

  // Close when a click lands outside the control.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const openList = () => {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const pick = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return openList();
        setActive((i) => (e.key === "ArrowDown" ? Math.min(i + 1, last) : Math.max(i - 1, 0)));
        break;
      }
      case "Home":
      case "End":
        if (!open) return;
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) pick(active);
        else openList();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={pill ? `${field.field} ${field.pill}` : field.field}>
      <button
        type="button"
        role="combobox"
        className={pill ? `${styles.body} ${styles.bodyPill}` : styles.body}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {filter && (
          <span className={styles.icon}>
            <Icon name="funnelSimple" />
          </span>
        )}
        <span className={`${styles.value} ${pill ? styles.valuePill : styles.valueField}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="caretDownTertiary" />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={pill ? `${styles.menu} ${styles.menuPill}` : styles.menu}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`${styles.item} ${i === active ? styles.itemActive : ""}`}
              // Keep focus on the button, so the click does not blur and close the list first.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
