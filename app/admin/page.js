"use client";

import { useState } from "react";
import styles from "./page.module.css";

const initialPhotographers = [
  {
    id: 1,
    name: "Rahul Singh",
    location: "Delhi, NCR",
    joined: "12 May 2025",
    status: "Pending",
    initials: "RS",
  },
  {
    id: 2,
    name: "Anita Desai",
    location: "Mumbai",
    joined: "11 May 2025",
    status: "Pending",
    initials: "AD",
  },
  {
    id: 3,
    name: "Vikram Rao",
    location: "Bengaluru",
    joined: "10 May 2025",
    status: "Pending",
    initials: "VR",
  },
  {
    id: 4,
    name: "Meera Kapoor",
    location: "Hyderabad",
    joined: "09 May 2025",
    status: "Approved",
    initials: "MK",
  },
  {
    id: 5,
    name: "Arjun Mehta",
    location: "Mumbai",
    joined: "08 May 2025",
    status: "Approved",
    initials: "AM",
  },
  {
    id: 6,
    name: "Neha Sharma",
    location: "Chennai",
    joined: "07 May 2025",
    status: "Deactivated",
    initials: "NS",
  },
];

const navigation = [
  ["dashboard", "Dashboard", "⌂"],
  ["approvals", "Photographer Approvals", "▦"],
  ["manage", "Manage Photographers", "♟"],
  ["partners", "Partner Companies", "▣"],
  ["gallery", "Gallery / Banner", "▤"],
  ["settings", "Settings", "⚙"],
];

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState("approvals");
  const [activeTab, setActiveTab] = useState("Pending");
  const [photographers, setPhotographers] = useState(initialPhotographers);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const visiblePhotographers = photographers.filter(
    (photographer) => photographer.status === activeTab,
  );

  function updateStatus(id, status) {
    setPhotographers((current) =>
      current.map((photographer) =>
        photographer.id === id ? { ...photographer, status } : photographer,
      ),
    );
  }

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
            onClick={() => setActiveNav("logout")}
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
                  <p>3 photographer applications need review.</p>
                  <p>Banner update was published.</p>
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
                <strong>
                  {
                    photographers.filter((item) => item.status === "Pending")
                      .length
                  }
                </strong>
              </div>
              <b className={styles.statUp}>+12%</b>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconApproved}>✓</span>
              <div>
                <small>Approved this month</small>
                <strong>25</strong>
              </div>
              <b className={styles.statUp}>+8%</b>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconTotal}>♟</span>
              <div>
                <small>Total photographers</small>
                <strong>128</strong>
              </div>
              <b className={styles.statUp}>+16%</b>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIconRate}>↗</span>
              <div>
                <small>Approval rate</small>
                <strong>86%</strong>
              </div>
              <b className={styles.statDown}>-2%</b>
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
                  <span>
                    {photographers.filter((item) => item.status === tab).length}
                  </span>
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
                  {visiblePhotographers.map((photographer) => (
                    <tr key={photographer.id}>
                      <td>
                        <div className={styles.person}>
                          <span className={styles.personAvatar}>
                            {photographer.initials}
                          </span>
                          <div>
                            <b>{photographer.name}</b>
                            <small>PH00{photographer.id}23</small>
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
                                onClick={() =>
                                  updateStatus(photographer.id, "Approved")
                                }
                              >
                                Approve
                              </button>
                              <button
                                className={styles.reject}
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
                  {visiblePhotographers.length === 0 && (
                    <tr>
                      <td className={styles.empty} colSpan="5">
                        No applications in this list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <p className={styles.footerNote}>
            Showing {visiblePhotographers.length} of {photographers.length}{" "}
            applications <span>Last updated just now</span>
          </p>
        </div>
      </section>
    </main>
  );
}
