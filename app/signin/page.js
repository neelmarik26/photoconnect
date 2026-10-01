"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function SignInPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

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
      setSignedIn(false);
    } catch (error) {
      console.error("Login request failed:", error);
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
              <input
                required
                name="password"
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
