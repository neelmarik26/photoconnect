"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main className={styles.page}>
      <Navbar current="contact" />

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
            <a
              className={styles.contactDetail}
              href="https://www.google.com/maps/search/?api=1&query=Bengaluru%2C%20Karnataka%2C%20India"
              target="_blank"
              rel="noreferrer"
            >
              <i>⌖</i>
              <div>
                <b>Our Office</b>
                <p>Bengaluru, Karnataka, India</p>
              </div>
            </a>
            <a
              className={styles.contactDetail}
              href="mailto:support@photoconnect.com"
            >
              <i>✉</i>
              <div>
                <b>Email</b>
                <p>support@photoconnect.com</p>
              </div>
            </a>
            <a className={styles.contactDetail} href="tel:+919876543210">
              <i>☎</i>
              <div>
                <b>Phone</b>
                <p>+91 98765 43210</p>
              </div>
            </a>
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
      <Footer />
    </main>
  );
}
