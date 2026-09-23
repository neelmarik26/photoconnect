"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./Navbar.module.css";

const links = [
  ["home", "Home", "/"],
  ["about", "About", "/#photographers"],
  ["contact", "Contact Us", "/contact"],
];

export default function Navbar({ current = "home" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
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
      <button
        className={styles.menuToggle}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        aria-label="Toggle navigation menu"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        ☰
      </button>
      <nav
        id="site-navigation"
        className={menuOpen ? styles.mobileMenuOpen : ""}
      >
        {links.map(([key, label, href]) => (
          <Link
            className={current === key ? styles.current : ""}
            href={href}
            key={key}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Link href="/signin">Sign In</Link>
        <Link href="/signup">Sign Up</Link>
      </div>
    </header>
  );
}
