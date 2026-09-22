"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "../auth.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/photoconnect-logo.svg"
          alt="PhotoConnect logo"
          width={31}
          height={24}
        />
        <span>
          <b>PhotoConnect</b>
          <small>Capture People. Create Moments.</small>
        </span>
      </Link>
      <nav className={styles.nav}>
        <Link href="/">Home</Link>
        <Link href="/#photographers">About</Link>
        <Link href="/contact">Contact Us</Link>
      </nav>
      <div className={styles.actions}>
        <Link className={styles.action} href="/signin">
          Sign In
        </Link>
        <Link className={styles.actionPrimary} href="/signup">
          Sign Up
        </Link>
      </div>
    </header>
  );
}

export default function SignUpPage() {
  const [created, setCreated] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setCreated(true);
  }

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h1>Create Your Account</h1>
            <p>Join our community of talented photographers</p>
          </div>
          <form className={styles.form} onSubmit={submitForm}>
            <label className={styles.field}>
              Full Name
              <input required placeholder="Enter your full name" />
            </label>
            <label className={styles.field}>
              Email Address
              <input required type="email" placeholder="Enter your email" />
            </label>
            <label className={styles.field}>
              Password
              <input required type="password" placeholder="Create a password" />
            </label>
            <label className={styles.field}>
              Confirm Password
              <input
                required
                type="password"
                placeholder="Confirm your password"
              />
            </label>
            <button className={styles.submit} type="submit">
              {created ? "Account Created" : "Sign Up"}
            </button>
          </form>
          <p className={styles.switch}>
            Already have an account? <Link href="/signin">Sign In</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
