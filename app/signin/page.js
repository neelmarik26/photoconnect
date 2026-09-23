"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignInPage() {
  const [signedIn, setSignedIn] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setSignedIn(true);
  }

  return (
    <main className={styles.page}>
      <Navbar current="signin" />
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
