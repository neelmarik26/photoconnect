"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../auth.module.css";
import Navbar from "../../components/Navbar";

const adminRoles = ["ADMIN", "SUPERADMIN"];

export default function AdminSecurityPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submitCredentials(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        },
      );
      const user = await response.json().catch(() => null);

      if (!response.ok || !user?._id || !adminRoles.includes(user.type)) {
        setErrorMessage("Invalid credentials or this account is not an administrator.");
        return;
      }

      window.localStorage.setItem(
        "photoConnectUser",
        JSON.stringify({
          userId: String(user._id),
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          type: user.type,
          accessToken: user.accessToken,
          accountCollection: user.accountCollection,
          expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
        }),
      );
      router.replace("/admin/dashboard");
    } catch {
      setErrorMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <Navbar current="signin" hideAuthActions fullWidth />
      <section className={styles.content}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h1>Admin Security</h1>
            <p>Sign in with an administrator account to continue.</p>
          </div>
          <form className={styles.form} onSubmit={submitCredentials}>
            <label className={styles.field}>
              Email Address
              <input
                required
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your admin email"
              />
            </label>
            <label className={styles.field}>
              Password
                          <div className={styles.passwordWrapper}>
                            <input
                              required
                              name="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                            />
                            <button
                              type="button"
                              className={styles.eyeButton}
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              aria-pressed={showPassword}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                {showPassword ? (
                                  <>
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c5.5 0 9 7 9 7a13.4 13.4 0 0 1-2.1 2.8" />
                                    <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8" />
                                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                                  </>
                                ) : (
                                  <>
                                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                        </label>
            {errorMessage && (
              <p className={styles.formError} role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Continue to Admin"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
