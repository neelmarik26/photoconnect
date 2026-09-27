"use client";

import { useState } from "react";
import styles from "../auth.module.css";
import Navbar from "../components/Navbar";

export default function ProfileDetailsPage() {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  function submitDetails(event) {
    event.preventDefault();

    if (phone && phone.length !== 10) {
      setMessage("Enter a 10-digit phone number.");
      return;
    }

    const file = new FormData(event.currentTarget).get("file");
    if (!file?.type.startsWith("image/")) {
      setMessage("Choose an image file to continue.");
      return;
    }

    setMessage("Profile details are ready. Connect a profile endpoint to save them.");
  }

  return (
    <main className={styles.page}>
      <Navbar current="signup" />
      <section className={styles.content}>
        <div className={`${styles.card} ${styles.profileCard}`}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>PROFILE SETUP</p>
            <h1>Tell us about yourself</h1>
            <p>Add your contact details and choose an account type.</p>
          </div>

          <form className={styles.profileForm} onSubmit={submitDetails}>
            <label className={styles.field}>
              Type
              <select name="type" defaultValue="" required>
                <option value="" disabled>
                  --
                </option>
                <option value="ADMIN">ADMIN</option>
                <option value="PHOTOGRAPHER">PHOTOGRAPHER</option>
                <option value="PARTNER">PARTNER</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </label>

            <label className={styles.field}>
              Phone
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
              City
              <input name="city" type="text" placeholder="Enter your city" />
            </label>

            <label className={styles.field}>
              Country
              <input name="country" type="text" placeholder="Enter your country" />
            </label>

            <label className={styles.field}>
              Address 1
              <input name="address1" type="text" placeholder="Street address" />
            </label>

            <label className={styles.field}>
              Address 2
              <input name="address2" type="text" placeholder="Apartment, suite, etc." />
            </label>

            <label className={`${styles.field} ${styles.profileFieldWide}`}>
              File <span aria-hidden="true">*</span>
              <input name="file" type="file" accept="image/*" required />
            </label>

            {message && (
              <p className={styles.profileNotice} role="status">
                {message}
              </p>
            )}

            <button className={`${styles.submit} ${styles.profileFieldWide}`} type="submit">
              Save details
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}