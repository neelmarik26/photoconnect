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
          expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
        }),
      );
      router.replace("/admin");
    } catch {
      setErrorMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <Navbar current="signin" hideAuthActions />
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
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
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