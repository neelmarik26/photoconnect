"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";

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
  const [statusFilter, setStatusFilter] = useState("pending");
  const [bookingStats, setBookingStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const limit = 10;

  const fetchBookings = useCallback(async (isActive = () => true) => {
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

      const [response, statsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings?${params.toString()}`,
          {
            headers: {
              accept: "*/*",
              ...(token ? { Authorization: 'Bearer ' + token } : {}),
            },
          },
        ),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/stats`, {
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
        }),
      ]);

      if (response.status === 401 || statsResponse.status === 401) {
        handleUnauthorized(router);
        return;
      }
      const [result, statsResult] = await Promise.all([
        response.json().catch(() => null),
        statsResponse.json().catch(() => null),
      ]);


      if (!response.ok) {
        throw new Error(result?.message || "Could not load bookings.");
      }

      if (isActive()) {
        const data = result?.data || [];
          const total = result?.total || 0;
          const totalPagesCalc = Math.ceil(total / limit) || 1;
          setBookings(data);
          setTotalPages(totalPagesCalc);
          setTotalBookings(total);
          if (statsResponse.ok) setBookingStats(statsResult || {});
        }
      } catch (err) {
        if (isActive()) {
          setError(err.message || "Could not load bookings. Please try again.");
        }
      } finally {
        if (isActive()) setIsLoading(false);
      }
    }, [currentPage, searchTerm, statusFilter, router]);

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve().then(() => fetchBookings(() => isCurrent));
    return () => {
      isCurrent = false;
    };
  }, [fetchBookings]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusTab = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBookingStatus = async (booking, nextStatus) => {
    const action = {
      confirmed: "Confirm",
      rejected: "Reject",
      completed: "Complete",
    }[nextStatus];
    const confirmation = await Swal.fire({
      icon: "question",
      title: `${action} this booking?`,
      text:
        nextStatus === "confirmed"
          ? "The photographer's selected event dates will be blocked."
          : nextStatus === "completed"
            ? "This booking will be marked as completed."
            : "This booking request will be marked as rejected.",
      showCancelButton: true,
      confirmButtonText: action,
      confirmButtonColor: nextStatus === "rejected" ? "#c7443e" : "#16877e",
    });

    if (!confirmation.isConfirmed) return;

    setUpdatingBookingId(booking._id);
    try {
      const savedUser = JSON.parse(window.localStorage.getItem(savedUserKey) || "null");
      const token = savedUser?.accessToken;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${encodeURIComponent(booking._id)}/status`,
        {
          method: "PATCH",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || `Could not ${nextStatus === "confirmed" ? "confirm" : "reject"} booking.`);
      }

      setBookings((current) =>
        current.map((item) =>
          item._id === booking._id ? { ...item, status: nextStatus } : item,
        ),
      );
      await Swal.fire({
        icon: "success",
        title:
          nextStatus === "confirmed"
            ? "Booking confirmed"
            : nextStatus === "completed"
              ? "Booking completed"
              : "Booking rejected",
        text:
          nextStatus === "confirmed"
            ? "The photographer has been blocked for the selected dates."
            : nextStatus === "completed"
              ? "The booking has been marked as completed."
              : "The booking request has been rejected.",
        confirmButtonColor: "#16877e",
      });
      fetchBookings();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message || "Could not update booking status.",
        confirmButtonColor: "#16877e",
      });
    } finally {
      setUpdatingBookingId("");
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
            <strong>{bookingStats.total ?? totalBookings}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconPending}>◷</span>
          <div>
            <small>Pending</small>
            <strong>{bookingStats.pending ?? statusCounts.pending ?? 0}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconConfirmed}>✓</span>
          <div>
            <small>Confirmed</small>
            <strong>{bookingStats.confirmed ?? statusCounts.confirmed ?? 0}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIconCompleted}>✓</span>
          <div>
            <small>Completed</small>
            <strong>{bookingStats.completed ?? statusCounts.completed ?? 0}</strong>
          </div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>All Bookings</h2>
            <p>Manage and track booking statuses.</p>
          </div>
          <label className={styles.search}>
            <span>⌕</span>
            <input
              placeholder="Search bookings..."
              aria-label="Search bookings"
              value={searchTerm}
              onChange={handleSearch}
            />
          </label>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Booking status">
          {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              className={statusFilter === status ? styles.tabActive : styles.tab}
              onClick={() => handleStatusTab(status)}
            >
              {status === "all" ? "All" : statusLabels[status]}
              <span>{status === "all" ? bookingStats.total ?? totalBookings : bookingStats[status] ?? 0}</span>
            </button>
          ))}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className={styles.empty} colSpan="10">
                    Loading bookings...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className={styles.empty} colSpan="10" role="alert">
                    {error}
                  </td>
                </tr>
              )}
              {!isLoading && !error && bookings.length === 0 && (
                <tr>
                  <td className={styles.empty} colSpan="10">
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
                              <td>
                                {booking.status?.toLowerCase() === "pending" ? (
                                  <div className={styles.actions}>
                                    <button
                                      type="button"
                                      className={`${styles.actionButton} ${styles.confirmButton}`}
                                      onClick={() => handleBookingStatus(booking, "confirmed")}
                                      disabled={updatingBookingId === booking._id}
                                    >
                                      {updatingBookingId === booking._id ? "Updating..." : "Confirm"}
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.actionButton} ${styles.rejectButton}`}
                                      onClick={() => handleBookingStatus(booking, "rejected")}
                                      disabled={updatingBookingId === booking._id}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : booking.status?.toLowerCase() === "confirmed" ? (
                                  <div className={styles.actions}>
                                    <button
                                      type="button"
                                      className={`${styles.actionButton} ${styles.completeButton}`}
                                      onClick={() => handleBookingStatus(booking, "completed")}
                                      disabled={updatingBookingId === booking._id}
                                    >
                                      {updatingBookingId === booking._id ? "Updating..." : "Complete"}
                                    </button>
                                  </div>
                                ) : (
                                  <span className={styles.noActions}>—</span>
                                )}
                              </td>
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
