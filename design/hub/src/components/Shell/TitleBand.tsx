import type { ReactNode } from "react";
import { Icon } from "../Icon.tsx";
import styles from "./Shell.module.css";

interface TitleBandProps {
  title: string;
  description?: string | null;
  /** Home page style: centred, bigger title with the mascot after the first word. */
  hero?: boolean;
  /** A 14px description under the title, as the Figma page has, instead of the usual 16px. */
  smallDescription?: boolean;
  /** Actions at the far end of the title row, such as buttons and a date. */
  end?: ReactNode;
  /** Controls that cross the bottom edge of the band, such as search and a filter. */
  controls?: ReactNode;
  /** The detail page: a row of facts above the title. */
  meta?: ReactNode;
  /** The detail page: the tab bar below the title, inside the band. */
  tabs?: ReactNode;
}

export function TitleBand({
  title,
  description,
  hero = false,
  smallDescription = false,
  end,
  controls,
  meta,
  tabs,
}: TitleBandProps) {
  const words = title.split(" ");
  const detail = Boolean(meta || tabs);
  const band = [
    styles.band,
    hero && styles.bandHero,
    controls && styles.bandWithControls,
    detail && styles.bandDetail,
    smallDescription && styles.bandSmall,
  ]
    .filter(Boolean)
    .join(" ");

  if (detail) {
    return (
      <section className={band} aria-labelledby="page-title">
        <div className={`${styles.bandInner} ${styles.bandInnerDetail}`}>
          <div className={styles.head}>
            {meta}
            <h1 id="page-title" className={`${styles.title} ${styles.titlePage}`}>
              {title}
            </h1>
          </div>
          {tabs}
        </div>
      </section>
    );
  }

  const heading = (
    <>
      <h1 id="page-title" className={`${styles.title} ${styles.titlePage}`}>
        {title}
      </h1>
      {description && <p className={`${styles.description} ${styles.descriptionPage}`}>{description}</p>}
    </>
  );

  if (end) {
    return (
      <section className={band} aria-labelledby="page-title">
        <div className={`${styles.bandInner} ${styles.bandRow}`}>
          <div className={styles.bandText}>{heading}</div>
          <div className={styles.bandEnd}>{end}</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={band} aria-labelledby="page-title">
        <div className={`${styles.bandInner} ${hero ? styles.bandInnerHero : ""}`}>
          {hero ? (
            <h1 id="page-title" className={`${styles.title} ${styles.titleHero}`}>
              <span>{words[0]}</span>
              <Icon name="claudeLooking" />
              {words.slice(1).map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </h1>
          ) : (
            <h1 id="page-title" className={`${styles.title} ${styles.titlePage}`}>
              {title}
            </h1>
          )}
          {description && (
            <p
              className={`${styles.description} ${
                hero ? styles.descriptionHero : smallDescription ? styles.descriptionSmall : styles.descriptionPage
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </section>
      {controls && (
        <div className={styles.controls}>
          <div className={styles.controlsInner}>{controls}</div>
        </div>
      )}
    </>
  );
}
