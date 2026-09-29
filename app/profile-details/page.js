"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function ProfileDetailsPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [emailMissing, setEmailMissing] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitDetails(event) {
    event.preventDefault();
    setMessage("");
    setEmailMissing(false);

    if (phone && phone.length !== 10) {
      setMessage("Enter a 10-digit phone number.");
      return;
    }

    const email = window.sessionStorage.getItem("signupEmail")?.trim();
    if (!email) {
      setMessage("Signup email not found. Please return to the signup page and try again.");
      setEmailMissing(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);
    const file = formData.get("file");
    if (!file?.type.startsWith("image/")) {
      setMessage("Choose an image file to continue.");
      return;
    }

    setIsSaving(true);
    try {
      const coordinates = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ latitude: null, longitude: null });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          ({ coords }) =>
            resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          () => resolve({ latitude: null, longitude: null }),
        );
      });
      formData.set(
        "latitude",
        coordinates.latitude === null ? "null" : String(coordinates.latitude),
      );
      formData.set(
        "longitude",
        coordinates.longitude === null ? "null" : String(coordinates.longitude),
      );
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/second`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json().catch(() => null);
      console.log("Profile details response:", result);
      if (!response.ok) {
        setMessage(
          result?.message ||
            "Could not save profile details. Please try again.",
        );
        return;
      }

      window.sessionStorage.removeItem("signupEmail");
      setMessage(result?.message || "Profile details saved successfully.");
      //  redirect the user to the home page after a short delay
    } catch {
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <Navbar current="signup" hideAuthActions="true" />
      <section className={styles.content}>
        <div className={`${styles.card} ${styles.profileCard}`}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>PROFILE SETUP</p>
            <h1>Tell us about yourself</h1>
            <p>Add your contact details and choose an account type.</p>
          </div>

          <form className={styles.profileForm} onSubmit={submitDetails}>
            <label className={styles.field}>
              <div>
                Type <span aria-hidden="true">*</span>
              </div>
              <select
                className={styles.typeSelect}
                name="type"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Choose an account type
                </option>
                <option value="ADMIN">ADMIN</option>
                <option value="PHOTOGRAPHER">PHOTOGRAPHER</option>
                <option value="PARTNER">PARTNER</option>
                <option value="SUPERADMIN">SUPER-ADMIN</option>
              </select>
            </label>

            <label className={styles.field}>
              <div>
                Phone <span aria-hidden="true">*</span>
              </div>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[0-9]{10}"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(event) => {
                  let digits = event.target.value.replace(/\D/g, "");
                  if (digits.length > 10 && digits.startsWith("0")) {
                    digits = digits.slice(1);
                  }
                  setPhone(digits.slice(0, 10));
                  setMessage("");
                }}
              />
            </label>

            <label className={styles.field}>
              <div>
                Country <span aria-hidden="true">*</span>
              </div>
              <input
                name="country"
                type="text"
                placeholder="Enter your country"
              />
            </label>

            <label className={styles.field}>
              <div>
                City <span aria-hidden="true">*</span>
              </div>
              <input name="city" type="text" placeholder="Enter your city" />
            </label>

            <label className={styles.field}>
              <div>
                Address 1 <span aria-hidden="true">*</span>
              </div>
              <input name="address1" type="text" placeholder="Street address" />
            </label>

            <label className={styles.field}>
              Address 2
              <input
                name="address2"
                type="text"
                placeholder="Apartment, suite, etc."
              />
            </label>

            <div
              className={`${styles.profileUpload} ${styles.profileFieldWide}`}
            >
              <p className={styles.profileFileLabel}>
                Profile image <span aria-hidden="true">*</span>
              </p>
              <label className={styles.fileDropzone}>
                <input
                  className={styles.fileInput}
                  name="file"
                  type="file"
                  accept="image/*"
                  aria-label="Choose a profile image"
                  required
                  onChange={(event) => {
                    setSelectedFileName(
                      event.currentTarget.files?.[0]?.name ?? "",
                    );
                    setMessage("");
                  }}
                />
                <span className={styles.uploadIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" />
                  </svg>
                </span>
                <span className={styles.uploadCopy}>
                  <strong className={styles.uploadFileName}>
                    {selectedFileName || "Choose a profile image"}
                  </strong>
                  <span>
                    {selectedFileName
                      ? "Ready to add to your profile"
                      : "Select a photo from your device"}
                  </span>
                </span>
                <span className={styles.uploadAction}>
                  {selectedFileName ? "Change" : "Browse files"}
                </span>
              </label>
            </div>

            {message && (
              <p className={styles.profileNotice} role="status">
                {message}
              </p>
            )}

            {emailMissing && (
              <button
                className={`${styles.submit} ${styles.profileFieldWide}`}
                type="button"
                onClick={() => router.push("/signup")}
              >
                Return to signup
              </button>
            )}

            <button
              className={`${styles.submit} ${styles.profileFieldWide}`}
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving details..." : "Save details"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
