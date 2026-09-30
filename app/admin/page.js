"use client";

import Image from "next/image";
import { startTransition, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const statusLabels = {
  pending: "Pending",
  active: "Approved",
  inactive: "Deactivated",
};

function getProfileImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
}

function mapPhotographer(user) {
  const name = user.name || "Unnamed photographer";
  const status = statusLabels[user.status] || "Pending";
  const joinedDate = user.createdAt ? new Date(user.createdAt) : null;

  return {
    id: String(user._id),
    name,
    email: user.email || "",
    location:
      [user.city, user.state, user.country].filter(Boolean).join(", ") ||
      "Location not provided",
    joined:
      joinedDate && !Number.isNaN(joinedDate.getTime())
        ? joinedDate.toLocaleDateString()
        : "Not available",
    status,
    initials: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(""),
    profileImageUrl: getProfileImageUrl(user.profileImageUrl),
  };
}

const navigation = [
  ["dashboard", "Dashboard", "⌂"],
  ["approvals", "Photographer Approvals", "▦"],
  ["manage", "Manage Photographers", "♟"],
  ["partners", "Partner Companies", "▣"],
  ["gallery", "Gallery / Banner", "▤"],
  ["settings", "Settings", "⚙"],
];

export default function AdminPage() {
  const router = useRouter();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [activeNav, setActiveNav] = useState("approvals");
  const [activeTab, setActiveTab] = useState("Pending");
  const [photographers, setPhotographers] = useState([]);
  const [isLoadingPhotographers, setIsLoadingPhotographers] = useState(true);
  const [photographersError, setPhotographersError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingPhotographerId, setSavingPhotographerId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const savedUser = window.localStorage.getItem("photoConnectUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (
          user.userId &&
          user.expiresAt > Date.now() &&
          ["ADMIN", "SUPERADMIN"].includes(user.type)
        ) {
          startTransition(() => setHasAdminAccess(true));
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?type=PHOTOGRAPHER&page=1&limit=100&sortBy=createdAt&sortOrder=desc`,
          )
            .then(async (response) => {
              const result = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(
                  result?.message || "Could not load photographer records.",
                );
              }
              return result;
            })
            .then((result) => {
              if (isCurrent) {
                const users = Array.isArray(result?.data) ? result.data : [];
                setPhotographers(users.map(mapPhotographer));
              }
            })
            .catch((error) => {
              if (isCurrent) {
                setPhotographersError(
                  error.message || "Could not load photographer records.",
                );
              }
            })
            .finally(() => {
              if (isCurrent) setIsLoadingPhotographers(false);
            });
          return () => {
            isCurrent = false;
          };
        }
      } catch {
        window.localStorage.removeItem("photoConnectUser");
      }
    }
    router.replace("/admin/security");
    return () => {
      isCurrent = false;
    };
  }, [router]);

  const filteredPhotographers = photographers.filter((photographer) => {
    const matchesTab = photographer.status === activeTab;
    const searchValue = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      [photographer.name, photographer.email, photographer.location]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    return matchesTab && matchesSearch;
  });

  async function updateStatus(id, status) {
    setSavingPhotographerId(id);
    setStatusError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: status === "Approved" ? "active" : "inactive",
          }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "Could not update photographer status.");
      }
      const updatedPhotographer = mapPhotographer(result?.data ?? result);
      setPhotographers((current) =>
        current.map((photographer) =>
          photographer.id === id ? updatedPhotographer : photographer,
        ),
      );
    } catch (error) {
      setStatusError(
        error.message || "Could not update photographer status. Please try again.",
      );
    } finally {
      setSavingPhotographerId("");
    }
  }

  const pendingCount = photographers.filter(
    (photographer) => photographer.status === "Pending",
  ).length;
  const approvedCount = photographers.filter(
    (photographer) => photographer.status === "Approved",
  ).length;
  const deactivatedCount = photographers.filter(
    (photographer) => photographer.status === "Deactivated",
  ).length;
  const approvalRate = photographers.length
    ? Math.round((approvedCount / photographers.length) * 100)
    : 0;

  if (!hasAdminAccess) return null;

  return (
    <main className={styles.admin}>
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark}>▣</span>
          <span>
            PhotoConnect <b>|</b> <em>Admin</em>
          </span>
        </div>
        <nav className={styles.navigation} aria-label="Admin navigation">
          {navigation.map(([key, label, icon]) => (
            <button
              className={
                activeNav === key ? styles.navItemActive : styles.navItem
              }
              key={key}
              onClick={() => {
                setActiveNav(key);
                setSidebarOpen(false);
              }}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </button>
          ))}
          <button
            className={styles.navItem}
            onClick={() => router.replace("/admin/security")}
          >
            <span className={styles.navIcon}>⇥</span>
            Logout
          </button>
        </nav>
        <div className={styles.sidebarFooter}>PhotoConnect Admin v1.0</div>
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
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className={styles.breadcrumb}>
            Admin <span>/</span>{" "}
            {activeNav === "approvals" ? "Photographer Approvals" : "Dashboard"}
          </div>
          <div className={styles.topbarActions}>
            <div className={styles.notificationWrap}>
              <button
                className={styles.iconButton}
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                ♧<i />
              </button>
              {notificationsOpen && (
                <div className={styles.notificationPanel}>
                  <b>Notifications</b>
                  <p>
                    {pendingCount} photographer {pendingCount === 1 ? "application needs" : "applications need"} review.
                  </p>
                </div>
              )}
            </div>
            <button className={styles.profileButton}>
              <span className={styles.avatar}>A</span>
              <span>Admin</span>
              <small>⌄</small>
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.pageIntro}>
            <div>
              <p className={styles.eyebrow}>WORKSPACE / MODERATION</p>
              <h1>Photographer Approvals</h1>
              <p>Review and manage photographer applications from one place.</p>
            </div>
            <button
              className={styles.exportButton}
              onClick={() => window.print()}
            >
              ⇩ <span>Export report</span>
            </button>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIconPending}>◷</span>
              <div>
                <small>Pending review</small>
                <strong>{pendingCount}</strong>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconApproved}>✓</span>
              <div>
                <small>Approved photographers</small>
                <strong>{approvedCount}</strong>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconTotal}>♟</span>
              <div>
                <small>Total photographers</small>
                <strong>{photographers.length}</strong>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconRate}>↗</span>
              <div>
                <small>Approval rate</small>
                <strong>{approvalRate}%</strong>
              </div>
            </div>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Applications</h2>
                <p>Keep your photographer directory accurate and trusted.</p>
              </div>
              <label className={styles.search}>
                <span>⌕</span>
                <input
                  placeholder="Search photographers"
                  aria-label="Search photographers"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>
            <div className={styles.tabs} role="tablist">
              {["Pending", "Approved", "Deactivated"].map((tab) => (
                <button
                  className={activeTab === tab ? styles.tabActive : styles.tab}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                >
                  {tab}{" "}
                  <span>{
                    tab === "Pending"
                      ? pendingCount
                      : tab === "Approved"
                        ? approvedCount
                        : deactivatedCount
                  }</span>
                </button>
              ))}
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Photographer</th>
                    <th>Location</th>
                    <th>Joined on</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPhotographers && (
                    <tr>
                      <td className={styles.empty} colSpan="5">
                        Loading photographer records...
                      </td>
                    </tr>
                  )}
                  {!isLoadingPhotographers && photographersError && (
                    <tr>
                      <td className={styles.empty} colSpan="5" role="alert">
                        {photographersError}
                      </td>
                    </tr>
                  )}
                  {!isLoadingPhotographers && !photographersError && statusError && (
                    <tr>
                      <td className={styles.actionError} colSpan="5" role="alert">
                        {statusError}
                      </td>
                    </tr>
                  )}
                  {!isLoadingPhotographers &&
                    !photographersError &&
                    filteredPhotographers.map((photographer) => (
                    <tr key={photographer.id}>
                      <td>
                        <div className={styles.person}>
                          <span className={styles.personAvatar}>
                            {photographer.profileImageUrl ? (
                              <Image
                                className={styles.personPhoto}
                                src={photographer.profileImageUrl}
                                alt=""
                                width={30}
                                height={30}
                                unoptimized
                              />
                            ) : (
                              photographer.initials
                            )}
                          </span>
                          <div>
                            <b>{photographer.name}</b>
                            <small>{photographer.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{photographer.location}</td>
                      <td>{photographer.joined}</td>
                      <td>
                        <span
                          className={`${styles.status} ${styles[photographer.status.toLowerCase()]}`}
                        >
                          {photographer.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          {photographer.status === "Pending" && (
                            <>
                              <button
                                className={styles.approve}
                                disabled={savingPhotographerId === photographer.id}
                                onClick={() =>
                                  updateStatus(photographer.id, "Approved")
                                }
                              >
                                Approve
                              </button>
                              <button
                                className={styles.reject}
                                disabled={savingPhotographerId === photographer.id}
                                onClick={() =>
                                  updateStatus(photographer.id, "Deactivated")
                                }
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {photographer.status === "Approved" && (
                            <button
                              className={styles.secondaryAction}
                              disabled={savingPhotographerId === photographer.id}
                              onClick={() =>
                                updateStatus(photographer.id, "Deactivated")
                              }
                            >
                              Deactivate
                            </button>
                          )}
                          {photographer.status === "Deactivated" && (
                            <button
                              className={styles.secondaryAction}
                              disabled={savingPhotographerId === photographer.id}
                              onClick={() =>
                                updateStatus(photographer.id, "Approved")
                              }
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingPhotographers &&
                    !photographersError &&
                    filteredPhotographers.length === 0 && (
                    <tr>
                      <td className={styles.empty} colSpan="5">
                        No photographers match this list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <p className={styles.footerNote}>
            Showing {filteredPhotographers.length} of {photographers.length}{" "}
            photographers <span>Live records</span>
          </p>
        </div>
      </section>
    </main>
  );
}
