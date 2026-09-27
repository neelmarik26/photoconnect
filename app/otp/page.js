"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

const CODE_LENGTH = 6;
const RESEND_BASE_DELAY_SECONDS = 30;
const RESEND_MAX_DELAY_SECONDS = 300;

export default function OtpPage() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [message, setMessage] = useState("");
  const [resendRemaining, setResendRemaining] = useState(RESEND_BASE_DELAY_SECONDS);
  const [resendAttempt, setResendAttempt] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    let intervalId;
    const timeoutId = window.setTimeout(() => {
      const storedAttempts = Number(window.sessionStorage.getItem("otpResendAttempts") || 0);
      let availableAt = Number(window.sessionStorage.getItem("otpResendAvailableAt"));

      if (!Number.isFinite(availableAt) || availableAt <= 0) {
        availableAt = Date.now() + RESEND_BASE_DELAY_SECONDS * 1000;
        window.sessionStorage.setItem("otpResendAvailableAt", String(availableAt));
      }

      setResendAttempt(storedAttempts);

      function updateRemaining() {
        const deadline = Number(window.sessionStorage.getItem("otpResendAvailableAt") || 0);
        setResendRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      }

      updateRemaining();
      intervalId = window.setInterval(updateRemaining, 1000);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  function updateDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((currentCode) =>
      currentCode.map((currentDigit, currentIndex) =>
        currentIndex === index ? digit : currentDigit,
      ),
    );
    setMessage("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pastedCode) return;

    event.preventDefault();
    setCode(Array.from({ length: CODE_LENGTH }, (_, index) => pastedCode[index] || ""));
    setMessage("");
    inputRefs.current[Math.min(pastedCode.length, CODE_LENGTH) - 1]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function submitCode(event) {
    event.preventDefault();
    setMessage("");

    const email = window.sessionStorage.getItem("signupEmail");
    if (!email) {
      setMessage("Signup email not found. Please return to the signup page and try again.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: code.join(""),
          }),
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message || "Could not verify the code. Please try again.");
        return;
      }

      window.sessionStorage.removeItem("signupPayload");
      window.sessionStorage.removeItem("signupEmail");
      window.sessionStorage.removeItem("otpResendAttempts");
      window.sessionStorage.removeItem("otpResendAvailableAt");
      
      router.push("/profile-details");
    } catch {
      setMessage("Could not connect to the server. Please try again.");
    }
  }

  async function resendCode() {
    if (resendRemaining > 0 || isResending) return;

    const signupPayload = window.sessionStorage.getItem("signupPayload");
    if (!signupPayload) {
      setMessage("Signup details not found. Please return to the signup page and try again.");
      return;
    }

    const nextAttempt = resendAttempt + 1;
    const delaySeconds = Math.min(
      RESEND_BASE_DELAY_SECONDS * 2 ** nextAttempt,
      RESEND_MAX_DELAY_SECONDS,
    );
    const availableAt = Date.now() + delaySeconds * 1000;

    window.sessionStorage.setItem("otpResendAttempts", String(nextAttempt));
    window.sessionStorage.setItem("otpResendAvailableAt", String(availableAt));
    setResendAttempt(nextAttempt);
    setResendRemaining(delaySeconds);
    setIsResending(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/first`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: signupPayload,
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message || "Could not resend the code. Please try again later.");
        return;
      }

      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setMessage(result?.message || "A new verification code has been sent.");
    } catch {
      setMessage("Could not connect to the server. Please try again later.");
    } finally {
      setIsResending(false);
    }
  }

  function formatCountdown(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  return (
    <main className={styles.page}>
      <Navbar current="signup" />
      <section className={styles.content}>
        <div className={`${styles.card} ${styles.otpCard}`}>
          <div className={styles.otpMark} aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <rect x="4.5" y="7.5" width="23" height="17" rx="3" />
              <path d="m6 10 10 8 10-8" />
            </svg>
          </div>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>EMAIL VERIFICATION</p>
            <h1>Check your inbox</h1>
            <p>Enter the 6-digit code associated with your signup email.</p>
          </div>

          <form className={styles.form} onSubmit={submitCode}>
            <div className={styles.otpGroup} role="group" aria-label="6-digit verification code">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  className={styles.otpDigit}
                  aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  required
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={index === 0 ? handlePaste : undefined}
                />
              ))}
            </div>

            <p className={styles.otpHint} aria-live="polite">
              {message || "The code is valid for 10 minutes."}
            </p>

            <button className={styles.submit} type="submit">
              Verify email
            </button>
          </form>

          <p className={styles.otpResend}>
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              disabled={isResending || resendRemaining > 0}
              onClick={resendCode}
            >
              {isResending
                ? "Sending..."
                : resendRemaining > 0
                  ? `Resend in ${formatCountdown(resendRemaining)}`
                  : "Resend code"}
            </button>
          </p>
          <p className={styles.switch}>
            <Link href="/signup">Back to sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}