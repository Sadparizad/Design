import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Block, type Inline, type List } from "../../markdown/parse.ts";
import styles from "./Markdown.module.css";

function inline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <Fragment key={i}>{n.v}</Fragment>;
      case "code":
        return (
          <code key={i} className={styles.inlineCode}>
            {n.v}
          </code>
        );
      case "strong":
        return <strong key={i}>{inline(n.c)}</strong>;
      case "em":
        return <em key={i}>{inline(n.c)}</em>;
      case "del":
        return <del key={i}>{inline(n.c)}</del>;
      case "link": {
        const external = /^https?:/i.test(n.href);
        return (
          <a
            key={i}
            className={styles.link}
            href={n.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {inline(n.c)}
          </a>
        );
      }
    }
  });
}

function list(l: List, key: number): ReactNode {
  const Tag = l.ordered ? "ol" : "ul";
  return (
    <Tag
      key={key}
      className={`${styles.list} ${l.ordered ? styles.ordered : styles.bullets}`}
      {...(l.ordered && l.start !== 1 ? { start: l.start } : {})}
    >
      {l.items.map((item, i) => (
        <li key={i} dir="auto" className={item.checked !== null ? styles.task : undefined}>
          {item.checked !== null && (
            <input type="checkbox" checked={item.checked} readOnly disabled className={styles.checkbox} />
          )}
          {inline(item.c)}
          {item.children.map((child, j) => list(child, j))}
        </li>
      ))}
    </Tag>
  );
}

function block(b: Block, key: number): ReactNode {
  switch (b.t) {
    case "heading": {
      // The page's own title is the only <h1>; document headings start at <h2>.
      const Tag = `h${Math.min(6, b.level + 1)}` as "h2";
      return (
        <Tag key={key} dir="auto" className={`${styles.heading} ${b.level <= 2 ? styles.major : styles.minor}`}>
          {inline(b.c)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={key} dir="auto" className={styles.paragraph}>
          {inline(b.c)}
        </p>
      );
    case "list":
      return list(b, key);
    case "code":
      return (
        <pre key={key} className={styles.codeBlock} tabIndex={0}>
          <code>{b.v}</code>
        </pre>
      );
    case "table":
      return (
        <div key={key} className={styles.tableWrap} tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr>
                {b.head.map((cell, i) => (
                  <th key={i} dir="auto" style={b.align[i] ? { textAlign: b.align[i]! } : undefined}>
                    {inline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} dir="auto" style={b.align[i] ? { textAlign: b.align[i]! } : undefined}>
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <blockquote key={key} className={styles.quote}>
          {b.blocks.map(block)}
        </blockquote>
      );
    case "rule":
      return <hr key={key} className={styles.rule} />;
  }
}

interface MarkdownProps {
  text: string;
}

/** A markdown file as the Figma Preview frames draw it. Never interprets raw HTML. */
export function Markdown({ text }: MarkdownProps) {
  return <div className={styles.content}>{parseMarkdown(text).map(block)}</div>;
}
