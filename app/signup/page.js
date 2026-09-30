"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submitForm(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const nextFieldErrors = {};
    const requiredFields = [
      ["fullName", "full name"],
      ["email", "email address"],
      ["password", "password"],
      ["confirmPassword", "confirm password"],
    ];

    for (const [fieldName, label] of requiredFields) {
      if (!String(formData.get(fieldName) ?? "").trim()) {
        nextFieldErrors[fieldName] = `Your ${label} is missing.`;
      }
    }

    const email = String(formData.get("email") ?? "").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }
    if (String(password ?? "").trim() && password.length < 8) {
      nextFieldErrors.password = "Password must be at least 8 characters.";
    }
    if (password && confirmPassword && password !== confirmPassword) {
      nextFieldErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const signupPayload = {
        name: formData.get("fullName"),
        email: formData.get("email"),
        password,
      };
      // console.log(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/signup`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(errorData?.message || "Failed to create your account. Please try again.");
        setIsSubmitting(false);
        return;
      }

      window.sessionStorage.setItem("signupEmail", formData.get("email"));
      window.sessionStorage.setItem("signupPayload", JSON.stringify(signupPayload));
      window.sessionStorage.removeItem("otpResendAttempts");
      window.sessionStorage.removeItem("otpResendAvailableAt");
      router.push("/otp");
    } catch {
      setErrorMessage("Could not connect to the server. Please try again.");
      setIsSubmitting(false);
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
          <form className={styles.form} onSubmit={submitForm} noValidate>
            <label className={styles.field}>
              Full Name
              <input
                required
                name="fullName"
                placeholder="Enter your full name"
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                onChange={() => setFieldErrors((errors) => ({ ...errors, fullName: "" }))}
              />
              {fieldErrors.fullName && <span className={styles.fieldError} id="fullName-error">{fieldErrors.fullName}</span>}
            </label>
            <label className={styles.field}>
              Email Address
              <input
                required
                name="email"
                type="email"
                placeholder="Enter your email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                onChange={() => setFieldErrors((errors) => ({ ...errors, email: "" }))}
              />
              {fieldErrors.email && <span className={styles.fieldError} id="email-error">{fieldErrors.email}</span>}
            </label>
            <label className={styles.field}>
              Password
              <span className={styles.passwordInput}>
                <input
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  onChange={() => setFieldErrors((errors) => ({ ...errors, password: "" }))}
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
              {fieldErrors.password && <span className={styles.fieldError} id="password-error">{fieldErrors.password}</span>}
            </label>
            <label className={styles.field}>
              Confirm Password
              <span className={styles.passwordInput}>
                <input
                  required
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  onChange={() => setFieldErrors((errors) => ({ ...errors, confirmPassword: "" }))}
                />
                <button
                  className={styles.visibilityToggle}
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                >
                  <svg
                    className={styles.eyeIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path
                      className={showConfirmPassword ? styles.eyeSlashHidden : styles.eyeSlash}
                      d="m3 3 18 18"
                    />
                  </svg>
                </button>
              </span>
              {fieldErrors.confirmPassword && <span className={styles.fieldError} id="confirmPassword-error">{fieldErrors.confirmPassword}</span>}
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
            <button className={styles.submit} type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <span className={styles.submitLoader} aria-hidden="true" />}
              {isSubmitting ? "Creating account..." : "Sign Up"}
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
