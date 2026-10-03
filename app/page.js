"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "./components/Navbar";
import PhotographerCard from "./components/PhotographerCard";
import Footer from "./components/Footer";

const calendarDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const savedUserKey = "photoConnectUser";
const defaultProfileImage = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/defolt_profile_pic.jpg`;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function getImageUrl(path) {
  if (!path) return defaultProfileImage;
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
}

function getUploadUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  // If path starts with /public/, it's a backend-served static file
  if (path.startsWith("/public/")) {
    return `${BACKEND_URL}${path}`;
  }
  return `${BASE_PATH}${path}`;
}

function mapPhotographer(user) {
  return {
    ...user,
    id: user._id,
    location: [user.city, user.state, user.country].filter(Boolean).join(", ") || "Location not provided",
    rating: Number(user.rating) || 0,
    reviews: Number(user.totalReviews) || 0,
    tags: Array.isArray(user.specialties) ? user.specialties : [],
    experience: user.experienceYears ? `${user.experienceYears} years` : "",
    image: getImageUrl(user.profileImageUrl),
  };
}

function getCalendarCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    cells.push({ day: daysInPreviousMonth - index, currentMonth: false });
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

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState("");
  const [photographers, setPhotographers] = useState([]);
  const [photographersLoading, setPhotographersLoading] = useState(true);
  const [photographersError, setPhotographersError] = useState("");
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [profileDragging, setProfileDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [heroConfig, setHeroConfig] = useState({
    images: [],
    title: "Find the Perfect\nPhotographer for Your Event",
    description: "Talented. Trusted. Available.",
    script: "Moments\nThat Last Forever",
  });
  const [heroConfigLoaded, setHeroConfigLoaded] = useState(false);
  const swipeStartX = useRef(null);
  const profileSwipeStartY = useRef(null);

  // Load hero images from backend API
  useEffect(() => {
    async function loadHeroImages() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config`);
        if (response.ok) {
          const data = await response.json();
          setHeroConfig((prev) => ({
            ...prev,
            images: data.images || [],
            title: data.title || prev.title,
            description: data.description || prev.description,
            script: data.script || prev.script,
          }));
        }
      } catch (error) {
        console.error("Failed to load hero images from backend:", error);
      } finally {
        setHeroConfigLoaded(true);
      }
    }
    loadHeroImages();

    // Listen for changes from admin panel
    function handleCustomEvent(event) {
      if (event.detail?.hero) {
        let heroData = event.detail.hero;
        // Migration for old format
        if (heroData.image && !heroData.images) {
          heroData = { ...heroData, images: heroData.image ? [heroData.image] : [] };
        }
        setHeroConfig((prev) => ({ ...prev, ...heroData }));
      }
    }

    window.addEventListener("heroConfigChanged", handleCustomEvent);

    return () => {
      window.removeEventListener("heroConfigChanged", handleCustomEvent);
    };
  }, []);

  // Apply text updates from the admin editor when it is open in the same tab.
  useEffect(() => {
    function handleCustomEvent(event) {
      if (event.detail?.hero) {
        setHeroConfig((prev) => ({
          ...prev,
          title: event.detail.hero.title || prev.title,
          description: event.detail.hero.description || prev.description,
          script: event.detail.hero.script || prev.script,
        }));
      }
    }

    window.addEventListener("heroConfigChanged", handleCustomEvent);

    return () => {
      window.removeEventListener("heroConfigChanged", handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partner-companies?status=Published`,
    )
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load partner companies.");
        }
        return result;
      })
      .then((result) => {
        if (!isCurrent) return;
        const publishedPartners = Array.isArray(result?.data)
          ? result.data.filter((partner) => partner.status === "Published")
          : [];
        setPartners(
          publishedPartners.map((partner) => ({
            ...partner,
            id: String(partner._id ?? partner.id),
          })),
        );
      })
      .catch((error) => {
        if (isCurrent) {
          setPartnersError(error.message || "Could not load partner companies.");
        }
      })
      .finally(() => {
        if (isCurrent) setPartnersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Default fallback images if no custom hero images are set
  const defaultHeroImages = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=85",
  ];

  // Use custom hero images if available, otherwise fall back to default rotation
  // Only use backend images after they're loaded to avoid SSR flash of default images
  const heroImages = heroConfigLoaded && heroConfig.images.length > 0
    ? heroConfig.images.map((img) => getUploadUrl(typeof img === "string" ? img : img.url))
    : defaultHeroImages;
  const activeSlide = slide % heroImages.length;

  useEffect(() => {
    if (!heroConfigLoaded || heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setSlide((currentSlide) => (currentSlide + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroConfigLoaded, heroImages.length, slide]);

  useEffect(() => {
    let isCurrent = true;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photographers?page=1&limit=100`)
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load photographers.");
        }
        return result;
      })
      .then((result) => {
        if (isCurrent) {
          const users = Array.isArray(result?.data) ? result.data : [];
          setPhotographers(
            users.filter((user) => user.status === "active").map(mapPhotographer),
          );
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setPhotographersError(error.message || "Could not load photographers.");
        }
      })
      .finally(() => {
        if (isCurrent) setPhotographersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPhotographer?._id) return;

    let isCurrent = true;
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photo-galleries/user/${encodeURIComponent(selectedPhotographer._id)}?limit=50&sortBy=sequence&sortOrder=asc`,
    )
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load this photographer's gallery.");
        }
        return result;
      })
      .then((result) => {
        if (!isCurrent) return;
        const photos = Array.isArray(result?.data) ? result.data : [];
        setGalleryPhotos(
          photos
            .filter((photo) => !photo.isProfileImage && photo.link)
            .sort((first, second) => first.sequence - second.sequence)
            .slice(0, 3),
        );
      })
      .catch(() => {
        if (isCurrent) setGalleryPhotos([]);
      })
      .finally(() => {
        if (isCurrent) setGalleryLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedPhotographer]);

  function handleHeroPointerDown(event) {
    swipeStartX.current = null;
    if (event.target.closest("button, a, input")) return;

    swipeStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleHeroPointerUp(event) {
    if (swipeStartX.current === null) return;

    const distance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;

    if (Math.abs(distance) < 50) return;

    setSlide((currentSlide) =>
      distance < 0
        ? (currentSlide + 1) % heroImages.length
        : (currentSlide + heroImages.length - 1) % heroImages.length,
    );
  }

  function handleHeroPointerCancel() {
    swipeStartX.current = null;
  }

  function handleProfilePointerDown(event) {
    if (!event.target.closest("[data-profile-drag-handle]")) return;
    event.currentTarget.style.animation = "none";
    event.currentTarget.style.transform = "";
    profileSwipeStartY.current = event.clientY;
    setProfileDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleProfilePointerMove(event) {
    if (profileSwipeStartY.current === null) return;

    const distance = Math.max(0, event.clientY - profileSwipeStartY.current);
    event.currentTarget.style.transform = `translateY(${distance}px)`;
  }

  function handleProfilePointerUp(event) {
    if (profileSwipeStartY.current === null) return;

    const distance = event.clientY - profileSwipeStartY.current;
    profileSwipeStartY.current = null;
    setProfileDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (distance > 100) {
      event.currentTarget.style.transform = "translateY(100%)";
      window.setTimeout(() => setSelectedPhotographer(null), 220);
      return;
    }

    event.currentTarget.style.transform = "";
  }

  function handleProfilePointerCancel(event) {
    profileSwipeStartY.current = null;
    setProfileDragging(false);
    event.currentTarget.style.animation = "none";
    event.currentTarget.style.transform = "";
  }

  function closeProfile() {
    setSelectedPhotographer(null);
    setGalleryPhotos([]);
    setGalleryLoading(false);
  }

  function openPhotographer(person) {
    setSelectedPhotographer(person);
    setGalleryPhotos([]);
    setGalleryLoading(true);
  }

  function handleProfileBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeProfile();
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    if (selectedPhotographer) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = "hidden";
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") closeProfile();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedPhotographer]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log("Search input:", value);
  };

  return (
    <main id="home" className={styles.page}>
      <Navbar />
      <section
        className={styles.hero}
        onPointerDown={handleHeroPointerDown}
        onPointerUp={handleHeroPointerUp}
        onPointerCancel={handleHeroPointerCancel}
      >
        {!heroConfigLoaded && heroConfig.images.length === 0 ? (
          <div className={styles.heroLoading}>Loading hero images...</div>
        ) : (
          <>
            <div
              key={slide}
              className={styles.heroImage}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(4, 20, 28, .68), rgba(4, 20, 28, .06)), url(${heroImages[activeSlide]})`,
              }}
            />
            {heroImages.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.left}`}
                  onClick={() =>
                    setSlide((activeSlide + heroImages.length - 1) % heroImages.length)
                  }
                  aria-label="Previous hero image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.right}`}
                  onClick={() => setSlide((activeSlide + 1) % heroImages.length)}
                  aria-label="Next hero image"
                >
                  ›
                </button>
                <div className={styles.dots}>
                  {heroImages.map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={activeSlide === index ? styles.selected : ""}
                      onClick={() => setSlide(index)}
                      aria-label={`Show slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className={styles.heroWords}>
              <h1 dangerouslySetInnerHTML={{ __html: heroConfig.title.replace(/\n/g, "<br />") }} />
              <p>{heroConfig.description}</p>
            </div>
            <p className={styles.script} dangerouslySetInnerHTML={{ __html: heroConfig.script.replace(/\n/g, "<br />") }} />
          </>
        )}
      </section>
      <section id="photographers" className={styles.photographers}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Our Photographers</h2>
            <p>
              Browse and explore talented photographers. Click on a profile to
              view details.
            </p>
          </div>
          <button
            className={styles.scrollHintButton}
            type="button"
            aria-label="Scroll to photographer listings"
            onClick={() => document.getElementById("photographer-listings")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <span className={styles.scrollHintText}>Scroll to discover more</span>
            <span className={styles.scrollHintIcon} aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </span>
          </button>
        </div>

        {/* Search Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Search photographers..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search photographers"
            />
          </div>
        </div>

        {photographersLoading ? (
          <div id="photographer-listings" className={styles.loading}>
            <i />
            <span>Loading photographers...</span>
          </div>
        ) : photographersError ? (
          <p id="photographer-listings" className={styles.photographerState} role="alert">
            {photographersError}
          </p>
        ) : photographers.length ? (
          <div id="photographer-listings" className={styles.grid}>
            {photographers.map((person) => (
              <PhotographerCard
                key={person._id}
                person={person}
                onSelect={openPhotographer}
              />
            ))}
          </div>
        ) : (
          <p id="photographer-listings" className={styles.photographerState}>
            {photographers.length > 0
              ? "No photographers match your filters."
              : "No photographer profiles are available yet."}
          </p>
        )}
      </section>
      <section className={styles.partners}>
        <h2>Our Partner Companies</h2>
        <p>Proud to work with amazing organizations</p>
        {partnersLoading ? (
          <p className={styles.partnerState} role="status">
            Loading partner companies...
          </p>
        ) : partnersError ? (
          <p className={styles.partnerState} role="alert">
            {partnersError}
          </p>
        ) : partners.length === 0 ? (
          <p className={styles.partnerState}>
            No partner companies are available yet.
          </p>
        ) : (
          <div
            className={`${styles.partnerGrid} ${
              partners.length > 4 ? styles.hasMarquee : ""
            }`}
          >
            <div className={styles.partnerTrack}>
              {[false, true].map((isDuplicate) => (
                <div
                  className={styles.partnerSet}
                  aria-hidden={isDuplicate}
                  key={isDuplicate ? "duplicate" : "original"}
                >
                  {partners.map((partner) => (
                    <article key={`${partner.id}-${isDuplicate ? "duplicate" : "original"}`}>
                      <strong>{partner.icon}</strong>
                      <h3>{partner.name}</h3>
                      <small>{partner.description}</small>
                      <div aria-label={`${partner.name} social profiles`}>
                        {partner.facebookUrl && (
                          <a
                            className={styles.partnerFacebook}
                            href={partner.facebookUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${partner.name} on Facebook`}
                          >
                            f
                          </a>
                        )}
                        {partner.instagramUrl && (
                          <a
                            className={styles.partnerInstagram}
                            href={partner.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${partner.name} on Instagram`}
                          >
                            ◎
                          </a>
                        )}
                        {partner.linkedinUrl && (
                          <a
                            className={styles.partnerLinkedin}
                            href={partner.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${partner.name} on LinkedIn`}
                          >
                            in
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
      {selectedPhotographer && (
        <div
          className={styles.modalBackdrop}
          onClick={handleProfileBackdropClick}
          role="presentation"
        >
          <section
            className={`${styles.profileModal} ${
              profileDragging ? styles.profileDragging : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleProfilePointerDown}
            onPointerMove={handleProfilePointerMove}
            onPointerUp={handleProfilePointerUp}
            onPointerCancel={handleProfilePointerCancel}
          >
            <button
              className={styles.profileDragHandle}
              data-profile-drag-handle
              type="button"
              aria-label="Drag down to close profile"
            >
              <span />
            </button>
            <button
              className={styles.modalClose}
              onClick={closeProfile}
              aria-label="Close photographer profile"
            >
              ×
            </button>
            <div className={styles.profileGallery}>
              <div className={styles.profileMainImage}>
                <Image
                  src={getImageUrl(selectedPhotographer.profileImageUrl)}
                  alt={selectedPhotographer.name}
                  width={700}
                  height={500}
                  unoptimized
                />
              </div>
              <div className={styles.profileThumbs}>
                {galleryPhotos.map((photo, index) => (
                  <Image
                    key={photo._id || `${photo.link}-${index}`}
                    src={getImageUrl(photo.link)}
                    alt={`${selectedPhotographer.name} portfolio ${index + 1}`}
                    width={160}
                    height={90}
                    unoptimized
                  />
                ))}
                {!galleryLoading && galleryPhotos.length === 0 && (
                  <p className={styles.galleryEmpty}>
                    This photographer has not uploaded sample photos yet.
                  </p>
                )}
                {galleryLoading && <p className={styles.galleryEmpty}>Loading gallery...</p>}
              </div>
              <div className={styles.profileFacts}>
                <p>
                  <b>Location</b>
                  {selectedPhotographer.location}
                </p>
                <p>
                  <b>Profession</b>
                  {selectedPhotographer.proffession || "Not provided"}
                </p>
                <p>
                  <b>Experience</b>
                  {selectedPhotographer.experience || "Not provided"}
                </p>
                {selectedPhotographer.portfolioUrl && (
                  <a href={selectedPhotographer.portfolioUrl} target="_blank" rel="noreferrer">
                    View Full Portfolio ↗
                  </a>
                )}
              </div>
            </div>
            <div className={styles.profileDetails}>
              <div className={styles.profileHeading}>
                <div>
                  <h2 id="profile-title">{selectedPhotographer.name}</h2>
                  <p>{selectedPhotographer.proffession || "Photographer"}</p>
                </div>
                <span className={styles.approved}>✓ Approved</span>
              </div>
              <p className={styles.profileLocation}>
                ● {selectedPhotographer.location}
              </p>
              <div className={styles.profileStats}>
                <span>
                  {selectedPhotographer.rating > 0 ? (
                    <>
                      ★ <b>{selectedPhotographer.rating.toFixed(1)}</b> (
                      {selectedPhotographer.reviews} reviews)
                    </>
                  ) : (
                    "No reviews yet"
                  )}
                </span>
                <span>
                  ♣ {selectedPhotographer.experience || "5+ years"} experience
                </span>
              </div>
              <div className={styles.profileTags}>
                {selectedPhotographer.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className={styles.aboutProfile}>
                <h3>About Me</h3>
                <p>
                  {selectedPhotographer.bio || "No biography provided yet."}
                </p>
              </div>
              <div className={styles.calendar}>
                <h3>Availability Calendar ({calendarMonth.getFullYear()})</h3>
                <div className={styles.calendarHeader}>
                  <button
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
                  {calendarDays.map((day) => (
                    <b key={day}>{day}</b>
                  ))}
                  {getCalendarCells(calendarMonth).map((cell, index) => {
                    const dateKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                    const isBooked =
                      cell.currentMonth &&
                      (selectedPhotographer.occupiedDates || []).some(
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
                        onClick={() =>
                          cell.currentMonth && setSelectedDate(dateKey)
                        }
                        disabled={!cell.currentMonth}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.calendarLegend}>
                  <span>
                    <i className={styles.availableDot} /> Available
                  </span>
                  <span>
                    <i className={styles.bookedDot} /> Booked
                  </span>
                  <span>
                    <i className={styles.selectedDot} /> Selected
                  </span>
                </div>
              </div>
              <button
                className={styles.modalCloseButton}
                onClick={() => setSelectedPhotographer(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
