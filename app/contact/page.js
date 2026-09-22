"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import navStyles from "../auth.module.css";

function Logo() {
  return (
    <Link href="/" className={navStyles.logo}>
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
  );
}

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main className={styles.page}>
      <header className={navStyles.header}>
        <Logo />
        <nav className={navStyles.nav}>
          <Link href="/">Home</Link>
          <Link href="/#photographers">About</Link>
          <Link className={navStyles.current} href="/contact">
            Contact Us
          </Link>
        </nav>
        <div className={navStyles.actions}>
          <Link className={navStyles.action} href="/signin">
            Sign In
          </Link>
          <Link className={navStyles.actionPrimary} href="/signup">
            Sign Up
          </Link>
        </div>
      </header>

      <section className={styles.contactWrap}>
        <div className={styles.intro}>
          <p>LET&apos;S TALK</p>
          <h1>Contact Us</h1>
          <span>
            We&apos;d love to hear from you. Get in touch with us for any
            queries or support.
          </span>
        </div>
        <div className={styles.contactCard}>
          <form onSubmit={submitForm}>
            <label>
              Name
              <input required placeholder="Enter your name" />
            </label>
            <label>
              Email
              <input required type="email" placeholder="Enter your email" />
            </label>
            <label>
              Subject
              <input required placeholder="Enter subject" />
            </label>
            <label>
              Message
              <textarea required placeholder="Your message" rows="5" />
            </label>
            <button type="submit">
              {sent ? "Message Sent ✓" : "Send Message"}
            </button>
          </form>
          <aside>
            <section>
              <i>⌖</i>
              <div>
                <b>Our Office</b>
                <p>Bengaluru, Karnataka, India</p>
              </div>
            </section>
            <section>
              <i>✉</i>
              <div>
                <b>Email</b>
                <p>support@photoconnect.com</p>
              </div>
            </section>
            <section>
              <i>☎</i>
              <div>
                <b>Phone</b>
                <p>+91 98765 43210</p>
              </div>
            </section>
            <section className={styles.follow}>
              <b>Follow Us</b>
              <div>
                <a href="https://facebook.com" aria-label="Facebook">
                  <Image src="/facebook.svg" alt="" width={18} height={18} />
                </a>
                <a href="https://instagram.com" aria-label="Instagram">
                  <Image src="/instagram.svg" alt="" width={18} height={18} />
                </a>
                <a href="https://linkedin.com" aria-label="LinkedIn">
                  <Image src="/linkedin.svg" alt="" width={18} height={18} />
                </a>
                <a href="https://youtube.com" aria-label="YouTube">
                  <Image src="/youtube.svg" alt="" width={18} height={18} />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
