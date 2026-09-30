"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const savedUserKey = "photoConnectUser";

const editableSections = [
  {
    title: "Identity and contact",
    fields: [
      ["name", "Full name", "text"],
      ["email", "Email address", "email"],
      ["phone", "Phone", "tel"],
    ],
  },
  {
    title: "Location",
    fields: [
      ["country", "Country", "text"],
      ["state", "State", "text"],
      ["city", "City", "text"],
      ["address1", "Address 1", "text"],
      ["address2", "Address 2", "text"],
      ["pincode", "Postal code", "number"],
    ],
  },
  {
    title: "Photographer profile",
    fields: [
      ["proffession", "Profession", "text"],
      ["specialties", "Specialties (comma-separated)", "text"],
      ["experienceYears", "Experience (years)", "number"],
      ["dob", "Date of birth", "date"],
      ["portfolioUrl", "Portfolio", "url"],
      ["bio", "Bio", "textarea"],
      ["about", "About", "textarea"],
    ],
  },
];

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
      ["dob", "Date of birth"],
      ["bio", "Bio"],
      ["about", "About"],
      ["portfolioUrl", "Portfolio"],
      ["rating", "Rating"],
      ["totalReviews", "Total reviews"],
    ],
  },
];

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }
  if (field === "dob") {
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
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

function getEditValue(profile, field) {
  if (field === "specialties") {
    return Array.isArray(profile.specialties)
      ? profile.specialties.join(", ")
      : profile.specialties ?? "";
  }
  if (field === "dob") return profile.dob ? String(profile.dob).slice(0, 10) : "";
  return profile[field] ?? "";
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Select date"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function getGalleryImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageIsError, setSaveMessageIsError] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const imageInputRef = useRef(null);
  const imagePreviewUrlRef = useRef("");
  const [dobValue, setDobValue] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const [availabilityMonth, setAvailabilityMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState([]);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilityMessageIsError, setAvailabilityMessageIsError] =
    useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [sampleFiles, setSampleFiles] = useState([null, null, null]);
  const [samplePreviewUrls, setSamplePreviewUrls] = useState(["", "", ""]);
  const samplePreviewUrlsRef = useRef(["", "", ""]);
  const sampleFileInputRefs = useRef([]);
  const [galleryLoadFailed, setGalleryLoadFailed] = useState(false);
  const [isSavingSamples, setIsSavingSamples] = useState(false);
  const [sampleMessage, setSampleMessage] = useState("");
  const [sampleMessageIsError, setSampleMessageIsError] = useState(false);

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

  const photographerId = profile?._id;
  const isPhotographer = profile?.type === "PHOTOGRAPHER";

  useEffect(() => {
    if (!photographerId || !isPhotographer) return;
    let isCurrent = true;
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photo-galleries/user/${encodeURIComponent(photographerId)}?limit=50&sortBy=sequence&sortOrder=asc`,
    )
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load sample photos.");
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
      .catch((error) => {
        if (isCurrent) {
          setGalleryLoadFailed(true);
          setSampleMessage(error.message || "Could not load sample photos.");
          setSampleMessageIsError(true);
        }
      })
      .finally(() => {
        if (isCurrent) setGalleryLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [photographerId, isPhotographer]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    function closeCalendar(event) {
      if (!calendarRef.current?.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setIsCalendarOpen(false);
    }

    document.addEventListener("pointerdown", closeCalendar);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeCalendar);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCalendarOpen]);

  useEffect(
    () => () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
      samplePreviewUrlsRef.current.forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    },
    [],
  );

  const fallbackImage = `${basePath}/defolt_profile_pic.jpg`;
  const todayValue = toDateValue(new Date());
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarDays = [
    ...Array(calendarMonth.getDay()).fill(null),
    ...Array.from(
      { length: new Date(calendarYear, calendarMonthIndex + 1, 0).getDate() },
      (_, index) => index + 1,
    ),
  ];
  const currentDate = new Date();
  const currentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const yearOptions = Array.from(
    { length: currentDate.getFullYear() - 1900 + 1 },
    (_, index) => currentDate.getFullYear() - index,
  );
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(undefined, { month: "long" }).format(
      new Date(2020, month, 1),
    ),
  );
  const availabilityYear = availabilityMonth.getFullYear();
  const availabilityMonthIndex = availabilityMonth.getMonth();
  const availabilityDays = [
    ...Array(availabilityMonth.getDay()).fill(null),
    ...Array.from(
      {
        length: new Date(
          availabilityYear,
          availabilityMonthIndex + 1,
          0,
        ).getDate(),
      },
      (_, index) => index + 1,
    ),
  ];
  const occupiedDateKeys = (profile?.occupiedDates ?? []).map((date) =>
    String(date).slice(0, 10),
  );
  const activeOccupiedDates = new Set(
    isEditingAvailability ? availabilityDraft : occupiedDateKeys,
  );

  function updateSelectedImage(file) {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }
    const previewUrl = file ? URL.createObjectURL(file) : "";
    imagePreviewUrlRef.current = previewUrl;
    setSelectedImageFile(file);
    setSelectedImagePreview(previewUrl);
  }

  function updateSampleFile(index, file) {
    const nextPreviewUrls = [...samplePreviewUrlsRef.current];
    const previousUrl = nextPreviewUrls[index];
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    nextPreviewUrls[index] = file ? URL.createObjectURL(file) : "";
    samplePreviewUrlsRef.current = nextPreviewUrls;
    setSamplePreviewUrls(nextPreviewUrls);
    setSampleFiles((files) =>
      files.map((currentFile, fileIndex) =>
        fileIndex === index ? file : currentFile,
      ),
    );
  }

  function clearSampleFiles() {
    samplePreviewUrlsRef.current.forEach((previewUrl) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    });
    samplePreviewUrlsRef.current = ["", "", ""];
    sampleFileInputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
    setSamplePreviewUrls(["", "", ""]);
    setSampleFiles([null, null, null]);
  }

  async function submitProfile(event) {
    event.preventDefault();
    setSaveMessage("");
    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("file");
    if (imageFile?.size && !imageFile.type.startsWith("image/")) {
      setSaveMessage("Choose an image file.");
      setSaveMessageIsError(true);
      return;
    }
    if (imageFile?.size > 5 * 1024 * 1024) {
      setSaveMessage("Image must be 5 MB or smaller.");
      setSaveMessageIsError(true);
      return;
    }

    const value = (field) => String(formData.get(field) ?? "").trim();
    const pincode = value("pincode");
    const experienceYears = value("experienceYears");
    const nextValues = {
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      country: value("country"),
      state: value("state"),
      city: value("city"),
      address1: value("address1"),
      address2: value("address2"),
      pincode: pincode ? Number(pincode) : null,
      proffession: value("proffession"),
      specialties: value("specialties")
        .split(",")
        .map((specialty) => specialty.trim())
        .filter(Boolean),
      experienceYears: experienceYears ? Number(experienceYears) : null,
      dob: value("dob") || null,
      portfolioUrl: value("portfolioUrl"),
      bio: value("bio"),
      about: value("about"),
    };
    const payload = Object.fromEntries(
      Object.entries(nextValues).filter(([field, nextValue]) => {
        const currentValue = profile[field];
        if (field === "specialties") {
          const currentSpecialties = Array.isArray(currentValue)
            ? currentValue
            : currentValue
              ? [currentValue]
              : [];
          return JSON.stringify(nextValue) !== JSON.stringify(currentSpecialties);
        }
        if (field === "dob") {
          const currentDate = currentValue
            ? String(currentValue).slice(0, 10)
            : null;
          return nextValue !== currentDate;
        }
        if (field === "pincode" || field === "experienceYears") {
          const currentNumber = currentValue === null || currentValue === undefined
            ? null
            : Number(currentValue);
          return nextValue !== currentNumber;
        }
        return String(nextValue ?? "") !== String(currentValue ?? "");
      }),
    );

    if (Object.keys(payload).length === 0 && !imageFile?.size) {
      setSaveMessage("There are no changes to save.");
      setSaveMessageIsError(false);
      return;
    }

    setIsSaving(true);
    let detailsSaved = false;
    try {
      const userId = encodeURIComponent(profile._id);
      const updateProfile = async (url, options) => {
        const response = await fetch(url, options);
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not save profile changes.");
        }
        return result?.data ?? result;
      };
      let updatedUser = profile;
      if (Object.keys(payload).length > 0) {
        updatedUser = await updateProfile(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        detailsSaved = true;
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
      }

      if (imageFile?.size) {
        const imageData = new FormData();
        imageData.append("file", imageFile);
        const updatedWithImage = await updateProfile(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-picture`,
          { method: "PATCH", body: imageData },
        );
        updatedUser = updatedWithImage;
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
      }

      setIsEditing(false);
      updateSelectedImage(null);
      setIsCalendarOpen(false);
      setSaveMessage("Profile updated successfully.");
      setSaveMessageIsError(false);
    } catch (error) {
      setSaveMessage(
        detailsSaved
          ? `Your details were saved, but the profile image could not be updated: ${error.message}`
          : error.message || "Could not save your profile. Please try again.",
      );
      setSaveMessageIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSamplePhotos() {
    setSampleMessage("");
    if (galleryLoadFailed) {
      setSampleMessage("Could not load your saved sample photos. Reload this page before editing them.");
      setSampleMessageIsError(true);
      return;
    }
    if (
      sampleFiles.some(
        (file) => file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024),
      )
    ) {
      setSampleMessage("Choose image files no larger than 5 MB each.");
      setSampleMessageIsError(true);
      return;
    }
    if (sampleFiles.every((file, index) => !file && !galleryPhotos[index])) {
      setSampleMessage("Upload a photo for each of the three sample slots.");
      setSampleMessageIsError(true);
      return;
    }
    if (sampleFiles.every((file) => !file)) {
      setSampleMessage("Choose at least one sample photo to update.");
      setSampleMessageIsError(false);
      return;
    }
    if (sampleFiles.some((file, index) => !file && !galleryPhotos[index])) {
      setSampleMessage("Add a photo to each of the three sample slots before saving.");
      setSampleMessageIsError(true);
      return;
    }

    setIsSavingSamples(true);
    const updatedPhotos = [...galleryPhotos];
    let uploadedCount = 0;
    try {
      for (let index = 0; index < sampleFiles.length; index += 1) {
        const file = sampleFiles[index];
        if (!file) continue;

        const body = new FormData();
        body.append("file", file);
        body.append("userId", String(profile._id));
        body.append("sequence", String(index + 1));
        body.append("description", `Sample photo ${index + 1}`);
        const existingPhoto = updatedPhotos[index];
        const endpoint = existingPhoto
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photo-galleries/${encodeURIComponent(existingPhoto._id)}`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photo-galleries`;
        const response = await fetch(endpoint, {
          method: existingPhoto ? "PATCH" : "POST",
          body,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            result?.message || `Could not save sample photo ${index + 1}.`,
          );
        }
        updatedPhotos[index] = result?.data ?? result;
        uploadedCount += 1;
        setGalleryPhotos([...updatedPhotos]);
      }

      clearSampleFiles();
      setSampleMessage("All three sample photos are saved to your profile.");
      setSampleMessageIsError(false);
    } catch (error) {
      setSampleMessage(
        uploadedCount
          ? `${uploadedCount} photo${uploadedCount === 1 ? " was" : "s were"} saved. ${error.message} Select the remaining photos and save again.`
          : error.message || "Could not save sample photos. Please try again.",
      );
      setSampleMessageIsError(true);
    } finally {
      setIsSavingSamples(false);
    }
  }

  function startAvailabilityEdit() {
    setAvailabilityDraft([...new Set(occupiedDateKeys)].sort());
    setAvailabilityMessage("");
    setIsEditingAvailability(true);
  }

  function cancelAvailabilityEdit() {
    setAvailabilityDraft([]);
    setAvailabilityMessage("");
    setIsEditingAvailability(false);
  }

  async function saveAvailability() {
    setIsSavingAvailability(true);
    setAvailabilityMessage("");
    try {
      const occupiedDates = [...new Set(availabilityDraft)]
        .sort()
        .map((date) => `${date}T00:00:00.000Z`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${encodeURIComponent(profile._id)}/occupied-dates`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ occupiedDates }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "Could not save availability.");
      }

      const updatedUser = result?.data ?? result;
      const savedDates = (updatedUser.occupiedDates ?? occupiedDates).map(
        (date) => String(date).slice(0, 10),
      );
      setProfile((currentProfile) => ({
        ...currentProfile,
        ...updatedUser,
        occupiedDates: savedDates,
      }));
      setAvailabilityDraft([]);
      setIsEditingAvailability(false);
      setAvailabilityMessage("Availability updated.");
      setAvailabilityMessageIsError(false);
    } catch (error) {
      setAvailabilityMessage(
        error.message || "Could not save availability. Please try again.",
      );
      setAvailabilityMessageIsError(true);
    } finally {
      setIsSavingAvailability(false);
    }
  }

  function syncSavedUser(user) {
    try {
      const savedProfile = JSON.parse(
        window.localStorage.getItem(savedUserKey) || "{}",
      );
      window.localStorage.setItem(
        savedUserKey,
        JSON.stringify({
          ...savedProfile,
          userId: String(user._id),
          name: user.name,
          profileImageUrl: user.profileImageUrl,
        }),
      );
      window.dispatchEvent(new Event("storage"));
    } catch {
      return;
    }
  }

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
              <button
                className={styles.editButton}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (!isEditing) {
                    const currentDob = profile.dob
                      ? String(profile.dob).slice(0, 10)
                      : "";
                    const selectedDob = currentDob
                      ? new Date(`${currentDob}T00:00:00`)
                      : new Date();
                    const isValidDob = !Number.isNaN(selectedDob.getTime());
                    setDobValue(isValidDob ? currentDob : "");
                    const calendarDate = isValidDob ? selectedDob : new Date();
                    setCalendarMonth(
                      new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth(),
                        1,
                      ),
                    );
                    setIsCalendarOpen(false);
                  }
                  setIsEditing((editing) => !editing);
                  setSaveMessage("");
                  updateSelectedImage(null);
                  if (imageInputRef.current) imageInputRef.current.value = "";
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
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

          {profile && isEditing && (
            <form className={styles.editForm} onSubmit={submitProfile}>
              {editableSections.map((section) => (
                <section className={styles.editSection} key={section.title}>
                  <h2>{section.title}</h2>
                  <div className={styles.editGrid}>
                    {section.fields.map(([field, label, type]) => (
                        <div
                        className={`${styles.editField} ${type === "textarea" ? styles.editFieldWide : ""}`}
                        key={field}
                      >
                          <label className={styles.editLabel} htmlFor={field === "dob" ? "dob-picker" : field}>
                            {label}
                          </label>
                        {type === "textarea" ? (
                          <textarea
                              id={field}
                            name={field}
                            rows={4}
                            defaultValue={getEditValue(profile, field)}
                          />
                          ) : field === "dob" ? (
                            <div className={styles.datePicker} ref={calendarRef}>
                              <input type="hidden" name="dob" value={dobValue} />
                              <button
                                className={styles.datePickerTrigger}
                                id="dob-picker"
                                type="button"
                                aria-haspopup="dialog"
                                aria-expanded={isCalendarOpen}
                                aria-controls="dob-calendar"
                                onClick={() => setIsCalendarOpen((open) => !open)}
                              >
                                <span>{displayDate(dobValue)}</span>
                                <span aria-hidden="true">▦</span>
                              </button>
                              {isCalendarOpen && (
                                <div
                                  className={styles.calendarPopup}
                                  id="dob-calendar"
                                  role="dialog"
                                  aria-label="Date of birth calendar"
                                >
                                  <div className={styles.calendarHeader}>
                                    <button
                                      className={styles.calendarArrow}
                                      type="button"
                                      aria-label="Previous month"
                                      disabled={
                                        calendarYear === 1900 && calendarMonthIndex === 0
                                      }
                                      onClick={() =>
                                        setCalendarMonth(
                                          new Date(calendarYear, calendarMonthIndex - 1, 1),
                                        )
                                      }
                                    >
                                      ‹
                                    </button>
                                    <select
                                      aria-label="Month"
                                      value={calendarMonthIndex}
                                      onChange={(event) =>
                                        setCalendarMonth(
                                          new Date(
                                            calendarYear,
                                            Number(event.target.value),
                                            1,
                                          ),
                                        )
                                      }
                                    >
                                      {monthNames.map((monthName, monthIndex) => (
                                        <option
                                          value={monthIndex}
                                          key={monthName}
                                          disabled={
                                            calendarYear === currentMonth.getFullYear() &&
                                            monthIndex > currentMonth.getMonth()
                                          }
                                        >
                                          {monthName}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      aria-label="Year"
                                      value={calendarYear}
                                      onChange={(event) => {
                                        const selectedYear = Number(event.target.value);
                                        const selectedMonth =
                                          selectedYear === currentMonth.getFullYear()
                                            ? Math.min(
                                                calendarMonthIndex,
                                                currentMonth.getMonth(),
                                              )
                                            : calendarMonthIndex;
                                        setCalendarMonth(
                                          new Date(selectedYear, selectedMonth, 1),
                                        );
                                      }}
                                    >
                                      {yearOptions.map((year) => (
                                        <option value={year} key={year}>
                                          {year}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      className={styles.calendarArrow}
                                      type="button"
                                      aria-label="Next month"
                                      disabled={
                                        calendarYear > currentMonth.getFullYear() ||
                                        (calendarYear === currentMonth.getFullYear() &&
                                          calendarMonthIndex >= currentMonth.getMonth())
                                      }
                                      onClick={() =>
                                        setCalendarMonth(
                                          new Date(calendarYear, calendarMonthIndex + 1, 1),
                                        )
                                      }
                                    >
                                      ›
                                    </button>
                                  </div>
                                  <div className={styles.calendarGrid}>
                                    {[
                                      "Sun",
                                      "Mon",
                                      "Tue",
                                      "Wed",
                                      "Thu",
                                      "Fri",
                                      "Sat",
                                    ].map((weekday) => (
                                      <span
                                        className={styles.calendarWeekday}
                                        key={weekday}
                                      >
                                        {weekday}
                                      </span>
                                    ))}
                                    {calendarDays.map((day, index) => {
                                      if (day === null) {
                                        return <span key={`empty-${index}`} />;
                                      }
                                      const dayValue = toDateValue(
                                        new Date(calendarYear, calendarMonthIndex, day),
                                      );
                                      const isSelected = dayValue === dobValue;
                                      return (
                                        <button
                                          className={`${styles.calendarDay} ${isSelected ? styles.calendarDaySelected : ""}`}
                                          key={dayValue}
                                          type="button"
                                          aria-label={displayDate(dayValue)}
                                          aria-pressed={isSelected}
                                          disabled={dayValue > todayValue}
                                          onClick={() => {
                                            setDobValue(dayValue);
                                            setIsCalendarOpen(false);
                                          }}
                                        >
                                          {day}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <button
                                    className={styles.calendarClear}
                                    type="button"
                                    onClick={() => {
                                      setDobValue("");
                                      setIsCalendarOpen(false);
                                    }}
                                  >
                                    Clear date
                                  </button>
                                </div>
                              )}
                            </div>
                        ) : (
                          <input
                              id={field}
                            name={field}
                            type={type}
                            defaultValue={getEditValue(profile, field)}
                            required={field === "name" || field === "email"}
                            min={field === "experienceYears" ? "0" : undefined}
                            minLength={field === "name" ? "2" : undefined}
                            maxLength={field === "name" ? "100" : undefined}
                            step={field === "experienceYears" || field === "pincode" ? "1" : undefined}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <section className={styles.editSection}>
                <h2>Profile image</h2>
                <div className={styles.imageUpload}>
                  <div className={styles.imagePreviewFrame}>
                    <Image
                      className={styles.imagePreview}
                      src={
                        selectedImagePreview ||
                        (profile.profileImageUrl
                          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${profile.profileImageUrl}`
                          : `${basePath}/defolt_profile_pic.jpg`)
                      }
                      alt="Profile image preview"
                      width={104}
                      height={104}
                      unoptimized
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = `${basePath}/defolt_profile_pic.jpg`;
                      }}
                    />
                  </div>
                  <div className={styles.imageUploadContent}>
                    <strong>
                      {selectedImageFile ? "New image selected" : "Current profile image"}
                    </strong>
                    <p>Choose a JPG, PNG, or WebP image. Maximum size: 5 MB.</p>
                    <div className={styles.imageUploadActions}>
                      <label className={styles.imageSelectButton}>
                        <input
                          ref={imageInputRef}
                          className={styles.imageFileInput}
                          name="file"
                          type="file"
                          accept="image/*"
                          aria-label="Choose a new profile image"
                          onChange={(event) => {
                            updateSelectedImage(
                              event.currentTarget.files?.[0] ?? null,
                            );
                            setSaveMessage("");
                          }}
                        />
                        <span>
                          {selectedImageFile ? "Choose another" : "Choose photo"}
                        </span>
                      </label>
                      {selectedImageFile && (
                        <button
                          className={styles.imageRemoveButton}
                          type="button"
                          onClick={() => {
                            updateSelectedImage(null);
                            if (imageInputRef.current) {
                              imageInputRef.current.value = "";
                            }
                          }}
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                    {selectedImageFile && (
                      <small className={styles.imageFileName}>
                        {selectedImageFile.name}
                      </small>
                    )}
                  </div>
                </div>
              </section>

              {isPhotographer && (
                <section className={styles.editSection}>
                  <h2>Portfolio sample photos</h2>
                  <p className={styles.sampleIntro}>
                    Add three photos to show clients examples of your work. Each
                    photo is saved to your profile gallery.
                  </p>
                  <div className={styles.samplePhotoGrid}>
                    {sampleFiles.map((file, index) => {
                      const savedPhoto = galleryPhotos[index];
                      const previewUrl = samplePreviewUrls[index];
                      const imageUrl = previewUrl || getGalleryImageUrl(savedPhoto?.link);
                      return (
                        <article className={styles.samplePhotoSlot} key={index}>
                          <div className={styles.samplePhotoPreview}>
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={`Portfolio sample ${index + 1}`}
                                width={320}
                                height={220}
                                unoptimized
                              />
                            ) : (
                              <span>Sample {index + 1}</span>
                            )}
                          </div>
                          <div className={styles.samplePhotoMeta}>
                            <strong>Sample {index + 1}</strong>
                            <label className={styles.samplePhotoChoose}>
                              <input
                                ref={(element) => {
                                  sampleFileInputRefs.current[index] = element;
                                }}
                                type="file"
                                accept="image/*"
                                aria-label={`Choose sample photo ${index + 1}`}
                                disabled={galleryLoading || isSavingSamples}
                                onChange={(event) =>
                                  updateSampleFile(
                                    index,
                                    event.currentTarget.files?.[0] ?? null,
                                  )
                                }
                              />
                              {file ? "Replace selection" : savedPhoto ? "Replace photo" : "Choose photo"}
                            </label>
                            {file && (
                              <div className={styles.samplePhotoSelection}>
                                <small className={styles.samplePhotoFilename}>
                                  {file.name}
                                </small>
                                <button
                                  className={styles.samplePhotoClear}
                                  type="button"
                                  disabled={isSavingSamples}
                                  onClick={() => {
                                    updateSampleFile(index, null);
                                    const input = sampleFileInputRefs.current[index];
                                    if (input) input.value = "";
                                  }}
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {galleryLoading && (
                    <p className={styles.samplePhotoMessage} role="status">
                      Loading saved sample photos...
                    </p>
                  )}
                  {sampleMessage && (
                    <p
                      className={
                        sampleMessageIsError
                          ? styles.editError
                          : styles.editNotice
                      }
                      role={sampleMessageIsError ? "alert" : "status"}
                    >
                      {sampleMessage}
                    </p>
                  )}
                  <div className={styles.samplePhotoActions}>
                    <button
                      className={styles.saveButton}
                      type="button"
                      disabled={galleryLoading || isSavingSamples}
                      onClick={saveSamplePhotos}
                    >
                      {isSavingSamples ? "Saving photos..." : "Save sample photos"}
                    </button>
                  </div>
                </section>
              )}

              {saveMessage && (
                <p
                  className={saveMessageIsError ? styles.editError : styles.editNotice}
                  role={saveMessageIsError ? "alert" : "status"}
                >
                  {saveMessage}
                </p>
              )}
              <div className={styles.editActions}>
                <button
                  className={styles.saveButton}
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {profile && !isEditing && (
            <>
              {saveMessage && <p className={styles.editNotice} role="status">{saveMessage}</p>}
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

              <div className={styles.profileDetailsLayout}>
              <section className={styles.availabilitySection}>
                <header className={styles.availabilityHeader}>
                  <div>
                    <h2>Booking availability</h2>
                    <p>Choose the dates you are unavailable for bookings.</p>
                  </div>
                  {isEditingAvailability ? (
                    <div className={styles.availabilityActions}>
                      <button
                        className={styles.availabilitySecondaryButton}
                        type="button"
                        disabled={isSavingAvailability}
                        onClick={cancelAvailabilityEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.availabilitySaveButton}
                        type="button"
                        disabled={isSavingAvailability}
                        onClick={saveAvailability}
                      >
                        {isSavingAvailability ? "Saving..." : "Save dates"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.availabilitySaveButton}
                      type="button"
                      onClick={startAvailabilityEdit}
                    >
                      Edit availability
                    </button>
                  )}
                </header>

                <div className={styles.availabilityLegend} aria-label="Date status">
                  <span>
                    <i className={styles.availableSwatch} aria-hidden="true" />
                    Available
                  </span>
                  <span>
                    <i className={styles.occupiedSwatch} aria-hidden="true" />
                    Occupied
                  </span>
                  {isEditingAvailability && (
                    <span className={styles.editingHint}>Select dates to toggle</span>
                  )}
                </div>

                <div className={styles.availabilityCalendar}>
                  <div className={styles.availabilityMonthHeader}>
                    <button
                      className={styles.calendarArrow}
                      type="button"
                      aria-label="Previous month"
                      onClick={() =>
                        setAvailabilityMonth(
                          new Date(
                            availabilityYear,
                            availabilityMonthIndex - 1,
                            1,
                          ),
                        )
                      }
                    >
                      ‹
                    </button>
                    <h3>
                      {availabilityMonth.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <button
                      className={styles.calendarArrow}
                      type="button"
                      aria-label="Next month"
                      onClick={() =>
                        setAvailabilityMonth(
                          new Date(
                            availabilityYear,
                            availabilityMonthIndex + 1,
                            1,
                          ),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>

                  <div className={styles.availabilityGrid}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (weekday) => (
                        <span
                          className={styles.availabilityWeekday}
                          key={weekday}
                        >
                          {weekday}
                        </span>
                      ),
                    )}
                    {availabilityDays.map((day, index) => {
                      if (day === null) {
                        return <span key={`empty-${index}`} />;
                      }
                      const dateKey = toDateValue(
                        new Date(availabilityYear, availabilityMonthIndex, day),
                      );
                      const isOccupied = activeOccupiedDates.has(dateKey);
                      const isPast = dateKey < todayValue;
                      return (
                        <button
                          className={`${styles.availabilityDay} ${isPast ? styles.pastDay : isOccupied ? styles.occupiedDay : styles.availableDay}`}
                          key={dateKey}
                          type="button"
                          aria-label={`${displayDate(dateKey)}: ${isOccupied ? "occupied" : "available"}`}
                          aria-pressed={isOccupied}
                          disabled={!isEditingAvailability || isSavingAvailability || isPast}
                          onClick={() =>
                            setAvailabilityDraft((dates) =>
                              isOccupied
                                ? dates.filter((date) => date !== dateKey)
                                : [...dates, dateKey],
                            )
                          }
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {availabilityMessage && (
                  <p
                    className={
                      availabilityMessageIsError
                        ? styles.editError
                        : styles.editNotice
                    }
                    role={availabilityMessageIsError ? "alert" : "status"}
                  >
                    {availabilityMessage}
                  </p>
                )}
              </section>

              <section className={styles.accountDetails}>
                <div className={styles.sectionHeading}>
                  <h2>Account details</h2>
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
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}