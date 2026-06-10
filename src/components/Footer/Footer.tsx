import styles from "./Footer.module.css";

type FooterProps = {
  name?: string;
  email?: string;
  linkedinUrl?: string;
  productName?: string;
  year?: number;
};

const DEFAULT_PROFILE = {
  name: "Doh Kim",
  email: "whltn8282@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/dohyoungkim1011",
  productName: "Merge Studio",
  year: 2026,
};

export function Footer({
  name = DEFAULT_PROFILE.name,
  email = DEFAULT_PROFILE.email,
  linkedinUrl = DEFAULT_PROFILE.linkedinUrl,
  productName = DEFAULT_PROFILE.productName,
  year = DEFAULT_PROFILE.year,
}: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="Footer links">
          <span className={styles.brand}>{productName}</span>

          <a href={`mailto:${email}`} className={styles.link}>
            {email}
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            LinkedIn
          </a>
        </nav>

        <p className={styles.copy}>
          © {year} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
