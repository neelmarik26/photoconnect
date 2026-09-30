"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const savedUserKey = "photoConnectUser";

const profileSections = [
  {
    title: "Contact",
    fields: [
      ["email", "Email address"],
      ["phone", "Phone"],
    ],
  },
  {
    title: "Location",
    fields: [
      ["country", "Country"],
      ["state", "State"],
      ["city", "City"],
      ["address1", "Address 1"],
      ["address2", "Address 2"],
      ["pincode", "Postal code"],
      ["location", "Coordinates"],
    ],
  },
  {
    title: "Photographer profile",
    fields: [
      ["type", "Account type"],
      ["status", "Status"],
      ["proffession", "Profession"],
      ["specialties", "Specialties"],
      ["experienceYears", "Experience"],
      ["bio", "Bio"],
      ["about", "About"],
      ["portfolioUrl", "Portfolio"],
      ["rating", "Rating"],
      ["totalReviews", "Total reviews"],
      ["dob", "Date of birth"],
    ],
  },
];

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (field === "location") {
    const coordinates = value.coordinates;
    return coordinates?.length === 2
      ? `Latitude ${coordinates[1]}, longitude ${coordinates[0]}`
      : "Not provided";
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }
  if (field === "dob") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  if (field === "experienceYears") {
    return `${value} years`;
  }
  if (field === "portfolioUrl") {
    return String(value);
  }
  return String(value);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(savedUserKey);
    if (!rawProfile) {
      router.replace("/");
      return;
    }

    try {
      const profile = JSON.parse(rawProfile);
      if (!profile.userId || profile.expiresAt <= Date.now()) {
        window.localStorage.removeItem(savedUserKey);
        router.replace("/");
        return;
      }

      let isCurrent = true;
      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${encodeURIComponent(profile.userId)}`,
      )
        .then(async (response) => {
          const result = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(result?.message || "Could not load your profile.");
          }
          return result;
        })
        .then((user) => {
          if (isCurrent) setProfile(user);
        })
        .catch((error) => {
          if (isCurrent) {
            setErrorMessage(error.message || "Could not load your profile.");
          }
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    } catch {
      window.localStorage.removeItem(savedUserKey);
      router.replace("/");
    }
  }, [router]);

  const fallbackImage = `${basePath}/defolt_profile_pic.jpg`;

  return (
    <main className={styles.page}>
      <Navbar current="home" />
      <section className={styles.content}>
        <div className={styles.profilePage}>
          <header className={styles.pageHeader}>
            <div>
              <p>ACCOUNT / PROFILE</p>
              <h1>My Profile</h1>
            </div>
            {profile && (
              <button className={styles.editButton} type="button">
                Edit Profile
              </button>
            )}
          </header>

          {isLoading && <p className={styles.stateMessage}>Loading profile...</p>}
          {!isLoading && errorMessage && (
            <div className={styles.errorState} role="alert">
              <p>{errorMessage}</p>
              <Link href="/">Return home</Link>
            </div>
          )}

          {profile && (
            <>
              <section className={styles.identity}>
                <Image
                  className={styles.avatar}
                  src={
                    profile.profileImageUrl
                      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${profile.profileImageUrl}`
                      : fallbackImage
                  }
                  alt=""
                  width={84}
                  height={84}
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackImage;
                  }}
                />
                <div className={styles.identityCopy}>
                  <h2>{profile.name || "PhotoConnect user"}</h2>
                  <p>{profile.type || "Member"}</p>
                  <span>{profile.email}</span>
                </div>
                <span className={styles.status}>{profile.status || "Account"}</span>
              </section>

              <section className={styles.accountDetails}>
                <div className={styles.sectionHeading}>
                  <h2>Account details</h2>
                  <p>User ID: {profile._id}</p>
                </div>
                {profileSections.map((section) => (
                  <section className={styles.detailSection} key={section.title}>
                    <h3>{section.title}</h3>
                    <dl className={styles.detailsGrid}>
                      {section.fields.map(([field, label]) => (
                        <div className={styles.detailItem} key={field}>
                          <dt>{label}</dt>
                          <dd>{formatValue(field, profile[field])}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}