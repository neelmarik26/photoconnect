"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

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
];

const year = new Date().getFullYear();
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

function Logo() {
  return (
    <a href="#home" className={styles.logo}>
      <Image
        src="/photoconnect-logo.svg"
        alt="PhotoConnect logo"
        width="31"
        height="24"
      />
      <span>
        <b>PhotoConnect</b>
        <small>Capture People. Create Moments.</small>
      </span>
    </a>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2025, 4, 1));
  const [selectedDate, setSelectedDate] = useState(12);
  const heroImages = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=85",
  ];

  useEffect(() => {
    document.body.style.overflow = selectedPhotographer ? "hidden" : "";

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedPhotographer(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedPhotographer]);

  return (
    <main id="home" className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <nav>
          <a className={styles.current} href="#home">
            Home
          </a>
          <a href="#photographers">About</a>
          <a href="/contact">Contact Us</a>
        </nav>
        <div className={styles.actions}>
          <Link href="/signin">Sign In</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
      </header>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(4, 20, 28, .68), rgba(4, 20, 28, .06)), url(${heroImages[slide]})`,
        }}
      >
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
            Scroll to discover more&nbsp; <b>⌄</b>
          </span>
        </div>
        <div className={styles.grid}>
          {photographers.map((person) => (
            <article
              className={styles.card}
              key={person.name}
              onClick={() => setSelectedPhotographer(person)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedPhotographer(person);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.photo}>
                <img src={person.image} alt={person.name} />
                <button
                  type="button"
                  aria-label={`Save ${person.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    event.currentTarget.classList.toggle(styles.saved);
                  }}
                >
                  ♡
                </button>
              </div>
              <div className={styles.cardInfo}>
                <h3>{person.name}</h3>
                <p className={styles.location}>● &nbsp;{person.location}</p>
                <div className={styles.tags}>
                  {person.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <p className={styles.rating}>
                  ★ <b>{person.rating}</b>{" "}
                  <small>({person.reviews} reviews)</small>
                </p>
              </div>
            </article>
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
        <div className={styles.partnerGrid}>
          {partners.map(([icon, name, description]) => (
            <article key={name}>
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
      </section>
      <footer id="footer" className={styles.footer}>
        <div>
          <Logo />
          <p>Connecting great photographers with amazing opportunities.</p>
          <div className={styles.social}>
            <a href="https://facebook.com" aria-label="Facebook">
              <Image src="/facebook.svg" alt="" width={17} height={17} />
            </a>
            <a href="https://instagram.com" aria-label="Instagram">
              <Image src="/instagram.svg" alt="" width={17} height={17} />
            </a>
            <a href="https://youtube.com" aria-label="YouTube">
              <Image src="/youtube.svg" alt="" width={17} height={17} />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <Image src="/linkedin.svg" alt="" width={17} height={17} />
            </a>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <a href="#home">Home</a>
          <a href="#photographers">About Us</a>
          <a href="/contact">Contact Us</a>
          <a href="#footer">Privacy Policy</a>
          <a href="#footer">Terms & Conditions</a>
        </div>
        <div>
          <h4>For Photographers</h4>
          <a href="#home">Sign Up</a>
          <a href="#home">Sign In</a>
          <a href="#photographers">Update Profile</a>
        </div>
        <div>
          <h4>Contact</h4>
          <p>✉ &nbsp; support@photoconnect.com</p>
          <p>☎ &nbsp; +91 98765 43210</p>
          <p>● &nbsp; Bengaluru, India</p>
        </div>
        <small className={styles.copyright}>
          © {year} PhotoConnect. All rights reserved.
        </small>
      </footer>
      {selectedPhotographer && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedPhotographer(null)}
          role="presentation"
        >
          <section
            className={styles.profileModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setSelectedPhotographer(null)}
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
