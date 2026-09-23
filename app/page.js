"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "./components/Navbar";
import PhotographerCard from "./components/PhotographerCard";
import Footer from "./components/Footer";

const photographers = [
  {
    name: "Arjun Mehta",
    location: "Mumbai, Maharashtra",
    rating: "4.8",
    reviews: 24,
    tags: ["Wedding", "Event", "Portrait"],
    experience: "5+ years",
    languages: "English, Hindi, Marathi",
    id: "PH00123",
    bio: "I am a passionate photographer specializing in weddings and events. I love capturing real emotions and creating timeless memories.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Priya Sharma",
    location: "Bengaluru, Karnataka",
    rating: "4.9",
    reviews: 18,
    tags: ["Event", "Corporate", "Candid"],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Rohit Verma",
    location: "Delhi, NCR",
    rating: "4.7",
    reviews: 31,
    tags: ["Wedding", "Pre-Wedding", "Travel"],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Sneha Iyer",
    location: "Chennai, Tamil Nadu",
    rating: "4.6",
    reviews: 12,
    tags: ["Event", "Portrait", "Product"],
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Karan Malhotra",
    location: "Pune, Maharashtra",
    rating: "4.8",
    reviews: 27,
    tags: ["Wedding", "Event", "Fashion"],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Neha Kapoor",
    location: "Hyderabad, Telangana",
    rating: "4.7",
    reviews: 19,
    tags: ["Event", "Candid", "Corporate"],
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85",
  },
];

const partners = [
  ["✿", "Dream Events", "Turning Moments into Memories"],
  ["ℂ", "Celebrations Co.", "Events & Beyond"],
  ["✾", "Elite Weddings", "Your Dream, Our Plan"],
  ["$", "Corporate Connect", "Events | Branding | Experiences"],
  ["#", "Corpo Connect", "Eventyrujts | Brandidyjng | Experidgjences"],
];

const calendarDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2025, 4, 1));
  const [selectedDate, setSelectedDate] = useState(12);
  const [profileDragging, setProfileDragging] = useState(false);
  const swipeStartX = useRef(null);
  const profileSwipeStartY = useRef(null);
  const heroImages = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=85",
  ];

  function handleHeroPointerDown(event) {
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
  }

  function handleProfileBackdropClick(event) {
    if (event.target === event.currentTarget) {
      setSelectedPhotographer(null);
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    if (selectedPhotographer) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedPhotographer(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedPhotographer]);

  return (
    <main id="home" className={styles.page}>
      <Navbar />
      <section
        className={styles.hero}
        onPointerDown={handleHeroPointerDown}
        onPointerUp={handleHeroPointerUp}
        onPointerCancel={handleHeroPointerCancel}
      >
        <div
          key={slide}
          className={styles.heroImage}
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(4, 20, 28, .68), rgba(4, 20, 28, .06)), url(${heroImages[slide]})`,
          }}
        />
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={() =>
            setSlide((slide + heroImages.length - 1) % heroImages.length)
          }
        >
          ‹
        </button>
        <div className={styles.heroWords}>
          <h1>
            Find the Perfect
            <br />
            Photographer for Your Event
          </h1>
          <p>Talented. Trusted. Available.</p>
        </div>
        <p className={styles.script}>
          Moments
          <br />
          That Last Forever
        </p>
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={() => setSlide((slide + 1) % heroImages.length)}
        >
          ›
        </button>
        <div className={styles.dots}>
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={slide === index ? styles.selected : ""}
              onClick={() => setSlide(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
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
          <span>
            <span className={styles.scrollHintText}>Scroll to discover more</span>
            <b>⌄</b>
          </span>
        </div>
        <div className={styles.grid}>
          {photographers.map((person) => (
            <PhotographerCard
              key={person.name}
              person={person}
              onSelect={setSelectedPhotographer}
            />
          ))}
        </div>
        <div className={styles.loading}>
          <i />
          <span>Loading more photographers...</span>
        </div>
      </section>
      <section className={styles.partners}>
        <h2>Our Partner Companies</h2>
        <p>Proud to work with amazing organizations</p>
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
                {partners.map(([icon, name, description]) => (
                  <article key={`${name}-${isDuplicate ? "duplicate" : "original"}`}>
                    <strong>{icon}</strong>
                    <h3>{name}</h3>
                    <small>{description}</small>
                    <div>
                      <span>in</span>
                      <span>◎</span>
                      <span>♥</span>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
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
                <img
                  src={selectedPhotographer.image}
                  alt={selectedPhotographer.name}
                />
              </div>
              <div className={styles.profileThumbs}>
                {heroImages.slice(0, 3).map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${selectedPhotographer.name} portfolio ${index + 1}`}
                  />
                ))}
              </div>
              <div className={styles.profileFacts}>
                <p>
                  <b>Location</b>
                  {selectedPhotographer.location}
                </p>
                <p>
                  <b>Profession</b>Event Photographer
                </p>
                <p>
                  <b>Experience</b>
                  {selectedPhotographer.experience || "5+ years"}
                </p>
                <p>
                  <b>Languages</b>
                  {selectedPhotographer.languages || "English, Hindi"}
                </p>
                <a href="#portfolio">View Full Portfolio ↗</a>
              </div>
            </div>
            <div className={styles.profileDetails}>
              <div className={styles.profileHeading}>
                <div>
                  <h2 id="profile-title">{selectedPhotographer.name}</h2>
                  <p>Professional Photographer</p>
                </div>
                <span className={styles.approved}>✓ Approved</span>
                <button
                  className={styles.profileHeart}
                  aria-label="Save profile"
                >
                  ♡
                </button>
              </div>
              <p className={styles.profileLocation}>
                ● {selectedPhotographer.location}
              </p>
              <div className={styles.profileStats}>
                <span>
                  ★ <b>{selectedPhotographer.rating}</b> (
                  {selectedPhotographer.reviews} reviews)
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
                  {selectedPhotographer.bio ||
                    "I love capturing real emotions and creating timeless memories for every client."}
                </p>
                <small>ID: {selectedPhotographer.id || "PH00124"}</small>
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
                    const isBooked =
                      cell.currentMonth && [7, 16].includes(cell.day);
                    const isSelected =
                      cell.currentMonth && cell.day === selectedDate;
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
                          cell.currentMonth && setSelectedDate(cell.day)
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
