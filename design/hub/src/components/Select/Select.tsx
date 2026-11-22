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
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  label,
  filter = false,
}: SelectProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className={field.field}>
      <div className={styles.body}>
        {filter && (
          <span className={styles.icon}>
            <Icon name="funnelSimple" />
          </span>
        )}
        <span className={styles.value}>{selected ? selected.label : placeholder}</span>
        <Icon name="caretDownTertiary" />
      </div>
      <select
        className={styles.native}
        value={selected ? value : ""}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {!selected && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
