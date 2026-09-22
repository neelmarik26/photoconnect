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

export default function SignInPage() {
  const [signedIn, setSignedIn] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setSignedIn(true);
  }

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>
          <form className={styles.form} onSubmit={submitForm}>
            <label className={styles.field}>
              Email Address
              <input required type="email" placeholder="Enter your email" />
            </label>
            <label className={styles.field}>
              Password
              <input
                required
                type="password"
                placeholder="Enter your password"
              />
            </label>
            <Link className={styles.forgot} href="/signin">
              Forgot password?
            </Link>
            <button className={styles.submit} type="submit">
              {signedIn ? "Signed In" : "Sign In"}
            </button>
          </form>
          <p className={styles.switch}>
            Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
