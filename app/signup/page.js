"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function submitForm(event) {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please check them and try again.");
      return;
    }

    try {
      const signupPayload = {
        name: formData.get("fullName"),
        email: formData.get("email"),
        password,
      };
      console.log(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/first`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/first`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(errorData?.message || "Failed to create your account. Please try again.");
        return;
      }

      window.sessionStorage.setItem("signupEmail", formData.get("email"));
  window.sessionStorage.setItem("signupPayload", JSON.stringify(signupPayload));
  window.sessionStorage.removeItem("otpResendAttempts");
  window.sessionStorage.removeItem("otpResendAvailableAt");
      router.push("/otp");
    } catch {
      setErrorMessage("Could not connect to the server. Please try again.");
    }
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
              <input
                required
                name="fullName"
                placeholder="Enter your full name"
              />
            </label>
            <label className={styles.field}>
              Email Address
              <input
                required
                name="email"
                type="email"
                placeholder="Enter your email"
              />
            </label>
            <label className={styles.field}>
              Password
              <span className={styles.passwordInput}>
                <input
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                />
                <button
                  className={styles.visibilityToggle}
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg
                    className={styles.eyeIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path
                      className={showPassword ? styles.eyeSlashHidden : styles.eyeSlash}
                      d="m3 3 18 18"
                    />
                  </svg>
                </button>
              </span>
            </label>
            <label className={styles.field}>
              Confirm Password
              <input
                required
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
              />
            </label>
            {errorMessage && (
              <p className={styles.formError} role="alert">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v5m0 3h.01" />
                </svg>
                {errorMessage}
              </p>
            )}
            <button className={styles.submit} type="submit">
              Sign Up
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
