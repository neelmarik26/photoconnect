"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const savedUserKey = "photoConnectUser";

const links = [
  ["home", "Home", "/"],
  ["about", "About", "/#photographers"],
  ["contact", "Contact Us", "/contact"],
];

export default function Navbar({ current = "home", hideAuthActions = false, fullWidth = false }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function loadSavedUser() {
      const savedProfile = window.localStorage.getItem(savedUserKey);
      if (!savedProfile) {
        setSavedUser(null);
        return;
      }

      try {
        const profile = JSON.parse(savedProfile);
        if (!profile.userId || !profile.expiresAt || profile.expiresAt <= Date.now()) {
          window.localStorage.removeItem(savedUserKey);
          setSavedUser(null);
          return;
        }
        setSavedUser(profile);
      } catch {
        window.localStorage.removeItem(savedUserKey);
        setSavedUser(null);
      }
    }

    loadSavedUser();
    window.addEventListener("storage", loadSavedUser);
    return () => window.removeEventListener("storage", loadSavedUser);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function closeOnOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  function logout() {
    window.localStorage.removeItem(savedUserKey);
    setSavedUser(null);
    setProfileMenuOpen(false);
    router.replace("/");
  }

  return (
      <header className={`${styles.header} ${fullWidth ? styles.fullWidth : ""}`}>
      <Link href="/" className={styles.logo}>
        <Image
          src={`${basePath}/bookmyphotographer-logo.svg`}
          alt="BookMyPhotographer logo"
          width="31"
          height="24"
        />
        <span>
          <b>BookMyPhotographer</b>
          <small>Capture People. Create Moments.</small>
        </span>
      </Link>
      <button
        className={styles.menuToggle}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        aria-label="Toggle navigation menu"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        ☰
      </button>
      <nav
        id="site-navigation"
        className={menuOpen ? styles.mobileMenuOpen : ""}
      >
        {links.map(([key, label, href]) => (
          <Link
            className={current === key ? styles.current : ""}
            href={href}
            key={key}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!hideAuthActions &&
        (savedUser ? (
          <div className={styles.userProfile} ref={profileMenuRef}>
            <button
              className={styles.profileTrigger}
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-controls="profile-menu"
              onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
            >
              <Image
                className={styles.profileAvatar}
                src={
                  savedUser.profileImageUrl
                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${savedUser.profileImageUrl}`
                    : `${basePath}/defolt_profile_pic.jpg`
                }
                alt=""
                width={36}
                height={36}
                unoptimized
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = `${basePath}/defolt_profile_pic.jpg`;
                }}
              />
              <span className={styles.userName}>{savedUser.name}</span>
              <span className={styles.profileChevron} aria-hidden="true">
                ▾
              </span>
            </button>
            {profileMenuOpen && (
              <div className={styles.profileDropdown} id="profile-menu" role="menu">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button type="button" role="menuitem" onClick={logout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`${styles.actions} ${
              current === "signin" || current === "signup"
                ? styles.singleAction
                : ""
            }`}
          >
            {current !== "signin" && <Link href="/signin">Sign In</Link>}
            {current !== "signup" && <Link href="/signup">Sign Up</Link>}
          </div>
        ))}
    </header>
  );
}
