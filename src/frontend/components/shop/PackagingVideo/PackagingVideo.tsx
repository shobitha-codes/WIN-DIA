import styles from "./PackagingVideo.module.css";

type PackagingVideoProps = {
  src: string;
  poster?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export function PackagingVideo({
  src,
  poster,
  eyebrow = "Behind the scenes",
  title = "See How We Pack Your FibreRich Thins",
  subtitle = "Fresh, hygienic and sealed with care before it reaches your doorstep.",
}: PackagingVideoProps) {
  return (
    <section className={styles.section} aria-labelledby="packaging-video-heading">
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 id="packaging-video-heading" className={styles.title}>
            {title}
          </h2>
          <span className={styles.divider} aria-hidden="true" />
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.frame}>
          <video
            className={styles.video}
            controls
            playsInline
            preload="metadata"
            poster={poster}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <ul className={styles.badges}>
          <li>🧼 Hygienic Packing</li>
          <li>🌿 No Preservatives</li>
          <li>📦 Sealed for Freshness</li>
        </ul>
      </div>
    </section>
  );
}