import { Icon } from "../Icon.tsx";
import field from "./Field.module.css";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Names the field for screen readers. The placeholder is not a label. */
  label?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
}: SearchInputProps) {
  return (
    <label className={field.field}>
      <span className={styles.body}>
        <Icon name="magnifyingGlass" />
        <input
          className={styles.input}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}
