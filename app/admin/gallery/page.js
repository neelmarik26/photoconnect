"use client";

import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import styles from "./page.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function getUploadUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("data:")) return path; // base64 data URL
  if (path.startsWith("/public/") || path.startsWith("/uploads/")) {
    return `${BACKEND_URL}${path}`;
  }
  return `${BASE_PATH}${path}`;
}

function getDefaultConfig() {
  return {
    hero: {
      images: [],
      title: "Find the Perfect\nPhotographer for Your Event",
      description: "Talented. Trusted. Available.",
      script: "Moments\nThat Last Forever",
    },
  };
}

export default function GalleryPage() {
  const [config, setConfig] = useState(getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [heroImagePreviews, setHeroImagePreviews] = useState([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const fileInputRef = useRef(null);

  // Load config from backend on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config`);
        if (!response.ok) throw new Error("Failed to load hero configuration");
        const data = await response.json();
        setConfig((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            images: data.images || [],
            title: data.title || prev.hero.title,
            description: data.description || prev.hero.description,
            script: data.script || prev.hero.script,
          },
        }));
      } catch (error) {
        console.error("Failed to load hero images from backend:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  }

  // Hero images upload handler - uploads to backend
  async function handleHeroImagesUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showMessage("error", `${file.name}: Not an image file.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        showMessage("error", `${file.name}: Must be less than 10MB.`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    setUploadingHero(true);
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setHeroImagePreviews((prev) => [...prev, ...newPreviews]);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => formData.append("files", file));
      
      const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload images");
      }

      const data = await response.json();
      
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, images: data.images || prev.hero.images },
      }));
      showMessage("success", `${validFiles.length} hero image(s) uploaded!`);
    } catch (error) {
      showMessage("error", error.message || "Failed to upload hero images");
    } finally {
      setUploadingHero(false);
      setHeroImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Delete hero image from backend
  async function handleDeleteHeroImage(index) {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete this hero image?",
      text: "This will permanently remove the image from the homepage and storage.",
      showCancelButton: true,
      confirmButtonText: "Delete image",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#c7443e",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!confirmation.isConfirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config/images/${index}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete hero image from backend");
      const data = await response.json();
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, images: data.images || prev.hero.images.filter((_, i) => i !== index) },
      }));
      await Swal.fire({
        icon: "success",
        title: "Image deleted",
        text: "The hero image was removed from the homepage and storage.",
        confirmButtonColor: "#16877e",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Could not delete image",
        text: error.message || "Failed to delete hero image.",
        confirmButtonColor: "#16877e",
      });
    }
  }

  // Save hero text alongside the image array in the backend config.
  async function handleSaveHeroConfig() {
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.hero.title,
          description: config.hero.description,
          script: config.hero.script,
        }),
      });
      if (!response.ok) throw new Error("Failed to save hero section");
      window.dispatchEvent(new CustomEvent("heroConfigChanged", { detail: { hero: config.hero } }));
      showMessage("success", "Hero section text saved!");
    } catch (error) {
      showMessage("error", error.message || "Failed to save hero config");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle hero text changes
  function handleHeroTextChange(field, value) {
    const newHero = { ...config.hero, [field]: value };
    setConfig((prev) => ({ ...prev, hero: newHero }));
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading gallery settings...</p>
      </div>
    );
  }

  const heroImages = config.hero.images.length > 0
    ? config.hero.images.map((img) => getUploadUrl(typeof img === "string" ? img : img.url))
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>WORKSPACE / MEDIA</p>
          <h1>Gallery & Hero Management</h1>
          <p>Manage the home page hero section images and content.</p>
        </div>
      </div>

      {message.text && (
        <div className={`${styles.toast} ${styles[message.type]}`} role="alert">
          {message.text}
        </div>
      )}

      {/* Hero Section Editor */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Hero Section</h2>
          <p>Upload multiple hero images that will cycle on the home page. Edit title, description, and script text.</p>
        </div>

        <div className={styles.heroEditor}>
          {/* Images Upload */}
          <div className={styles.uploadCard}>
            <h3>Hero Background Images ({heroImages.length})</h3>
            <div className={styles.imagePreviewGrid}>
              {heroImages.length > 0 ? (
                heroImages.map((imgUrl, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={imgUrl} alt={config.hero.images[index]?.alt || `Hero ${index + 1}`} />
                    <button
                      className={styles.deleteImageBtn}
                      onClick={() => handleDeleteHeroImage(index)}
                      title="Delete this image"
                    >
                      🗑
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.placeholder}>
                  <span>No images uploaded</span>
                  <small>Recommended: 1920×1080px, max 10MB each (stored in backend)</small>
                </div>
              )}
            </div>
            <div className={styles.uploadActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleHeroImagesUpload}
                className={styles.fileInput}
                disabled={uploadingHero}
              />
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingHero}
              >
                {uploadingHero ? "Uploading..." : "Upload Images"}
              </button>
              {heroImages.length > 0 && (
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={async () => {
                    const confirmation = await Swal.fire({
                      icon: "warning",
                      title: "Remove all hero images?",
                      text: "This will permanently remove every hero image from storage.",
                      showCancelButton: true,
                      confirmButtonText: "Remove all",
                      cancelButtonText: "Cancel",
                      confirmButtonColor: "#c7443e",
                      reverseButtons: true,
                      focusCancel: true,
                    });
                    if (!confirmation.isConfirmed) return;

                    try {
                      for (let index = config.hero.images.length - 1; index >= 0; index -= 1) {
                        const response = await fetch(`${BACKEND_URL}/api/hero-imgs/config/images/${index}`, { method: "DELETE" });
                        if (!response.ok) throw new Error("Unable to delete all hero images");
                      }
                      setConfig((prev) => ({ ...prev, hero: { ...prev.hero, images: [] } }));
                      await Swal.fire({
                        icon: "success",
                        title: "Images deleted",
                        text: "All hero images were removed from storage.",
                        confirmButtonColor: "#16877e",
                      });
                    } catch (error) {
                      await Swal.fire({
                        icon: "error",
                        title: "Could not remove images",
                        text: error.message || "Failed to remove all hero images.",
                        confirmButtonColor: "#16877e",
                      });
                    }
                  }}
                >
                  Remove All
                </button>
              )}
            </div>
            <p className={styles.uploadHint}>
             Max Size is 10MB each.
            </p>
          </div>

          {/* Text Fields */}
          <div className={styles.textFields}>
            <div className={styles.field}>
              <label htmlFor="heroTitle">Title</label>
              <textarea
                id="heroTitle"
                value={config.hero.title}
                onChange={(e) => handleHeroTextChange("title", e.target.value)}
                rows={3}
                placeholder="Main headline text"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="heroDescription">Description</label>
              <textarea
                id="heroDescription"
                value={config.hero.description}
                onChange={(e) => handleHeroTextChange("description", e.target.value)}
                rows={2}
                placeholder="Subtitle text"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="heroScript">Script Text (Bottom Right)</label>
              <textarea
                id="heroScript"
                value={config.hero.script}
                onChange={(e) => handleHeroTextChange("script", e.target.value)}
                rows={2}
                placeholder="Decorative script text"
              />
            </div>

            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.saveBtn}`}
              onClick={handleSaveHeroConfig}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Hero Section Text"}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className={styles.previewCard}>
          <h3>Live Preview (auto-cycles every 5s)</h3>
          <HeroPreview images={heroImages} title={config.hero.title} description={config.hero.description} script={config.hero.script} />
        </div>
      </section>
    </div>
  );
}

// Separate preview component to handle cycling
function HeroPreview({ images, title, description, script }) {
  const [slide, setSlide] = useState(0);
  const defaultImages = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=85",
  ];
  const displayImages = images.length > 0 ? images : defaultImages;

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % displayImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div
      className={styles.heroPreview}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(4, 20, 28, .68), rgba(4, 20, 28, .06)), url(${displayImages[slide]})`,
      }}
    >
      <div className={styles.heroPreviewContent}>
        <h1 dangerouslySetInnerHTML={{ __html: title.replace(/\n/g, "<br />") }} />
        <p>{description}</p>
      </div>
      <p className={styles.heroPreviewScript} dangerouslySetInnerHTML={{ __html: script.replace(/\n/g, "<br />") }} />
      {displayImages.length > 1 && (
        <div className={styles.previewDots}>
          {displayImages.map((_, index) => (
            <button
              key={index}
              className={slide === index ? styles.previewDotActive : styles.previewDot}
              onClick={() => setSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
