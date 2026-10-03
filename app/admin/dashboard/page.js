"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function fetchJson(path) {
  const response = await fetch(`${BACKEND_URL}/api/${path}`);
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || `Could not load ${path}.`);
  }
  return result;
}

function readMetric(result, key = "total") {
  return result?.[key] ?? result?.data?.[key] ?? 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentPhotographers, setRecentPhotographers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    const requests = await Promise.allSettled([
      fetchJson("users?page=1&limit=1"),
      fetchJson("users?type=PHOTOGRAPHER&page=1&limit=1000&sortBy=createdAt&sortOrder=desc"),
      fetchJson("bookings/stats"),
      fetchJson("partner-companies"),
      fetchJson("photo-galleries?page=1&limit=1"),
      fetchJson("reviews?page=1&limit=1"),
      fetchJson("hero-imgs/config"),
    ]);

    const valueAt = (index) => requests[index].status === "fulfilled" ? requests[index].value : null;
    const users = valueAt(0);
    const photographers = valueAt(1);
    const bookings = valueAt(2);
    const partners = valueAt(3);
    const galleries = valueAt(4);
    const reviews = valueAt(5);
    const hero = valueAt(6);
    const photographerRecords = Array.isArray(photographers?.data) ? photographers.data : [];

    setStats({
      users: readMetric(users),
      photographers: readMetric(photographers),
      pending: photographerRecords.filter((person) => person.status === "pending").length,
      bookings: bookings?.total ?? 0,
      bookingPending: bookings?.pending ?? 0,
      bookingConfirmed: bookings?.confirmed ?? 0,
      bookingInProgress: bookings?.inProgress ?? 0,
      bookingCompleted: bookings?.completed ?? 0,
      bookingCancelled: bookings?.cancelled ?? 0,
      partners: readMetric(partners),
      galleries: readMetric(galleries),
      reviews: readMetric(reviews),
      heroImages: Array.isArray(hero?.images) ? hero.images.length : 0,
    });
    setRecentPhotographers(photographerRecords.slice(0, 5).map((person) => ({
      id: person._id,
      name: person.name || "Unnamed photographer",
      email: person.email || "",
      status: person.status || "pending",
      createdAt: person.createdAt,
    })));

    const failures = requests.filter((request) => request.status === "rejected");
    if (failures.length) {
      setLoadError("Some dashboard totals could not be loaded. Retry to refresh the overview.");
    }
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  function refreshDashboard() {
    setIsLoading(true);
    setLoadError("");
    loadDashboard();
  }

  const metricCards = [
    { label: "Total users", value: stats?.users, detail: "Registered accounts", icon: "◎", tone: "mint" },
    { label: "Photographers", value: stats?.photographers, detail: "Across all statuses", icon: "◉", tone: "blue" },
    { label: "Pending applications", value: stats?.pending, detail: "Awaiting review", icon: "◷", tone: "amber" },
    { label: "Total bookings", value: stats?.bookings, detail: "All booking statuses", icon: "▤", tone: "coral" },
    { label: "Partner companies", value: stats?.partners, detail: "Directory records", icon: "◇", tone: "green" },
    { label: "Gallery photos", value: stats?.galleries, detail: "Published media records", icon: "▧", tone: "cyan" },
    { label: "Customer reviews", value: stats?.reviews, detail: "Submitted feedback", icon: "☆", tone: "rose" },
    { label: "Hero slides", value: stats?.heroImages, detail: "Homepage carousel images", icon: "▣", tone: "violet" },
  ];

  const bookingStatuses = [
    ["Pending", stats?.bookingPending ?? 0, "pending"],
    ["Confirmed", stats?.bookingConfirmed ?? 0, "confirmed"],
    ["In progress", stats?.bookingInProgress ?? 0, "progress"],
    ["Completed", stats?.bookingCompleted ?? 0, "completed"],
    ["Cancelled", stats?.bookingCancelled ?? 0, "cancelled"],
  ];
  const bookingTotal = stats?.bookings || 0;

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>OPERATIONS / OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>A live overview of your photographer network and marketplace.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.updatedAt}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting to live data"}
          </span>
          <button className={styles.refreshButton} type="button" onClick={refreshDashboard} disabled={isLoading} aria-label="Refresh dashboard">
            <span aria-hidden="true">↻</span> Refresh
          </button>
        </div>
      </header>

      {loadError && (
        <div className={styles.loadError} role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={refreshDashboard}>Retry</button>
        </div>
      )}

      <section className={styles.metricGrid} aria-label="Platform statistics">
        {metricCards.map((card) => (
          <article className={styles.metricCard} key={card.label}>
            <div className={`${styles.metricIcon} ${styles[card.tone]}`} aria-hidden="true">{card.icon}</div>
            <div className={styles.metricContent}>
              <span>{card.label}</span>
              <strong>{isLoading && !stats ? "—" : formatNumber(card.value)}</strong>
              <small>{card.detail}</small>
            </div>
            <span className={styles.metricRule} />
          </article>
        ))}
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>BOOKING PIPELINE</p>
              <h2>Booking status</h2>
            </div>
            <strong className={styles.totalBookings}>{formatNumber(bookingTotal)} <small>total</small></strong>
          </div>
          <div className={styles.statusList}>
            {bookingStatuses.map(([label, value, tone]) => {
              const width = bookingTotal ? Math.max((value / bookingTotal) * 100, value ? 3 : 0) : 0;
              return (
                <div className={styles.statusRow} key={label}>
                  <div className={styles.statusLabel}><span className={`${styles.statusDot} ${styles[tone]}`} />{label}</div>
                  <div className={styles.statusTrack}><span className={`${styles.statusFill} ${styles[tone]}`} style={{ width: `${width}%` }} /></div>
                  <strong>{formatNumber(value)}</strong>
                </div>
              );
            })}
          </div>
          <Link className={styles.textLink} href="/admin">Review photographer applications <span aria-hidden="true">→</span></Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>LATEST SIGNUPS</p>
              <h2>New photographers</h2>
            </div>
            <Link className={styles.viewAll} href="/admin">View all <span aria-hidden="true">↗</span></Link>
          </div>
          {isLoading && !stats ? (
            <p className={styles.emptyState}>Loading recent accounts...</p>
          ) : recentPhotographers.length ? (
            <ul className={styles.recentList}>
              {recentPhotographers.map((person) => (
                <li key={person.id}>
                  <span className={styles.initials}>{person.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <span className={styles.personInfo}><b>{person.name}</b><small>{person.email || formatDate(person.createdAt)}</small></span>
                  <span className={`${styles.personStatus} ${styles[person.status]}`}>{person.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>No photographer signups to show.</p>
          )}
        </section>
      </div>

      <section className={styles.quickActions} aria-label="Admin shortcuts">
        <div>
          <p className={styles.panelEyebrow}>WORKSPACE</p>
          <h2>Quick access</h2>
        </div>
        <Link href="/admin/gallery"><span aria-hidden="true">▧</span><b>Manage homepage gallery</b><span aria-hidden="true">↗</span></Link>
        <Link href="/admin/partner_companis"><span aria-hidden="true">◇</span><b>Partner companies</b><span aria-hidden="true">↗</span></Link>
        <Link href="/admin/admins"><span aria-hidden="true">♙</span><b>Admin accounts</b><span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}