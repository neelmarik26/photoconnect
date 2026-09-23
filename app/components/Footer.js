import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      <div>
        <Link href="/" className={styles.logo}>
          <Image
            src="/photoconnect-logo.svg"
            alt="PhotoConnect logo"
            width="31"
            height="24"
          />
          <span>
            <b>PhotoConnect</b>
            <small>Capture People. Create Moments.</small>
          </span>
        </Link>
        <p>Connecting great photographers with amazing opportunities.</p>
        <div className={styles.social}>
          <a href="https://facebook.com" aria-label="Facebook">
            <Image src="/facebook.svg" alt="" width={17} height={17} />
          </a>
          <a href="https://instagram.com" aria-label="Instagram">
            <Image src="/instagram.svg" alt="" width={17} height={17} />
          </a>
          <a href="https://youtube.com" aria-label="YouTube">
            <Image src="/youtube.svg" alt="" width={17} height={17} />
          </a>
          <a href="https://linkedin.com" aria-label="LinkedIn">
            <Image src="/linkedin.svg" alt="" width={17} height={17} />
          </a>
        </div>
      </div>
      <div>
        <h4>Quick Links</h4>
        <Link href="#home">Home</Link>
        <Link href="#photographers">About Us</Link>
        <Link href="/contact">Contact Us</Link>
        <Link href="#footer">Privacy Policy</Link>
        <Link href="#footer">Terms & Conditions</Link>
      </div>
      <div>
        <h4>For Photographers</h4>
        <Link href="/signup">Sign Up</Link>
        <Link href="/signin">Sign In</Link>
        <Link href="#photographers">Update Profile</Link>
      </div>
      <div>
        <h4>Contact</h4>
        <a className={styles.contactItem} href="mailto:support@photoconnect.com">
          <span aria-hidden="true">✉</span>
          <span>support@photoconnect.com</span>
        </a>
        <a className={styles.contactItem} href="tel:+919876543210">
          <span aria-hidden="true">☎</span>
          <span>+91 98765 43210</span>
        </a>
        <a
          className={styles.contactItem}
          href="https://www.google.com/maps/search/?api=1&query=Bengaluru%2C%20Karnataka%2C%20India"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">●</span>
          <span>Bengaluru, India</span>
        </a>
      </div>
      <small className={styles.copyright}>
        © {new Date().getFullYear()} PhotoConnect. All rights reserved.
      </small>
    </footer>
  );
}
