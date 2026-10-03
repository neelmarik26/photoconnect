"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";
const navigation = [
  ["dashboard", "Dashboard", "⌂"],
  ["manage", "Manage Photographers", "♟"],
  ["partners", "Partner Companies", "▣"],
  ["gallery", "Gallery / Banner", "▤"],
  ["admins", "Manage Admins", "♙"],
];
const pageTitleByPath = {
  "/admin": "Manage Photographers",
  "/admin/dashboard": "Dashboard",
  "/admin/partner_companis": "Partner Companies",
  "/admin/gallery": "Gallery / Banner",
  "/admin/admins": "Manage Admins",
  "/admin/profile": "Profile",
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canEditAdminProfile, setCanEditAdminProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isSecurityPage = normalizedPathname === "/admin/security";
  const currentPageTitle = pageTitleByPath[normalizedPathname] ||
    normalizedPathname.split("/").filter(Boolean).pop()?.replaceAll("_", " ") || "Dashboard";

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

  useEffect(() => {
    const savedUser = window.localStorage.getItem(savedUserKey);

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Redirect PHOTOGRAPHER users to home page
        if (user.type === "PHOTOGRAPHER") {
          router.replace("/");
          return;
        }
        if (
          user.userId &&
          user.expiresAt > Date.now() &&
          ["ADMIN", "SUPERADMIN"].includes(user.type) &&
          (user.type !== "SUPERADMIN" || user.accountCollection === "admins")
        ) {
          startTransition(() => {
            setHasAdminAccess(true);
            setIsSuperAdmin(
              user.type === "SUPERADMIN" && user.accountCollection === "admins",
            );
            setCanEditAdminProfile(user.accountCollection === "admins");
          });
        }
      } catch {
        window.localStorage.removeItem(savedUserKey);
      }
    }
    // Only redirect to security page if not already on it and no admin access
    if (!hasAdminAccess && !isSecurityPage) {
      router.replace("/admin/security");
    }
  }, [router, hasAdminAccess, isSecurityPage]);

  function logout() {
    window.localStorage.removeItem(savedUserKey);
    setProfileMenuOpen(false);
    router.replace("/admin/security");
  }

  if (!hasAdminAccess && !isSecurityPage) return null;

  // On security page, render children without admin layout
  if (isSecurityPage) {
    return <div className={styles.securityPage}>{children}</div>;
  }

  return (
    <main className={styles.admin}>
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark}>▣</span>
          <span>
            BookMyPhotographer <b>|</b> <em>Admin</em>
          </span>
        </div>
        <nav className={styles.navigation} aria-label="Admin navigation">
          {navigation
            .filter(([key]) => key !== "admins" || isSuperAdmin)
            .map(([key, label, icon]) => {
              const href = key === "dashboard"
                ? "/admin/dashboard"
                : key === "partners"
                    ? "/admin/partner_companis"
                    : key === "admins"
                      ? "/admin/admins"
                      : key === "gallery"
                        ? "/admin/gallery"
                        : "/admin";
              const isActive = normalizedPathname === href;

              return (
                <Link
                  key={key}
                  href={href}
                  className={isActive ? styles.navItemActive : styles.navItem}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          <button
            className={styles.navItem}
            type="button"
            onClick={logout}
          >
            <span className={styles.navIcon}>⇥</span>
            Logout
          </button>
        </nav>
        <div className={styles.sidebarFooter}>BookMyPhotographer Admin v1.0</div>
      </aside>

      {sidebarOpen && (
        <button
          className={styles.sidebarBackdrop}
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/admin/dashboard">Admin</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{currentPageTitle}</span>
          </nav>
          <div className={styles.topbarActions}>
            <div className={styles.profileMenuWrap} ref={profileMenuRef}>
              <button
                className={styles.profileMenuTrigger}
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-controls="admin-profile-menu"
                onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
              >
                My profile
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </button>
              {profileMenuOpen && (
                <div className={styles.profileDropdown} id="admin-profile-menu" role="menu">
                  {canEditAdminProfile && (
                    <Link
                      href="/admin/profile"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Edit profile
                    </Link>
                  )}
                  <button type="button" role="menuitem" onClick={logout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
