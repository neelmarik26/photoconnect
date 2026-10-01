"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";
const navigation = [
  ["dashboard", "Dashboard", "⌂"],
  ["approvals", "Photographer Approvals", "▦"],
  ["manage", "Manage Photographers", "♟"],
  ["partners", "Partner Companies", "▣"],
  ["gallery", "Gallery / Banner", "▤"],
  ["admins", "Manage Admins", "♙"],
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canEditAdminProfile, setCanEditAdminProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const savedUser = window.localStorage.getItem(savedUserKey);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
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
    if (!hasAdminAccess) {
      router.replace("/admin/security");
    }
    return () => {
      isCurrent = false;
    };
  }, [router]);

  function logout() {
    window.localStorage.removeItem(savedUserKey);
    router.replace("/admin/security");
  }

  if (!hasAdminAccess) return null;

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
            .map(([key, label, icon]) => (
              <Link
                key={key}
                href={key === "partners" ? "/admin/partner_companis" : key === "admins" ? "/admin/admins" : "/admin"}
                className={styles.navItem}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon}>{icon}</span>
                {label}
              </Link>
            ))}
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
          <div className={styles.breadcrumb}>
            Admin
          </div>
          <div className={styles.topbarActions}>
            {canEditAdminProfile && (
              <Link className={styles.profileLink} href="/admin/profile">
                My profile
              </Link>
            )}
            <button className={styles.logoutButton} type="button" onClick={logout}>
              Log out
            </button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}