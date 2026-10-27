"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case "confirmed":
      return styles.statusConfirmed;
    case "completed":
      return styles.statusCompleted;
    case "cancelled":
      return styles.statusCancelled;
    case "rejected":
      return styles.statusRejected;
    case "pending":
    default:
      return styles.statusPending;
  }
}

function getAccessToken() {
  try {
    const saved = window.localStorage.getItem("photoConnectUser");
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user.accessToken || null;
  } catch {
    return null;
  }
}

function handleUnauthorized(router) {
  router.replace("/admin/security");
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const limit = 10;

  const fetchBookings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = getAccessToken();
      if (!token) {
        handleUnauthorized(router);
        return;
      }
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy: "eventDate",
        sortOrder: "desc",
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings?${params.toString()}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized(router);
        return;
      }

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Could not load bookings.");
      }

      if (isCurrent) {
        const data = result?.data || [];
          const total = result?.total || 0;
          const totalPagesCalc = Math.ceil(total / limit) || 1;
          setBookings(data);
          setTotalPages(totalPagesCalc);
          setTotalBookings(total);
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message || "Could not load bookings. Please try again.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

  let isCurrent = true;

  useEffect(() => {
    isCurrent = true;
    fetchBookings();
    return () => {
      isCurrent = false;
    };
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const statusCounts = bookings.reduce(
    (acc, booking) => {
      const status = booking.status?.toLowerCase() || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 }
  );

  return (
    <div>
      <div className={styles.pageIntro}>
        <div>
          <p className={styles.eyebrow}>WORKSPACE / BOOKINGS</p>
          <h1>Booking Management</h1>
          <p>View and manage all photographer bookings.</p>
        </div>
        <button className={styles.exportButton} onClick={() => window.print()}>
          ⇩ <span>Export report</span>
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIconTotal}>📋</span>
          <div>
            <small>Total Bookings</small>
            <strong>{totalBookings}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconPending}>◷</span>
          <div>
            <small>Pending</small>
            <strong>{statusCounts.pending || 0}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconConfirmed}>✓</span>
          <div>
            <small>Confirmed</small>
            <strong>{statusCounts.confirmed || 0}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconCompleted}>✓</span>
          <div>
            <small>Completed</small>
            <strong>{statusCounts.completed || 0}</strong>
          </div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>All Bookings</h2>
            <p>Manage and track booking statuses.</p>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.search}>
              <span>⌕</span>
              <input
                placeholder="Search bookings..."
                aria-label="Search bookings"
                value={searchTerm}
                onChange={handleSearch}
              />
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className={styles.statusSelect}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Photographer</th>
                <th>Client</th>
                            <th>Event Date(s)</th>
                            <th>Location</th>
                            <th>Duration</th>
                            <th>Status</th>
                <th>Amount</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className={styles.empty} colSpan="9">
                    Loading bookings...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className={styles.empty} colSpan="9" role="alert">
                    {error}
                  </td>
                </tr>
              )}
              {!isLoading && !error && bookings.length === 0 && (
                <tr>
                  <td className={styles.empty} colSpan="9">
                    No bookings found.
                  </td>
                </tr>
              )}
              {!isLoading && !error && bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <code className={styles.bookingId}>{booking._id?.slice(-8).toUpperCase()}</code>
                  </td>
                  <td>
                    <div className={styles.person}>
                      <span className={styles.personAvatar}>
                        <Image
                          src={
                            booking.photographerId?.profileImageUrl
                              ? /^https?:\/\//i.test(booking.photographerId.profileImageUrl)
                                ? booking.photographerId.profileImageUrl
                                : `${process.env.NEXT_PUBLIC_BACKEND_URL}${booking.photographerId.profileImageUrl}`
                              : `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/defolt_profile_pic.jpg`
                          }
                          alt=""
                          width={30}
                          height={30}
                          className={styles.personPhoto}
                          unoptimized
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/defolt_profile_pic.jpg`;
                          }}
                        />
                      </span>
                      <div>
                                    <b>{booking.photographerId?.name || "Unknown"}</b>
                                    <small>{booking.photographerId?.email || ""}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                                  <b>{booking.userId?.name || "Unknown"}</b>
                                  <small>{booking.userId?.email || ""}</small>
                                </div>
                              </td>
                              <td>
                                {Array.isArray(booking.eventDate) ? (
                                  booking.eventDate.map((date, idx) => (
                                    <div key={idx} className={styles.eventDateItem}>
                                      {formatDate(date)}
                                    </div>
                                  ))
                                ) : (
                                  formatDate(booking.eventDate)
                                )}
                              </td>
                              <td>{booking.eventLocation || "N/A"}</td>
                              <td>{booking.durationHours ? `${booking.durationHours} hrs` : "N/A"}</td>
                              <td>
                                <span className={`${styles.status} ${getStatusClass(booking.status)}`}>
                                  {statusLabels[booking.status?.toLowerCase()] || booking.status}
                                </span>
                              </td>
                              <td>₹{booking.totalPrice || 0}</td>
                              <td>{formatDateTime(booking.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                                  </table>
                                </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}

        <p className={styles.footerNote}>
          Showing {bookings.length} of {totalBookings} bookings <span>Live records</span>
        </p>
      </section>
    </div>
  );
}