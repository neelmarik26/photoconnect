import styles from "../page.module.css";

export default function PhotographerCard({ person, onSelect }) {
  return (
    <article
      className={styles.card}
      onClick={() => onSelect(person)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(person);
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
          ★ <b>{person.rating}</b> <small>({person.reviews} reviews)</small>
        </p>
      </div>
    </article>
  );
}
