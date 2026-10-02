"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignInPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submitForm(event) {
    event.preventDefault();
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        },
      );
      const result = await response.json().catch(() => null);
      console.log("Login response:", result);
      if (response.ok && result?._id) {
        window.localStorage.setItem(
          "photoConnectUser",
          JSON.stringify({
            userId: String(result._id),
            name: result.name,
            profileImageUrl: result.profileImageUrl,
            type: result.type,
            accessToken: result.accessToken,
            accountCollection: result.accountCollection,
            expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
          }),
        );
        router.push(["ADMIN", "SUPERADMIN"].includes(result.type) ? "/admin" : "/");
        return;
      }
          // Show error message from backend when response is not ok
          if (result?.message) {
            setError(result.message);
          } else {
            setError("Login failed. Please check your credentials.");
          }
          setSignedIn(false);
        } catch (error) {
          console.error("Login request failed:", error);
          setError("An error occurred. Please try again.");
          setSignedIn(false);
        }
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
                      {error && <p className={styles.formError}>{error}</p>}
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
                        <div className={styles.passwordWrapper}>
                          <input
                            required
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                        </div>
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
