"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import adminStyles from "../page.module.css";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";
const profileFields = [
	["phone", "Phone", "tel"],
	["country", "Country", "text"],
	["state", "State", "text"],
	["city", "City", "text"],
	["address", "Address", "text"],
	["profileImageUrl", "Profile picture URL", "url"],
];

async function requestMyProfile(token, options = {}) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admins/me`,
		{
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				...(options.body ? { "Content-Type": "application/json" } : {}),
			},
		},
	);
	const result = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error(result?.message || "Could not complete the profile request.");
	}
	return result;
}

export default function AdminProfilePage() {
	const router = useRouter();
	const [accessToken, setAccessToken] = useState("");
	const [profile, setProfile] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [messageIsError, setMessageIsError] = useState(false);

	useEffect(() => {
		let isCurrent = true;
		try {
			const user = JSON.parse(window.localStorage.getItem(savedUserKey) || "null");
			if (
				!user?.userId ||
				!["ADMIN", "SUPERADMIN"].includes(user.type) ||
				user.accountCollection !== "admins" ||
				user.expiresAt <= Date.now() ||
				!user.accessToken
			) {
				router.replace("/admin/security");
				return () => {
					isCurrent = false;
				};
			}

			startTransition(() => setAccessToken(user.accessToken));
			requestMyProfile(user.accessToken)
				.then((result) => {
					if (isCurrent) setProfile(result?.data ?? result);
				})
				.catch((error) => {
					if (isCurrent) {
						setMessage(error.message || "Could not load your profile.");
						setMessageIsError(true);
					}
				})
				.finally(() => {
					if (isCurrent) setIsLoading(false);
				});
		} catch {
			router.replace("/admin/security");
			return () => {
				isCurrent = false;
			};
		}

		return () => {
			isCurrent = false;
		};
	}, [router]);

	async function saveProfile(event) {
		event.preventDefault();
		setIsSaving(true);
		setMessage("");
		const formData = new FormData(event.currentTarget);
		const update = {
			name: String(formData.get("name") || "").trim(),
		};
		profileFields.forEach(([field]) => {
			update[field] = String(formData.get(field) || "").trim() || null;
		});

		try {
			const result = await requestMyProfile(accessToken, {
				method: "PATCH",
				body: JSON.stringify(update),
			});
			setProfile(result?.data ?? result);
			setMessage("Your profile was updated.");
			setMessageIsError(false);
		} catch (error) {
			setMessage(error.message || "Could not save your profile.");
			setMessageIsError(true);
		} finally {
			setIsSaving(false);
		}
	}

	if (!accessToken) return null;

	return (
		<div>
					<div className={adminStyles.pageIntro}>
						<div>
							<p className={adminStyles.eyebrow}>ACCOUNT / PROFILE</p>
							<h1>My profile</h1>
							<p>Complete or update your admin contact details.</p>
						</div>
					</div>

					{message && <p className={`${styles.message} ${messageIsError ? styles.messageError : ""}`} role={messageIsError ? "alert" : "status"}>{message}</p>}
					{isLoading ? (
						<p className={styles.state}>Loading your profile...</p>
					) : profile ? (
						<form className={styles.profileForm} key={profile._id} onSubmit={saveProfile}>
							<label className={styles.fullWidth}>
								Full name
								<input required minLength={2} maxLength={100} name="name" defaultValue={profile.name || ""} />
							</label>
							{profileFields.map(([field, label, type]) => (
								<label key={field} className={field === "address" || field === "profileImageUrl" ? styles.fullWidth : ""}>
									{label}
									<input type={type} maxLength={field === "profileImageUrl" ? 500 : field === "address" ? 200 : 80} name={field} defaultValue={profile[field] || ""} />
								</label>
							))}
							<div className={styles.formActions}>
								<button className={styles.saveButton} type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save profile"}</button>
							</div>
						</form>
					) : null}
		</div>
	);
}
