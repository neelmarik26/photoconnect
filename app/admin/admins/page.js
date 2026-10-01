"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import adminStyles from "../page.module.css";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";

async function adminRequest(path, token, options = {}) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admins${path}`,
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
		throw new Error(result?.message || "Could not complete the admin request.");
	}
	return result;
}

export default function AdminsPage() {
	const router = useRouter();
	const [accessToken, setAccessToken] = useState("");
	const [admins, setAdmins] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [messageIsError, setMessageIsError] = useState(false);

	useEffect(() => {
		let isCurrent = true;
		try {
			const user = JSON.parse(window.localStorage.getItem(savedUserKey) || "null");
			if (
				!user?.userId ||
				user.type !== "SUPERADMIN" ||
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
			adminRequest("", user.accessToken)
				.then((result) => {
					if (isCurrent) setAdmins(Array.isArray(result?.data) ? result.data : []);
				})
				.catch((error) => {
					if (isCurrent) {
						setMessage(error.message || "Could not load admin accounts.");
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

	const filteredAdmins = admins.filter((admin) =>
		[admin.name, admin.email]
			.join(" ")
			.toLowerCase()
			.includes(searchTerm.trim().toLowerCase()),
	);

	async function createAdmin(event) {
		event.preventDefault();
		setIsSaving(true);
		setMessage("");
		const formData = new FormData(event.currentTarget);
		const newAdmin = {
			name: String(formData.get("name") || "").trim(),
			email: String(formData.get("email") || "").trim(),
			password: String(formData.get("password") || ""),
		};

		try {
			const result = await adminRequest("", accessToken, {
				method: "POST",
				body: JSON.stringify(newAdmin),
			});
			setAdmins((currentAdmins) => [result, ...currentAdmins]);
			setMessage(`${newAdmin.name} was created as an admin.`);
			setMessageIsError(false);
			setIsFormOpen(false);
		} catch (error) {
			setMessage(error.message || "Could not create the admin account.");
			setMessageIsError(true);
		} finally {
			setIsSaving(false);
		}
	}

	async function deleteAdmin(admin) {
		if (!window.confirm(`Delete the admin account for ${admin.name}?`)) return;
		setDeletingId(String(admin._id));
		setMessage("");
		try {
			await adminRequest(`/${encodeURIComponent(admin._id)}`, accessToken, {
				method: "DELETE",
			});
			setAdmins((currentAdmins) =>
				currentAdmins.filter((item) => item._id !== admin._id),
			);
			setMessage(`${admin.name}'s account was deleted.`);
			setMessageIsError(false);
		} catch (error) {
			setMessage(error.message || "Could not delete this admin account.");
			setMessageIsError(true);
		} finally {
			setDeletingId("");
		}
	}

	function logout() {
		window.localStorage.removeItem(savedUserKey);
		router.replace("/admin/security");
	}

	if (!accessToken) return null;

	return (
		<main className={adminStyles.admin}>
			<aside className={adminStyles.sidebar}>
				<div className={adminStyles.brand}>
					<span className={adminStyles.brandMark}>▣</span>
					<span>BookMyPhotographer <b>|</b> <em>Admin</em></span>
				</div>
				<nav className={adminStyles.navigation} aria-label="Admin navigation">
					<Link className={adminStyles.navItem} href="/admin">⌂ <span>Dashboard</span></Link>
					<Link className={adminStyles.navItem} href="/admin/partner_companis">▣ <span>Partner Companies</span></Link>
					<span className={adminStyles.navItemActive} aria-current="page">♙ <span>Manage Admins</span></span>
				</nav>
				<div className={adminStyles.sidebarFooter}>BookMyPhotographer Admin v1.0</div>
			</aside>

			<section className={adminStyles.workspace}>
				<header className={adminStyles.topbar}>
					<div className={adminStyles.breadcrumb}>Admin <span>/</span> Manage Admins</div>
					<div className={styles.topbarLinks}>
						<Link href="/admin">Admin dashboard</Link>
							<Link href="/admin/profile">My profile</Link>
						<button type="button" onClick={logout}>Log out</button>
					</div>
				</header>

				<div className={adminStyles.content}>
					<div className={adminStyles.pageIntro}>
						<div>
							<p className={adminStyles.eyebrow}>SUPERADMIN / ACCESS CONTROL</p>
							<h1>Manage Admins</h1>
							<p>Create admin accounts or remove access. Admin profile details are managed by each admin.</p>
						</div>
						<button
							className={styles.createButton}
							type="button"
							onClick={() => {
								setMessage("");
								setIsFormOpen(true);
							}}
						>
							<span aria-hidden="true">+</span> Create admin
						</button>
					</div>

					<div className={styles.metrics}>
						<div><small>Admin accounts</small><strong>{admins.length}</strong></div>
						<div><small>Profile details pending</small><strong>{admins.filter((admin) => !admin.phone && !admin.country && !admin.city).length}</strong></div>
					</div>

					<section className={styles.directory} aria-label="Admin accounts">
						<header className={styles.directoryHeader}>
							<div><h2>Admin accounts</h2><p>{filteredAdmins.length} accounts shown</p></div>
							<label className={styles.search}>
								<span aria-hidden="true">⌕</span>
								<input
									type="search"
									value={searchTerm}
									placeholder="Search admins"
									aria-label="Search admin accounts"
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</label>
						</header>

						{message && <p className={`${styles.message} ${messageIsError ? styles.messageError : ""}`} role={messageIsError ? "alert" : "status"}>{message}</p>}

						<div className={styles.tableWrap}>
							<table>
								<thead><tr><th>Admin</th><th>Email</th><th>Phone</th><th>Location</th><th>Actions</th></tr></thead>
								<tbody>
									{isLoading && <tr><td className={styles.empty} colSpan={5}>Loading admin accounts...</td></tr>}
									{!isLoading && filteredAdmins.map((admin) => (
										<tr key={admin._id}>
											<td><strong>{admin.name}</strong><small className={styles.secondaryText}>Admin</small></td>
											<td>{admin.email}</td>
											<td>{admin.phone || "Not provided"}</td>
											<td>{[admin.city, admin.state, admin.country].filter(Boolean).join(", ") || "Not provided"}</td>
											<td><button className={styles.deleteButton} type="button" disabled={deletingId === String(admin._id)} onClick={() => deleteAdmin(admin)}>{deletingId === String(admin._id) ? "Deleting..." : "Delete"}</button></td>
										</tr>
									))}
									{!isLoading && filteredAdmins.length === 0 && <tr><td className={styles.empty} colSpan={5}>No admin accounts found.</td></tr>}
								</tbody>
							</table>
						</div>
					</section>
				</div>
			</section>

			{isFormOpen && (
				<div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false); }}>
					<section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-admin-title">
						<header><div><p>NEW ADMIN ACCOUNT</p><h2 id="create-admin-title">Create admin</h2></div><button type="button" aria-label="Close form" disabled={isSaving} onClick={() => setIsFormOpen(false)}>×</button></header>
						<form onSubmit={createAdmin}>
							<label>Full name<input autoFocus required minLength={2} maxLength={100} name="name" placeholder="Admin name" /></label>
							<label>Email address<input required type="email" maxLength={254} name="email" placeholder="admin@example.com" /></label>
							<label>Password<input required type="password" minLength={8} maxLength={50} name="password" autoComplete="new-password" placeholder="At least 8 characters" /></label>
							<div className={styles.formActions}>
								<button type="button" disabled={isSaving} onClick={() => setIsFormOpen(false)}>Cancel</button>
								<button type="submit" disabled={isSaving}>{isSaving ? "Creating..." : "Create admin"}</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</main>
	);
}