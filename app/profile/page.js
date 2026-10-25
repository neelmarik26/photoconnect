"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactTags } from "react-tag-autocomplete";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const savedUserKey = "photoConnectUser";
const maxSamplePhotos = 5;
const maxSamplePhotoSize = 5 * 1024 * 1024;
const maxProfileVideoSize = 15 * 1024 * 1024;
const maxProfileVideos = 2;
const allowedProfileVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
  "video/x-matroska",
];

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
      ["specialties", "Specialties", "text"],
      ["experienceYears", "Experience (years)", "number"],
      ["dob", "Date of birth", "date"],
      ["age", "Age", "computed"],
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
      ["age", "Age"],
      ["bio", "Bio"],
      ["about", "About"],
      ["rating", "Rating"],
      ["totalReviews", "Total reviews"],
    ],
  },
];

function calculateAge(value) {
  if (!value) return null;

  const birthDate = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  if (
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }
  if (field === "dob") {
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  }
  if (field === "experienceYears") {
    return `${value} years`;
  }
  if (field === "age") {
    return `${value} years`;
  }
  return String(value);
}

function SpecialtyTags({ value }) {
  const specialties = (Array.isArray(value) ? value : value ? String(value).split(",") : [])
    .map((specialty) => String(specialty).trim())
    .filter(Boolean);

  if (specialties.length === 0) return "Not provided";

  return (
    <div className={styles.profileSpecialtyTags}>
      {specialties.map((specialty, index) => (
        <span
          className={styles.profileSpecialtyTag}
          key={`${specialty}-${index}`}
        >
          {specialty}
        </span>
      ))}
    </div>
  );
}

