"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const photographerId = params.id;
  const [photographer, setPhotographer] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (typeof photographerId !== "string") return;
    let isCurrent = true;

    async function loadPhotographer() {
      setIsLoading(true);
      setErrorMessage("");
      setPhotographer(null);
      setGalleryPhotos([]);
      setSelectedImage("");
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
                .sort((first, second) => first.sequence - second.sequence)
                .slice(0, 5),
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
                    src={getImageUrl(selectedImage || photographer.profileImageUrl)}
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
                <div className={styles.thumbnails} aria-label="Portfolio photos">
                  {galleryPhotos.map((photo, index) => (
                    <button
                      className={`${styles.thumbnail} ${
                        selectedImage === getImageUrl(photo.link)
                          ? styles.thumbnailSelected
                          : ""
                      }`}
                      key={photo._id || `${photo.link}-${index}`}
                      type="button"
                      aria-label={`View portfolio photo ${index + 1}`}
                      aria-pressed={selectedImage === getImageUrl(photo.link)}
                      onClick={() => setSelectedImage(getImageUrl(photo.link))}
                    >
                      <Image
                        src={getImageUrl(photo.link)}
                        alt=""
                        width={180}
                        height={120}
                        unoptimized
                      />
                    </button>
                  ))}
                  {galleryLoading && (
                    <p className={styles.galleryEmpty}>Loading portfolio photos...</p>
                  )}
                  {!galleryLoading && galleryError && (
                    <p className={styles.galleryEmpty} role="alert">
                      {galleryError}
                    </p>
                  )}
                  {!galleryLoading && !galleryError && !galleryPhotos.length && (
                    <p className={styles.galleryEmpty}>
                      This photographer has not uploaded sample photos yet.
                    </p>
                  )}
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
                  {photographer.portfolioUrl && (
                    <a
                      href={photographer.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Full Portfolio ↗
                    </a>
                  )}
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
                      const isBooked =
                        cell.currentMonth &&
                        occupiedDates.some(
                          (date) => String(date).slice(0, 10) === dateKey,
                        );
                      const isSelected =
                        cell.currentMonth && dateKey === selectedDate;

                      return (
                        <button
                          type="button"
                          key={`${cell.day}-${index}`}
                          className={
                            !cell.currentMonth
                              ? styles.mutedDay
                              : isBooked
                                ? styles.booked
                                : isSelected
                                  ? styles.selectedDay
                                  : styles.available
                          }
                          aria-pressed={isSelected}
                          onClick={() =>
                            cell.currentMonth &&
                            !isBooked &&
                            setSelectedDate(dateKey)
                          }
                          disabled={!cell.currentMonth || isBooked}
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
                  {selectedDate && (
                    <p className={styles.selectedDate}>
                      Selected date: {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
                    </p>
                  )}
                </section>
              </div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
