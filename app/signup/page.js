"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignUpPage() {
  const [created, setCreated] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setCreated(true);
  }

  return (
    <main className={styles.page}>
      <Navbar current="signup" />
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
