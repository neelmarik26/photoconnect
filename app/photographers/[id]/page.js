"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const fallbackImage = `${basePath}/defolt_profile_pic.jpg`;

function getImageUrl(path) {
  if (!path) return fallbackImage;
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendUrl}${path}`;
}

function getCalendarCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    cells.push({ day: new Date(year, month, 0).getDate() - index, currentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, currentMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 35) {
    cells.push({ day: nextDay, currentMonth: false });
    nextDay += 1;
  }
  return cells;
}

function getDateKey(date, day) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function PhotographerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const photographerId = params.id;
  const [photographer, setPhotographer] = useState(null);
  const [profileVideos, setProfileVideos] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [isPhotographerAccount, setIsPhotographerAccount] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [modalCalendarMonth, setModalCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
    const [selectedDates, setSelectedDates] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventDate: [],
    eventLocation: "",
    durationHours: "",
    totalPrice: "",
    notes: "",
    specialRequirements: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  async function handleBookNow() {
    let user;
    try {
      user = JSON.parse(window.localStorage.getItem("photoConnectUser") || "null");
    } catch {
      user = null;
    }

    if (!user?.userId) {
      const result = await Swal.fire({
        icon: "info",
        title: "Sign in to book",
        text: "Please sign in to your account before booking a photographer.",
        confirmButtonText: "Continue",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3085d6",
      });
      if (result.isConfirmed) {
        router.push("/signin");
      }
      return;
    }

    if (user.type?.toUpperCase() !== "PARTNER") {
      await Swal.fire({
        icon: "error",
        title: "Partner account required",
        text: "Only partner accounts can book photographers. Please sign in with a partner account.",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (selectedDates.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "No date selected",
        text: "Please select at least one date from the calendar before booking.",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setBookingError("");
    setBookingSuccess(false);
    setBookingForm((prev) => ({
      ...prev,
      eventDate: selectedDates.map(
        (date) => new Date(`${date}T10:00:00.000Z`).toISOString(),
      ),
    }));
    setShowBookingModal(true);
    const now = new Date();
    setModalCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  useEffect(() => {
    function loadAccountType() {
      const savedUser = window.localStorage.getItem("photoConnectUser");
      if (!savedUser) {
        setIsPhotographerAccount(false);
        return;
      }

      try {
        const user = JSON.parse(savedUser);
        setIsPhotographerAccount(user.type?.toUpperCase() === "PHOTOGRAPHER");
      } catch {
        setIsPhotographerAccount(false);
      }
    }

    loadAccountType();
    window.addEventListener("storage", loadAccountType);
    return () => window.removeEventListener("storage", loadAccountType);
  }, []);

  useEffect(() => {
    if (typeof photographerId !== "string") return;
    let isCurrent = true;

    async function loadPhotographer() {
      setIsLoading(true);
      setErrorMessage("");
      setPhotographer(null);
      setProfileVideos([]);
      setGalleryPhotos([]);
      setSelectedMedia(null);
      setGalleryError("");

      try {
        const response = await fetch(
          `${backendUrl}/api/users/${encodeURIComponent(photographerId)}`,
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load this photographer.");
        }
        if (result?.type !== "PHOTOGRAPHER" || result?.status !== "active") {
          throw new Error("This photographer profile is not available.");
        }
        if (!isCurrent) return;

        setPhotographer(result);
        setIsLoading(false);

        try {
          const videosResponse = await fetch(
            `${backendUrl}/api/users/${encodeURIComponent(photographerId)}/profile-videos`,
          );
          const videosResult = await videosResponse.json().catch(() => null);
          if (!videosResponse.ok) {
            throw new Error(
              videosResult?.message || "Could not load this photographer's videos.",
            );
          }
          if (isCurrent) {
            setProfileVideos(
              Array.isArray(videosResult)
                ? videosResult
                : videosResult?.data ?? [],
            );
          }
        } catch (error) {
          if (isCurrent) {
            setGalleryError(
              error.message || "Could not load this photographer's videos.",
            );
          }
        }

        try {
          const galleryResponse = await fetch(
            `${backendUrl}/api/photo-galleries/user/${encodeURIComponent(photographerId)}?limit=50&sortBy=sequence&sortOrder=asc`,
          );
          const galleryResult = await galleryResponse.json().catch(() => null);
          if (!galleryResponse.ok) {
            throw new Error(
              galleryResult?.message || "Could not load this photographer's gallery.",
            );
          }
          if (isCurrent) {
            const photos = Array.isArray(galleryResult?.data)
              ? galleryResult.data
              : [];
            setGalleryPhotos(
              photos
                .filter((photo) => !photo.isProfileImage && photo.link)
                .sort((first, second) => first.sequence - second.sequence),
            );
          }
        } catch (error) {
          if (isCurrent) {
            setGalleryError(
              error.message || "Could not load this photographer's gallery.",
            );
          }
        } finally {
          if (isCurrent) setGalleryLoading(false);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message || "Could not load this photographer.");
          setIsLoading(false);
          setGalleryLoading(false);
        }
      }
    }

    loadPhotographer();
    return () => {
      isCurrent = false;
    };
  }, [photographerId]);

  const location = photographer
    ? [photographer.city, photographer.state, photographer.country]
        .filter(Boolean)
        .join(", ") || "Location not provided"
    : "";
  const experience = photographer?.experienceYears
    ? `${photographer.experienceYears} years`
    : "";
  const specialties = Array.isArray(photographer?.specialties)
    ? photographer.specialties
    : [];
  const occupiedDates = Array.isArray(photographer?.occupiedDates)
    ? photographer.occupiedDates
    : [];
  const profileVideoUrls = (
    profileVideos.length
      ? [...profileVideos]
          .sort((first, second) => first.slot - second.slot)
          .map((video) => video.videoUrl)
      : Array.isArray(photographer?.profileVideoUrls) &&
          photographer.profileVideoUrls.length
        ? photographer.profileVideoUrls
        : photographer?.profileVideoUrl
          ? [photographer.profileVideoUrl]
          : []
  ).filter(Boolean);
  const portfolioMedia = [
    ...galleryPhotos.map((photo, index) => ({
      type: "photo",
      src: getImageUrl(photo.link),
      label: `Portfolio photo ${index + 1}`,
      key: photo._id || `${photo.link}-${index}`,
    })),
    ...profileVideoUrls.map((videoUrl, index) => ({
      type: "video",
      src: getImageUrl(videoUrl),
      label: `Profile video ${index + 1}`,
      key: `${videoUrl}-${index}`,
    })),
  ];

  useEffect(() => {
    if (!selectedMedia) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedMedia(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedMedia]);

  useEffect(() => {
    if (!showBookingModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape" && !bookingLoading) {
        setShowBookingModal(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showBookingModal, bookingLoading]);

    const handleBookingSubmit = async (e) => {
      e.preventDefault();
      setBookingError("");
      setBookingSuccess(false);

      if (bookingForm.eventDate.filter(Boolean).length === 0) {
        setBookingError("Please select at least one date before booking.");
        return;
      }

      // Validate no occupied dates in the form
      const hasOccupiedDate = bookingForm.eventDate.some((date) => {
        const dateKey = date?.slice(0, 10);
        return occupiedDates.some((d) => String(d).slice(0, 10) === dateKey);
      });

      if (hasOccupiedDate) {
        setBookingError("One or more selected dates are already booked. Please choose different dates.");
        return;
      }

      setBookingLoading(true);
      try {
        const user = JSON.parse(window.localStorage.getItem("photoConnectUser") || "{}");
        if (!user.userId) {
          throw new Error("Please log in to book a photographer.");
        }

        const response = await fetch(`${backendUrl}/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            photographerId,
            userId: user.userId,
            eventDate: bookingForm.eventDate.filter(Boolean),
            eventLocation: bookingForm.eventLocation,
            durationHours: bookingForm.durationHours,
            totalPrice: bookingForm.totalPrice,
            notes: bookingForm.notes,
            specialRequirements: bookingForm.specialRequirements,
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || "Could not create booking. Please try again.");
        }

        setBookingSuccess(true);
        setBookingForm({
          eventDate: [],
          eventLocation: "",
          durationHours: 4,
          totalPrice: 600,
          notes: "",
          specialRequirements: "",
        });
        setSelectedDates([]);
        setShowBookingModal(false);
      } catch (err) {
        setBookingError(err.message || "Could not create booking. Please try again.");
      } finally {
        setBookingLoading(false);
      }
    };

  return (
    <main className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <Link className={styles.backLink} href="/#photographers">
          <span aria-hidden="true">←</span> Back to photographers
        </Link>

        {isLoading && (
          <p className={styles.stateMessage} role="status">
            Loading photographer profile...
          </p>
        )}
        {!isLoading && errorMessage && !photographer && (
          <section className={styles.errorCard} role="alert">
            <h1>Photographer not found</h1>
            <p>{errorMessage}</p>
            <Link href="/#photographers">Browse photographers</Link>
          </section>
        )}

        {photographer && (
          <>
            <header className={styles.pageHeading}>
              <p>PHOTOGRAPHER PROFILE</p>
              <h1>Meet your photographer</h1>
            </header>
            <section className={styles.profileCard} aria-labelledby="profile-title">
              <div className={styles.galleryColumn}>
                <div className={styles.mainImage}>
                  <Image
                    src={getImageUrl(photographer.profileImageUrl)}
                    alt={photographer.name}
                    width={900}
                    height={700}
                    unoptimized
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </div>
                <div className={styles.facts}>
                  <p>
                    <b>Location</b>
                    {location}
                  </p>
                  <p>
                    <b>Profession</b>
                    {photographer.proffession || "Not provided"}
                  </p>
                  <p>
                    <b>Experience</b>
                    {experience || "Not provided"}
                  </p>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.profileHeading}>
                  <div>
                    <h2 id="profile-title">{photographer.name}</h2>
                    <p>{photographer.proffession || "Photographer"}</p>
                  </div>
                  <span className={styles.approved}>✓ Approved</span>
                </div>
                <p className={styles.location}>● {location}</p>
                <div className={styles.stats}>
                  <span>
                    {Number(photographer.rating) > 0 ? (
                      <>
                        ★ <b>{Number(photographer.rating).toFixed(1)}</b> (
                        {Number(photographer.totalReviews) || 0} reviews)
                      </>
                    ) : (
                      "No reviews yet"
                    )}
                  </span>
                  <span>♣ {experience || "5+ years"} experience</span>
                </div>
                {specialties.length > 0 && (
                  <div className={styles.tags}>
                    {specialties.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
                <div className={styles.about}>
                  <h3>About Me</h3>
                  <p>{photographer.bio || "No biography provided yet."}</p>
                </div>
                {photographer.about && (
                  <div className={styles.about}>
                    <h3>More about {photographer.name}</h3>
                    <p>{photographer.about}</p>
                  </div>
                )}
                <section className={styles.calendar}>
                  <h3>Availability Calendar ({calendarMonth.getFullYear()})</h3>
                  <div className={styles.calendarHeader}>
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      ‹
                    </button>
                    <b>
                      {calendarMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </b>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className={styles.calendarGrid}>
                    {weekdays.map((day) => (
                      <b key={day}>{day}</b>
                    ))}
                    {getCalendarCells(calendarMonth).map((cell, index) => {
                      const dateKey = getDateKey(calendarMonth, cell.day);
                      const cellDate = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        cell.day,
                      );
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = cellDate < today;
                      const isBooked =
                        cell.currentMonth &&
                        !isPast &&
                        occupiedDates.some(
                          (date) => String(date).slice(0, 10) === dateKey,
                        );
                      const isSelected =
                        cell.currentMonth && selectedDates.includes(dateKey);

                      return (
                        <button
                          type="button"
                          key={`${cell.day}-${index}`}
                          className={
                            !cell.currentMonth
                              ? styles.mutedDay
                              : isPast
                                ? styles.pastDay
                                : isBooked
                                  ? styles.booked
                                  : isSelected
                                    ? styles.selectedDay
                                    : styles.available
                          }
                          aria-pressed={isSelected}
                          onClick={() => {
                            if (
                              !cell.currentMonth ||
                              isBooked ||
                              isPast
                            )
                              return;
                            setSelectedDates((prev) => {
                              if (prev.includes(dateKey)) {
                                return prev.filter((d) => d !== dateKey);
                              }
                              if (prev.length >= 3) {
                                return prev;
                              }
                              return [...prev, dateKey];
                            });
                          }}
                          disabled={
                            !cell.currentMonth || isBooked || isPast
                          }
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                                    </div>
                                    <div className={styles.calendarLegend}>
                                      <span><i className={styles.availableDot} /> Available</span>
                                      <span><i className={styles.bookedDot} /> Booked</span>
                                      <span><i className={styles.selectedDot} /> Selected</span>
                                    </div>
                                    {selectedDates.length > 0 && (
                                      <div className={styles.selectedDates}>
                                        <p>Selected dates:</p>
                                        <ul>
                                          {selectedDates.map((date) => (
                                            <li key={date}>
                                              {new Date(`${date}T00:00:00`).toLocaleDateString()}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {isPhotographerAccount === false && (
                                      <button
                                        type="button"
                                        className={styles.bookButton}
                                        onClick={handleBookNow}
                                      >
                                        Book Now ({selectedDates.length}/3)
                                      </button>
                                    )}
                                  </section>
                                </div>
                              </section>
                              <section
                                className={styles.portfolioCard}
                                aria-labelledby="portfolio-title"
                              >
                                <header className={styles.portfolioHeader}>
                                  <div>
                                    <p>PORTFOLIO</p>
                                    <h2 id="portfolio-title">
                                      Photos &amp; videos
                                    </h2>
                                  </div>
                                  <span>
                                    {portfolioMedia.length}{" "}
                                    {portfolioMedia.length === 1
                                      ? "item"
                                      : "items"}
                                  </span>
                                </header>
                                {galleryError && (
                                  <p className={styles.galleryStatus} role="alert">
                                    {galleryError}
                                  </p>
                                )}
                                {galleryLoading ? (
                                  <p className={styles.galleryStatus} role="status">
                                    Loading portfolio...
                                  </p>
                                ) : portfolioMedia.length ? (
                                  <div className={styles.portfolioGrid}>
                                    {portfolioMedia.map((item) => (
                                      <button
                                        className={styles.portfolioItem}
                                        key={item.key}
                                        type="button"
                                        aria-label={`Open ${item.label}`}
                                        onClick={() => setSelectedMedia(item)}
                                      >
                                        {item.type === "photo" ? (
                                          <Image
                                            className={styles.portfolioPhoto}
                                            src={item.src}
                                            alt={item.label}
                                            width={700}
                                            height={500}
                                            unoptimized
                                          />
                                        ) : (
                                          <video
                                            className={styles.portfolioVideo}
                                            src={item.src}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            preload="metadata"
                                            aria-label={item.label}
                                          />
                                        )}
                                        <span className={styles.portfolioItemLabel}>
                                          {item.type === "video" ? "▶ " : ""}
                                          {item.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className={styles.galleryStatus}>
                                    This photographer has not uploaded any
                                    portfolio photos or videos yet.
                                  </p>
                                )}
                              </section>
                              {selectedMedia && (
                                <div
                                  className={styles.lightboxOverlay}
                                  role="presentation"
                                  onClick={() => setSelectedMedia(null)}
                                >
                                  <section
                                    className={styles.lightbox}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label={selectedMedia.label}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      className={styles.lightboxClose}
                                      type="button"
                                      aria-label="Close gallery preview"
                                      onClick={() => setSelectedMedia(null)}
                                    >
                                      ×
                                    </button>
                                    {selectedMedia.type === "photo" ? (
                                      <Image
                                        className={styles.lightboxPhoto}
                                        src={selectedMedia.src}
                                        alt={selectedMedia.label}
                                        width={1600}
                                        height={1200}
                                        unoptimized
                                      />
                                    ) : (
                                      <video
                                        className={styles.lightboxVideo}
                                        src={selectedMedia.src}
                                        autoPlay
                                        controls
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                    )}
                                  </section>
                                </div>
                              )}
                            </>
                          )}

                          {/* Booking Modal */}
                          {showBookingModal && (
                            <div
                              className={styles.modalOverlay}
                              onClick={() => {
                                if (!bookingLoading) setShowBookingModal(false);
                              }}
                            >
                              <section
                                className={styles.modal}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="booking-modal-title"
                                aria-describedby="booking-modal-description"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className={styles.modalHeader}>
                                  <div>
                                    <p className={styles.modalEyebrow}>BOOKING REQUEST</p>
                                    <h3 id="booking-modal-title">Book {photographer?.name}</h3>
                                    <p id="booking-modal-description">
                                      Share your event details to send a booking request.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className={styles.modalClose}
                                    onClick={() => setShowBookingModal(false)}
                                    disabled={bookingLoading}
                                    aria-label="Close booking form"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className={styles.bookingSummary}>
                                  <Image
                                    className={styles.bookingAvatar}
                                    src={getImageUrl(photographer?.profileImageUrl)}
                                    alt=""
                                    width={48}
                                    height={48}
                                    unoptimized
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src = fallbackImage;
                                    }}
                                  />
                                  <div className={styles.bookingSummaryCopy}>
                                    <strong>{photographer?.name}</strong>
                                    <span>{location}</span>
                                  </div>
                                  <span className={styles.bookingDateCount}>
                                    {bookingForm.eventDate.length}{" "}
                                    {bookingForm.eventDate.length === 1 ? "date" : "dates"}
                                  </span>
                                </div>
                                <form onSubmit={handleBookingSubmit} className={styles.modalForm}>
                                  <div className={styles.modalFormContent}>
                                    {bookingError && (
                                      <div className={styles.modalError} role="alert">
                                        {bookingError}
                                      </div>
                                    )}
                                    {bookingSuccess && (
                                      <div className={styles.modalSuccess} role="status">
                                        Booking submitted successfully!
                                      </div>
                                    )}

                                    <section className={`${styles.bookingSection} ${styles.bookingSectionDates}`}>
                                      <div className={styles.bookingSectionHeading}>
                                        <span className={styles.bookingStep}>1</span>
                                        <div>
                                          <h4>Event dates</h4>
                                          <p>Choose up to three possible dates.</p>
                                        </div>
                                      </div>
                                      <div className={styles.modalDatePicker}>
                                        <span className={styles.fieldLabel}>Event date(s) *</span>
                                        <div className={styles.modalCalendar}>
                                          <div className={styles.modalCalendarHeader}>
                                            <button
                                              type="button"
                                              aria-label="Previous month"
                                              onClick={() =>
                                                setModalCalendarMonth(
                                                  new Date(
                                                    modalCalendarMonth.getFullYear(),
                                                    modalCalendarMonth.getMonth() - 1,
                                                    1,
                                                  ),
                                                )
                                              }
                                            >
                                              ‹
                                            </button>
                                            <div className={styles.modalMonthYear}>
                                              <select
                                                aria-label="Select month"
                                                value={String(modalCalendarMonth.getMonth() + 1)}
                                                onChange={(e) => {
                                                  const m = parseInt(e.target.value, 10);
                                                  if (!isNaN(m) && m >= 1 && m <= 12) {
                                                    setModalCalendarMonth(
                                                      new Date(
                                                        modalCalendarMonth.getFullYear(),
                                                        m - 1,
                                                        1,
                                                      ),
                                                    );
                                                  }
                                                }}
                                              >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                                  <option key={m} value={m}>
                                                    {new Date(2000, m - 1, 1).toLocaleDateString("en-US", {
                                                      month: "short",
                                                    })}
                                                  </option>
                                                ))}
                                              </select>
                                              <select
                                                aria-label="Select year"
                                                value={String(modalCalendarMonth.getFullYear())}
                                                onChange={(e) => {
                                                  const y = parseInt(e.target.value, 10);
                                                  if (!isNaN(y) && y >= 1900 && y <= 2100) {
                                                    setModalCalendarMonth(
                                                      new Date(y, modalCalendarMonth.getMonth(), 1),
                                                    );
                                                  }
                                                }}
                                              >
                                                {[...Array(201).keys()].map((i) => {
                                                  const y = 1900 + i;
                                                  return <option key={y} value={y}>{y}</option>;
                                                })}
                                              </select>
                                            </div>
                                            <button
                                              type="button"
                                              aria-label="Next month"
                                              onClick={() =>
                                                setModalCalendarMonth(
                                                  new Date(
                                                    modalCalendarMonth.getFullYear(),
                                                    modalCalendarMonth.getMonth() + 1,
                                                    1,
                                                  ),
                                                )
                                              }
                                            >
                                              ›
                                            </button>
                                          </div>
                                          <div className={styles.modalCalendarGrid}>
                                            {weekdays.map((day) => (
                                              <b key={day}>{day}</b>
                                            ))}
                                            {getCalendarCells(modalCalendarMonth).map((cell, index) => {
                                              const dateKey = getDateKey(modalCalendarMonth, cell.day);
                                              const cellDate = new Date(
                                                modalCalendarMonth.getFullYear(),
                                                modalCalendarMonth.getMonth(),
                                                cell.day,
                                              );
                                              const today = new Date();
                                              today.setHours(0, 0, 0, 0);
                                              const isPast = cellDate < today;
                                              const isSelected = bookingForm.eventDate.some(
                                                (d) => String(d).slice(0, 10) === dateKey,
                                              );
                                              const isOccupied = occupiedDates.some(
                                                (date) => String(date).slice(0, 10) === dateKey,
                                              );
                                              const isDisabled = isPast || isOccupied || !cell.currentMonth;

                                              return (
                                                <button
                                                  type="button"
                                                  key={`${cell.day}-${index}`}
                                                  className={
                                                    !cell.currentMonth
                                                      ? styles.modalMutedDay
                                                      : isPast
                                                        ? styles.modalPastDay
                                                        : isOccupied
                                                          ? styles.modalBookedDay
                                                          : isSelected
                                                            ? styles.modalSelectedDay
                                                            : styles.modalAvailableDay
                                                  }
                                                  aria-pressed={isSelected}
                                                  onClick={() => {
                                                    if (isDisabled) return;
                                                    if (isSelected) {
                                                      if (bookingForm.eventDate.length <= 1) {
                                                        setBookingError("At least one date is required.");
                                                        return;
                                                      }
                                                      setBookingForm((prev) => ({
                                                        ...prev,
                                                        eventDate: prev.eventDate.filter(
                                                          (d) =>
                                                            String(d).slice(0, 10) !==
                                                            dateKey,
                                                        ),
                                                      }));
                                                      setBookingError("");
                                                      return;
                                                    }
                                                    if (bookingForm.eventDate.length >= 3) return;
                                                    setBookingForm((prev) => ({
                                                      ...prev,
                                                      eventDate: [
                                                        ...prev.eventDate,
                                                        new Date(`${dateKey}T10:00:00.000Z`).toISOString(),
                                                      ],
                                                    }));
                                                    setBookingError("");
                                                  }}
                                                  disabled={isDisabled}
                                                >
                                                  {cell.day}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {bookingForm.eventDate.length > 0 && (
                                            <div className={styles.modalSelectedDates}>
                                              <p>Selected dates:</p>
                                              <ul>
                                                {bookingForm.eventDate.map((date, idx) => {
                                                  const label = new Date(date).toLocaleDateString();
                                                  return (
                                                    <li key={idx}>
                                                      {label}
                                                      <button
                                                        type="button"
                                                        className={styles.modalRemoveDateBtn}
                                                        onClick={() => {
                                                          if (bookingForm.eventDate.length <= 1) {
                                                            setBookingError("At least one date is required.");
                                                            return;
                                                          }
                                                          setBookingForm((prev) => ({
                                                            ...prev,
                                                            eventDate: prev.eventDate.filter(
                                                              (_, i) => i !== idx,
                                                            ),
                                                          }));
                                                          setBookingError("");
                                                        }}
                                                        aria-label={`Remove ${label}`}
                                                      >
                                                        ×
                                                      </button>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            </div>
                                          )}
                                          {bookingForm.eventDate.length < 3 && (
                                            <small>You can select up to 3 dates. Unavailable dates cannot be selected.</small>
                                          )}
                                        </div>
                                      </div>
                                    </section>

                                    <section className={`${styles.bookingSection} ${styles.bookingSectionDetails}`}>
                                      <div className={styles.bookingSectionHeading}>
                                        <span className={styles.bookingStep}>2</span>
                                        <div>
                                          <h4>Event details</h4>
                                          <p>Tell the photographer where and how long.</p>
                                        </div>
                                      </div>
                                  <div className={styles.modalField}>
                                    <label htmlFor="eventLocation">Event location *</label>
                                    <input
                                      type="text"
                                      id="eventLocation"
                                      value={bookingForm.eventLocation}
                                      onChange={(e) => setBookingForm((prev) => ({ ...prev, eventLocation: e.target.value }))}
                                      placeholder="e.g., 123 Main St, City, State"
                                      required
                                    />
                                  </div>

                                      <div className={styles.bookingFieldsGrid}>
                                  <div className={styles.modalField}>
                                    <label htmlFor="durationHours">Duration (hours) *</label>
                                    <input
                                      type="number"
                                      id="durationHours"
                                      value={bookingForm.durationHours}
                                      onChange={(e) => setBookingForm((prev) => ({ ...prev, durationHours: parseInt(e.target.value) || 0 }))}
                                      min="1"
                                      max="24"
                                      required
                                    />
                                  </div>

                                  <div className={styles.modalField}>
                                    <label htmlFor="totalPrice">Your budget (₹) *</label>
                                    <input
                                      type="number"
                                      id="totalPrice"
                                      value={bookingForm.totalPrice}
                                      onChange={(e) => setBookingForm((prev) => ({ ...prev, totalPrice: parseInt(e.target.value) || 0 }))}
                                      min="0"
                                      required
                                    />
                                  </div>
                                      </div>
                                    </section>

                                    <section className={`${styles.bookingSection} ${styles.bookingSectionNotes}`}>
                                      <div className={styles.bookingSectionHeading}>
                                        <span className={styles.bookingStep}>3</span>
                                        <div>
                                          <h4>Anything else?</h4>
                                          <p>Optional details help personalize your booking.</p>
                                        </div>
                                      </div>
                                  <div className={styles.modalField}>
                                    <label htmlFor="notes">Notes</label>
                                    <textarea
                                      id="notes"
                                      value={bookingForm.notes}
                                      onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                                      placeholder="e.g., Outdoor wedding ceremony"
                                      rows="3"
                                    />
                                  </div>

                                  <div className={styles.modalField}>
                                    <label htmlFor="specialRequirements">Special requirements</label>
                                    <textarea
                                      id="specialRequirements"
                                      value={bookingForm.specialRequirements}
                                      onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequirements: e.target.value }))}
                                      placeholder="e.g., Need drone shots"
                                      rows="3"
                                    />
                                  </div>
                                    </section>
                                  </div>

                                  <div className={styles.modalActions}>
                                    <button
                                      type="button"
                                      className={styles.modalCancel}
                                      onClick={() => {
                                        setShowBookingModal(false);
                                        setBookingError("");
                                      }}
                                      disabled={bookingLoading}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className={styles.modalSubmit}
                                      disabled={bookingLoading}
                                    >
                                      {bookingLoading ? "Sending request..." : "Send booking request"}
                                    </button>
                                  </div>
                                </form>
                              </section>
                            </div>
                          )}
                        </div>
                        <Footer />
                      </main>
                    );
                  }
