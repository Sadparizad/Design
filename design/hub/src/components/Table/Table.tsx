import type { ReactNode } from "react";
import styles from "./Table.module.css";

interface TableProps {
  /** Names the table for screen readers, usually the section's heading. */
  label: string;
  header: string[];
  rows: string[][];
  /** Draws a body cell. Defaults to the plain text. */
  renderCell?: (text: string) => ReactNode;
}

/**
 * A read-only table with a hairline under every row but the last. Columns share the
 * width by their content, so an ID column stays narrow and a text column takes the rest.
 */
export function Table({ label, header, rows, renderCell }: TableProps) {
  return (
    <table className={styles.table} aria-label={label}>
      <thead>
        <tr>
          {header.map((h, c) => (
            <th key={c} scope="col" className={styles.head}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c} className={styles.cell}>
                {renderCell ? renderCell(cell) : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
