import Image from "next/image";
import styles from "../page.module.css";

export default function PhotographerCard({ person, onSelect }) {
  return (
    <article className={styles.card}>
      <button
        className={styles.cardOpen}
        type="button"
        aria-label={`View ${person.name}'s photographer profile`}
        onClick={() => onSelect(person)}
      >
        <div className={styles.photo}>
        <Image
          src={person.image}
          alt={person.name}
          width={700}
          height={520}
          unoptimized
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/defolt_profile_pic.jpg`;
          }}
        />
        </div>
        <div className={styles.cardInfo}>
          <h3>{person.name}</h3>
          <p className={styles.location}>● &nbsp;{person.location}</p>
          <div className={styles.tags}>
            {person.tags.length ? (
              person.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)
            ) : (
              <span>No specialties listed</span>
            )}
          </div>
          <p className={styles.rating}>
            {person.rating > 0 ? (
              <>★ <b>{person.rating.toFixed(1)}</b> <small>({person.reviews} reviews)</small></>
            ) : (
              <small>No reviews yet</small>
            )}
          </p>
        </div>
      </button>
      <button
        className={styles.cardSave}
        type="button"
        aria-label={`Save ${person.name}`}
        aria-pressed="false"
        onClick={(event) => {
          const isSaved = event.currentTarget.getAttribute("aria-pressed") === "true";
          event.currentTarget.setAttribute("aria-pressed", String(!isSaved));
          event.currentTarget.classList.toggle(styles.saved, !isSaved);
        }}
      >
        ♡
      </button>
    </article>
  );
}