function getEditValue(profile, field) {
  if (field === "specialties") {
    return Array.isArray(profile.specialties)
      ? profile.specialties.join(", ")
      : (profile.specialties ?? "");
  }
  if (field === "dob")
    return profile.dob ? String(profile.dob).slice(0, 10) : "";
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

function getProfileVideos(profile, videoRecords = []) {
  const legacyUrls = Array.isArray(profile.profileVideoUrls)
    ? profile.profileVideoUrls
    : profile.profileVideoUrl
      ? [profile.profileVideoUrl]
      : [];
  return Array.from({ length: maxProfileVideos }, (_, slot) => {
    const record = videoRecords.find((video) => video.slot === slot);
    return record?.videoUrl || legacyUrls[slot] || "";
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [specialtyTags, setSpecialtyTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageIsError, setSaveMessageIsError] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [clearProfileImage, setClearProfileImage] = useState(false);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState(() =>
    Array(maxProfileVideos).fill(null),
  );
  const [selectedVideoPreviews, setSelectedVideoPreviews] = useState(() =>
    Array(maxProfileVideos).fill(""),
  );
  const imageInputRef = useRef(null);
  const videoInputRefs = useRef([]);
  const imagePreviewUrlRef = useRef("");
  const videoPreviewUrlsRef = useRef(Array(maxProfileVideos).fill(""));
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
  const [profileVideos, setProfileVideos] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [sampleFiles, setSampleFiles] = useState(() =>
    Array(maxSamplePhotos).fill(null),
  );
  const [deletedSamplePhotoIds, setDeletedSamplePhotoIds] = useState([]);
  const [deletedVideoSlots, setDeletedVideoSlots] = useState([]);
  const [samplePreviewUrls, setSamplePreviewUrls] = useState(() =>
    Array(maxSamplePhotos).fill(""),
  );
  const samplePreviewUrlsRef = useRef(Array(maxSamplePhotos).fill(""));
  const sampleFileInputRefs = useRef([]);
  const [galleryLoadFailed, setGalleryLoadFailed] = useState(false);

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
  const visibleEditableSections = isPhotographer
    ? editableSections
    : editableSections.filter((section) => section.title !== "Photographer profile");
  const visibleProfileSections = isPhotographer
    ? profileSections
    : profileSections.filter((section) => section.title !== "Photographer profile");

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
            .sort((first, second) => first.sequence - second.sequence),
        );
      })
      .catch((error) => {
        if (isCurrent) {
          setGalleryLoadFailed(true);
          setSaveMessage(error.message || "Could not load sample photos.");
          setSaveMessageIsError(true);
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
    if (!photographerId || !isPhotographer) return;
    let isCurrent = true;
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${encodeURIComponent(photographerId)}/profile-videos`,
    )
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not load profile videos.");
        }
        return result;
      })
      .then((result) => {
        if (isCurrent) {
          setProfileVideos(Array.isArray(result) ? result : result?.data ?? []);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setSaveMessage(error.message || "Could not load profile videos.");
          setSaveMessageIsError(true);
        }
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
      videoPreviewUrlsRef.current.forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
      samplePreviewUrlsRef.current.forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    },
    [],
  );

  const fallbackImage = `${basePath}/defolt_profile_pic.jpg`;
  const todayValue = toDateValue(new Date());
  const dobTodayValue = new Date().toISOString().slice(0, 10);
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

  function updateSelectedVideo(index, file) {
    const nextPreviewUrls = [...videoPreviewUrlsRef.current];
    if (nextPreviewUrls[index]) URL.revokeObjectURL(nextPreviewUrls[index]);
    const previewUrl = file ? URL.createObjectURL(file) : "";
    nextPreviewUrls[index] = previewUrl;
    videoPreviewUrlsRef.current = nextPreviewUrls;
    setSelectedVideoFiles((files) =>
      files.map((currentFile, fileIndex) =>
        fileIndex === index ? file : currentFile,
      ),
    );
    setSelectedVideoPreviews(nextPreviewUrls);
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
    samplePreviewUrlsRef.current = Array(maxSamplePhotos).fill("");
    sampleFileInputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
    setSamplePreviewUrls(Array(maxSamplePhotos).fill(""));
    setSampleFiles(Array(maxSamplePhotos).fill(null));
  }

  function cancelProfileEdit() {
    updateSelectedImage(null);
    setClearProfileImage(false);
    selectedVideoFiles.forEach((_, index) => updateSelectedVideo(index, null));
    setDeletedSamplePhotoIds([]);
    setDeletedVideoSlots([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
    videoInputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
    clearSampleFiles();
    setIsCalendarOpen(false);
    setSaveMessage("");
    setIsEditing(false);
  }

  async function submitProfile(event) {
    event.preventDefault();
    setSaveMessage("");
    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("file");
    const videoFiles = selectedVideoFiles;
    const videoSlotsToDelete = deletedVideoSlots;
    const shouldClearProfileImage = clearProfileImage;
    const hasSampleChanges =
      sampleFiles.some(Boolean) || deletedSamplePhotoIds.length > 0;
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
    for (const videoFile of videoFiles) {
      if (videoFile && !allowedProfileVideoTypes.includes(videoFile.type)) {
        setSaveMessage("Choose an MP4, WebM, MOV, AVI, OGG, or MKV video.");
        setSaveMessageIsError(true);
        return;
      }
      if (videoFile?.size > maxProfileVideoSize) {
        setSaveMessage("Each video must be 15 MB or smaller.");
        setSaveMessageIsError(true);
        return;
      }
    }
    if (
      sampleFiles.some(
        (file) =>
          file &&
          (!file.type.startsWith("image/") || file.size > maxSamplePhotoSize),
      )
    ) {
      setSaveMessage("Choose portfolio images no larger than 5 MB each.");
      setSaveMessageIsError(true);
      return;
    }
    if (hasSampleChanges && galleryLoadFailed) {
      setSaveMessage(
        "Could not load your saved photos. Reload this page before editing them.",
      );
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
      specialties: specialtyTags
        .map((tag) => tag.label.trim())
        .filter(Boolean),
      experienceYears: experienceYears ? Number(experienceYears) : null,
      dob: value("dob") || null,
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
          return (
            JSON.stringify(nextValue) !== JSON.stringify(currentSpecialties)
          );
        }
        if (field === "dob") {
          const currentDate = currentValue
            ? String(currentValue).slice(0, 10)
            : null;
          return nextValue !== currentDate;
        }
        if (field === "pincode" || field === "experienceYears") {
          const currentNumber =
            currentValue === null || currentValue === undefined
              ? null
              : Number(currentValue);
          return nextValue !== currentNumber;
        }
        return String(nextValue ?? "") !== String(currentValue ?? "");
      }),
    );

    if (
      Object.keys(payload).length === 0 &&
      !imageFile?.size &&
      !shouldClearProfileImage &&
      videoFiles.every((file) => !file) &&
      videoSlotsToDelete.length === 0 &&
      !hasSampleChanges
    ) {
      setSaveMessage("There are no changes to save.");
      setSaveMessageIsError(false);
      return;
    }
    setIsSaving(true);
    const savedProfileParts = [];
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
        savedProfileParts.push("Profile details");
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
      }

      if (imageFile?.size) {
        if (shouldClearProfileImage) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-picture`,
            { method: "DELETE" },
          );
          const result = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(result?.message || "Could not clear profile image.");
          }
          updatedUser = { ...updatedUser, profileImageUrl: "" };
          setProfile(updatedUser);
          syncSavedUser(updatedUser);
          setClearProfileImage(false);
          if (!savedProfileParts.includes("Profile image")) {
            savedProfileParts.push("Profile image");
          }
        }
        const imageData = new FormData();
        imageData.append("file", imageFile);
        const updatedWithImage = await updateProfile(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-picture`,
          { method: "PATCH", body: imageData },
        );
        updatedUser = updatedWithImage;
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
        savedProfileParts.push("Profile image");
      }
      if (shouldClearProfileImage && !imageFile?.size) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-picture`,
          { method: "DELETE" },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "Could not clear profile image.");
        }
        updatedUser = { ...updatedUser, profileImageUrl: "" };
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
        setClearProfileImage(false);
        if (!savedProfileParts.includes("Profile image")) {
          savedProfileParts.push("Profile image");
        }
      }

      for (const slot of videoSlotsToDelete) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-videos/${slot}`,
          { method: "DELETE" },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || `Could not clear profile video ${slot + 1}.`);
        }
        setProfileVideos((videos) => videos.filter((video) => video.slot !== slot));
        const legacyUrls = Array.isArray(updatedUser.profileVideoUrls)
          ? [...updatedUser.profileVideoUrls]
          : [];
        legacyUrls[slot] = "";
        updatedUser = {
          ...updatedUser,
          profileVideoUrls: legacyUrls,
          ...(slot === 0 ? { profileVideoUrl: "" } : {}),
        };
        setProfile(updatedUser);
        syncSavedUser(updatedUser);
        setDeletedVideoSlots((slots) => slots.filter((current) => current !== slot));
        savedProfileParts.push(`Profile video ${slot + 1}`);
      }

      for (const [slot, videoFile] of videoFiles.entries()) {
        if (!videoFile) continue;
        const videoData = new FormData();
        videoData.append("file", videoFile);
        const savedVideo = await updateProfile(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/profile-videos/${slot}`,
          { method: "PATCH", body: videoData },
        );
        setProfileVideos((videos) => [
          ...videos.filter((video) => video.slot !== slot),
          savedVideo,
        ]);
        savedProfileParts.push(`Profile video ${slot + 1}`);
      }

      if (hasSampleChanges) {
        const updatedPhotos = [...galleryPhotos];
        let deletedPhotoCount = 0;
        let savedPhotoCount = 0;
        for (const photoId of deletedSamplePhotoIds) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photo-galleries/${encodeURIComponent(photoId)}`,
            { method: "DELETE" },
          );
          const result = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(result?.message || "Could not clear a saved portfolio photo.");
          }
          const photoIndex = updatedPhotos.findIndex((photo) => photo._id === photoId);
          if (photoIndex !== -1) updatedPhotos.splice(photoIndex, 1);
          setGalleryPhotos([...updatedPhotos]);
          setDeletedSamplePhotoIds((ids) => ids.filter((id) => id !== photoId));
          deletedPhotoCount += 1;
        }
        if (deletedPhotoCount > 0) savedProfileParts.push("Portfolio photos");

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
          const photoResponse = await fetch(endpoint, {
            method: existingPhoto ? "PATCH" : "POST",
            body,
          });
          const photoResult = await photoResponse.json().catch(() => null);
          if (!photoResponse.ok) {
            throw new Error(
              photoResult?.message || `Could not save sample photo ${index + 1}.`,
            );
          }
          updatedPhotos[index] = photoResult?.data ?? photoResult;
          setGalleryPhotos([...updatedPhotos]);
          savedPhotoCount += 1;
          if (savedPhotoCount === 1) savedProfileParts.push("Portfolio photos");
        }
        clearSampleFiles();
        setDeletedSamplePhotoIds([]);
      }

      setDeletedVideoSlots([]);
      setIsEditing(false);
      updateSelectedImage(null);
      setClearProfileImage(false);
      videoFiles.forEach((_, index) => updateSelectedVideo(index, null));
      videoInputRefs.current.forEach((input) => {
        if (input) input.value = "";
      });
      setIsCalendarOpen(false);
      setSaveMessage("Profile updated successfully.");
      setSaveMessageIsError(false);
      await Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Your profile changes have been saved successfully.",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      setSaveMessage(
        savedProfileParts.length
          ? `${savedProfileParts.join(", ")} saved, but the remaining profile changes could not be saved: ${error.message}`
          : error.message || "Could not save your profile. Please try again.",
      );
      setSaveMessageIsError(true);
    } finally {
      setIsSaving(false);
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
                    const currentSpecialties = Array.isArray(profile.specialties)
                      ? profile.specialties
                      : profile.specialties
                        ? String(profile.specialties).split(",")
                        : [];
                    setSpecialtyTags(
                      [...new Set(currentSpecialties.map((tag) => String(tag).trim()).filter(Boolean))].map((label) => ({
                        label,
                        value: label,
                      })),
                    );
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
                  if (isEditing) {
                    cancelProfileEdit();
                  } else {
                    setIsEditing(true);
                    setSaveMessage("");
                  }
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            )}
          </header>

          {isLoading && (
            <p className={styles.stateMessage}>Loading profile...</p>
          )}
          {!isLoading && errorMessage && (
            <div className={styles.errorState} role="alert">
              <p>{errorMessage}</p>
              <Link href="/">Return home</Link>
            </div>
          )}

          {profile && isEditing && (
            <form className={styles.editForm} onSubmit={submitProfile}>
              {visibleEditableSections.map((section) => (
                <section className={styles.editSection} key={section.title}>
                  <h2>{section.title}</h2>
                  <div className={styles.editGrid}>
                    {section.fields.map(([field, label, type]) => (
                      <div
                        className={`${styles.editField} ${type === "textarea" ? styles.editFieldWide : ""}`}
                        key={field}
                      >
                        <label
                          className={styles.editLabel}
                          htmlFor={
                            field === "dob"
                              ? "dob-picker"
                              : field === "specialties"
                                ? "specialties-tags-input"
                                : field
                          }
                        >
                          {label}
                        </label>
                        {type === "textarea" ? (
                          <textarea
                            id={field}
                            name={field}
                            rows={4}
                            defaultValue={getEditValue(profile, field)}
                          />
                        ) : field === "specialties" ? (
                          <ReactTags
                            id="specialties-tags"
                            classNames={{
                              root: styles.tagInput,
                              tagList: styles.tagList,
                              tagListItem: styles.tagListItem,
                              tag: styles.tag,
                              tagName: styles.tagName,
                              comboBox: styles.tagComboBox,
                              input: styles.tagTextInput,
                            }}
                            labelText={label}
                            placeholderText="Type and press Enter"
                            activateFirstOption
                            allowNew
                            allowResize={false}
                            renderInput={({ classNames, inputWidth, ...inputProps }) => (
                              <input
                                {...inputProps}
                                className={classNames.input}
                                style={{ width: inputWidth }}
                                onKeyDown={(event) => {
                                  inputProps.onKeyDown?.(event);
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                  }
                                }}
                              />
                            )}
                            selected={specialtyTags}
                            onAdd={(tag) =>
                              setSpecialtyTags((currentTags) =>
                                currentTags.some(
                                  (currentTag) =>
                                    currentTag.label.toLowerCase() ===
                                    tag.label.toLowerCase(),
                                )
                                  ? currentTags
                                  : [...currentTags, tag],
                              )
                            }
                            onDelete={(tagIndex) =>
                              setSpecialtyTags((currentTags) =>
                                currentTags.filter((_, index) => index !== tagIndex),
                              )
                            }
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
                                      calendarYear === 1900 &&
                                      calendarMonthIndex === 0
                                    }
                                    onClick={() =>
                                      setCalendarMonth(
                                        new Date(
                                          calendarYear,
                                          calendarMonthIndex - 1,
                                          1,
                                        ),
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
                                          calendarYear ===
                                            currentMonth.getFullYear() &&
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
                                      const selectedYear = Number(
                                        event.target.value,
                                      );
                                      const selectedMonth =
                                        selectedYear ===
                                        currentMonth.getFullYear()
                                          ? Math.min(
                                              calendarMonthIndex,
                                              currentMonth.getMonth(),
                                            )
                                          : calendarMonthIndex;
                                      setCalendarMonth(
                                        new Date(
                                          selectedYear,
                                          selectedMonth,
                                          1,
                                        ),
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
                                      calendarYear >
                                        currentMonth.getFullYear() ||
                                      (calendarYear ===
                                        currentMonth.getFullYear() &&
                                        calendarMonthIndex >=
                                          currentMonth.getMonth())
                                    }
                                    onClick={() =>
                                      setCalendarMonth(
                                        new Date(
                                          calendarYear,
                                          calendarMonthIndex + 1,
                                          1,
                                        ),
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
                                      new Date(
                                        calendarYear,
                                        calendarMonthIndex,
                                        day,
                                      ),
                                    );
                                    const isSelected = dayValue === dobValue;
                                    return (
                                      <button
                                        className={`${styles.calendarDay} ${isSelected ? styles.calendarDaySelected : ""}`}
                                        key={dayValue}
                                        type="button"
                                        aria-label={displayDate(dayValue)}
                                        aria-pressed={isSelected}
                                        disabled={dayValue > dobTodayValue}
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
                        ) : type === "computed" ? (
                          <input
                            id={field}
                            type="number"
                            value={calculateAge(dobValue) ?? ""}
                            placeholder="Select your date of birth"
                            readOnly
                            aria-readonly="true"
                          />
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
                            step={
                              field === "experienceYears" || field === "pincode"
                                ? "1"
                                : undefined
                            }
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
                        (profile.profileImageUrl && !clearProfileImage
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
                      {selectedImageFile
                        ? "New image selected"
                        : clearProfileImage
                          ? "Profile image marked for removal"
                          : "Current profile image"}
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
                          {selectedImageFile
                            ? "Choose another"
                            : "Choose photo"}
                        </span>
                      </label>
                      {(selectedImageFile ||
                        profile.profileImageUrl ||
                        clearProfileImage) && (
                        <button
                          className={styles.samplePhotoClear}
                          type="button"
                          disabled={isSaving}
                          onClick={() => {
                            if (clearProfileImage) {
                              setClearProfileImage(false);
                            } else if (selectedImageFile) {
                              updateSelectedImage(null);
                            } else {
                              setClearProfileImage(true);
                            }
                            if (imageInputRef.current) imageInputRef.current.value = "";
                          }}
                        >
                          {clearProfileImage
                            ? "Undo clear"
                            : selectedImageFile
                              ? "Clear selection"
                              : "Clear photo"}
                        </button>
                      )}
                      {clearProfileImage && (
                        <small className={styles.imageFileName}>
                          Profile photo will be removed when you save.
                        </small>
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
                  <h2>Profile video</h2>
                  <p className={styles.sampleIntro}>
                    Share a video with clients. MP4, WebM, MOV, AVI, OGG, or MKV
                    files up to 15 MB are supported. You can add up to two
                    videos.
                  </p>
                  <div className={styles.videoSlots}>
                    {getProfileVideos(profile, profileVideos).map(
                      (videoUrl, index) => {
                        const isMarkedForRemoval =
                          deletedVideoSlots.includes(index);
                        const previewUrl = selectedVideoPreviews[index];
                        return (
                          <article className={styles.videoUpload} key={index}>
                            <div className={styles.videoPreviewFrame}>
                              {previewUrl ||
                              (videoUrl && !isMarkedForRemoval) ? (
                                <video
                                  className={styles.videoPreview}
                                  src={
                                    previewUrl || getGalleryImageUrl(videoUrl)
                                  }
                                  controls
                                  playsInline
                                  preload="metadata"
                                />
                              ) : (
                                <p>No video in slot {index + 1}.</p>
                              )}
                            </div>
                            <div className={styles.imageUploadContent}>
                              <strong>
                                {selectedVideoFiles[index]
                                  ? "New video selected"
                                  : videoUrl
                                    ? `Current video ${index + 1}`
                                    : `Add video ${index + 1}`}
                              </strong>
                              <p>Maximum size: 15 MB.</p>
                              <label className={styles.imageSelectButton}>
                                <input
                                  ref={(element) => {
                                    videoInputRefs.current[index] = element;
                                  }}
                                  className={styles.imageFileInput}
                                  type="file"
                                  accept={allowedProfileVideoTypes.join(",")}
                                  aria-label={`Choose profile video ${index + 1}`}
                                  onChange={(event) => {
                                    updateSelectedVideo(
                                      index,
                                      event.currentTarget.files?.[0] ?? null,
                                    );
                                    setSaveMessage("");
                                  }}
                                />
                                <span>
                                  {selectedVideoFiles[index]
                                    ? "Choose another"
                                    : videoUrl
                                      ? "Replace video"
                                      : "Choose video"}
                                </span>
                              </label>
                              {selectedVideoFiles[index] && (
                                <small className={styles.imageFileName}>
                                  {selectedVideoFiles[index].name}
                                </small>
                              )}
                              {(selectedVideoFiles[index] ||
                                (videoUrl && !isMarkedForRemoval) ||
                                isMarkedForRemoval) && (
                                <button
                                  className={styles.samplePhotoClear}
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => {
                                    if (isMarkedForRemoval) {
                                      setDeletedVideoSlots((slots) =>
                                        slots.filter((slot) => slot !== index),
                                      );
                                    } else if (selectedVideoFiles[index]) {
                                      updateSelectedVideo(index, null);
                                    } else {
                                      setDeletedVideoSlots((slots) => [
                                        ...slots,
                                        index,
                                      ]);
                                    }
                                    const input = videoInputRefs.current[index];
                                    if (input) input.value = "";
                                  }}
                                >
                                  {isMarkedForRemoval
                                    ? "Undo clear"
                                    : selectedVideoFiles[index]
                                      ? "Clear selection"
                                      : "Clear video"}
                                </button>
                              )}
                              {isMarkedForRemoval && (
                                <small className={styles.imageFileName}>
                                  Video will be removed when you save.
                                </small>
                              )}
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              )}

              {isPhotographer && (
                <section className={styles.editSection}>
                  <h2>Portfolio sample photos</h2>
                  <p className={styles.sampleIntro}>
                    Upload up to five photos to show clients examples of your
                    work. Each photo can be up to 5 MB and is saved to your
                    profile gallery.
                  </p>
                  <div className={styles.samplePhotoGrid}>
                    {sampleFiles.map((file, index) => {
                      const savedPhoto = galleryPhotos[index];
                      const isMarkedForRemoval =
                        savedPhoto &&
                        deletedSamplePhotoIds.includes(savedPhoto._id);
                      const previewUrl = samplePreviewUrls[index];
                      const imageUrl =
                        previewUrl ||
                        (savedPhoto && !isMarkedForRemoval
                          ? getGalleryImageUrl(savedPhoto.link)
                          : "");
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
                                disabled={galleryLoading || isSaving}
                                onChange={(event) =>
                                  updateSampleFile(
                                    index,
                                    event.currentTarget.files?.[0] ?? null,
                                  )
                                }
                              />
                              {file
                                ? "Replace selection"
                                : savedPhoto
                                  ? "Replace photo"
                                  : "Choose photo"}
                            </label>
                            {(file || savedPhoto || isMarkedForRemoval) && (
                              <div className={styles.samplePhotoSelection}>
                                <small className={styles.samplePhotoFilename}>
                                  {isMarkedForRemoval
                                    ? "Will be removed when you save."
                                    : file?.name || ""}
                                </small>
                                <button
                                  className={styles.samplePhotoClear}
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => {
                                    if (isMarkedForRemoval) {
                                      setDeletedSamplePhotoIds((ids) =>
                                        ids.filter((id) => id !== savedPhoto._id),
                                      );
                                    } else if (file) {
                                      updateSampleFile(index, null);
                                    } else if (savedPhoto) {
                                      setDeletedSamplePhotoIds((ids) => [
                                        ...ids,
                                        savedPhoto._id,
                                      ]);
                                    }
                                    const input = sampleFileInputRefs.current[index];
                                    if (input) input.value = "";
                                  }}
                                >
                                  {isMarkedForRemoval
                                    ? "Undo clear"
                                    : file
                                      ? "Clear selection"
                                      : "Clear photo"}
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
                </section>
              )}

              {saveMessage && (
                <p
                  className={
                    saveMessageIsError ? styles.editError : styles.editNotice
                  }
                  role={saveMessageIsError ? "alert" : "status"}
                >
                  {saveMessage}
                </p>
              )}
              <div className={styles.editActions}>
                <button
                  className={styles.backToProfileButton}
                  type="button"
                  disabled={isSaving}
                  onClick={cancelProfileEdit}
                >
                  Back to profile
                </button>
                <button
                  className={styles.saveButton}
                  type="submit"
                  disabled={
                    isSaving ||
                    (isPhotographer && galleryLoading && sampleFiles.some(Boolean))
                  }
                >
                  {isSaving ? "Saving profile..." : "Save profile"}
                </button>
              </div>
            </form>
          )}

          {profile && !isEditing && (
            <>
              {saveMessage && (
                <p className={styles.editNotice} role="status">
                  {saveMessage}
                </p>
              )}
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
                  <h2>{profile.name || "BookMyPhotographer user"}</h2>
                  <p>{profile.type || "Member"}</p>
                  <span>{profile.email}</span>
                </div>
                <span className={styles.status}>
                  {profile.status || "Account"}
                </span>
              </section>

              <div
                className={`${styles.profileDetailsLayout} ${
                  isPhotographer ? "" : styles.profileDetailsLayoutSingle
                }`}
              >
                {isPhotographer && (
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

                  <div
                    className={styles.availabilityLegend}
                    aria-label="Date status"
                  >
                    <span>
                      <i
                        className={styles.availableSwatch}
                        aria-hidden="true"
                      />
                      Available
                    </span>
                    <span>
                      <i className={styles.occupiedSwatch} aria-hidden="true" />
                      Occupied
                    </span>
                    {isEditingAvailability && (
                      <span className={styles.editingHint}>
                        Select dates to toggle
                      </span>
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
                          new Date(
                            availabilityYear,
                            availabilityMonthIndex,
                            day,
                          ),
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
                            disabled={
                              !isEditingAvailability ||
                              isSavingAvailability ||
                              isPast
                            }
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
                )}

                <section className={styles.accountDetails}>
                  <div className={styles.sectionHeading}>
                    <h2>Account details</h2>
                  </div>
                  {visibleProfileSections.map((section) => (
                    <section
                      className={styles.detailSection}
                      key={section.title}
                    >
                      <h3>{section.title}</h3>
                      <dl className={styles.detailsGrid}>
                        {section.fields.map(([field, label]) => (
                          <div className={styles.detailItem} key={field}>
                            <dt>{label}</dt>
                            <dd>
                              {field === "specialties" ? (
                                <SpecialtyTags value={profile[field]} />
                              ) : field === "age" ? (
                                formatValue(
                                  field,
                                  calculateAge(profile.dob) ?? profile.age,
                                )
                              ) : (
                                formatValue(field, profile[field])
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </section>
              </div>
              {isPhotographer && (
                <section className={styles.portfolioMediaSection}>
                  <header className={styles.portfolioMediaHeader}>
                    <h2>Portfolio media</h2>
                    <p>Photos and videos shared on your profile</p>
                  </header>
                  {galleryPhotos.length > 0 ||
                  getProfileVideos(profile, profileVideos).some(Boolean) ? (
                    <div className={styles.savedMediaWaterfall}>
                      {galleryPhotos.map((photo, index) => (
                        <figure
                          className={styles.savedMediaItem}
                          key={photo._id || `${photo.link}-${index}`}
                        >
                          <Image
                            className={styles.savedPortfolioPhoto}
                            src={getGalleryImageUrl(photo.link)}
                            alt={`Portfolio photo ${index + 1}`}
                            width={640}
                            height={440}
                            unoptimized
                          />
                        </figure>
                      ))}
                      {getProfileVideos(profile, profileVideos)
                        .filter(Boolean)
                        .map((videoUrl, index) => (
                          <figure
                            className={styles.savedMediaItem}
                            key={`${videoUrl}-${index}`}
                          >
                            <video
                              className={styles.savedProfileVideo}
                              src={getGalleryImageUrl(videoUrl)}
                              autoPlay
                              controls
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <figcaption>Profile video {index + 1}</figcaption>
                          </figure>
                        ))}
                    </div>
                  ) : (
                    <p className={styles.portfolioMediaEmpty}>
                      No portfolio photos or videos uploaded yet.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
