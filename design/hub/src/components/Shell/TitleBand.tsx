import type { ReactNode } from "react";
import { Icon } from "../Icon.tsx";
import styles from "./Shell.module.css";

interface TitleBandProps {
  title: string;
  description?: string | null;
  /** Home page style: centred, bigger title with the mascot after the first word. */
  hero?: boolean;
  /** Controls that cross the bottom edge of the band, such as search and a filter. */
  controls?: ReactNode;
}

export function TitleBand({ title, description, hero = false, controls }: TitleBandProps) {
  const words = title.split(" ");
  const band = [styles.band, hero && styles.bandHero, controls && styles.bandWithControls]
    .filter(Boolean)
    .join(" ");

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
              className={`${styles.description} ${hero ? styles.descriptionHero : styles.descriptionPage}`}
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
