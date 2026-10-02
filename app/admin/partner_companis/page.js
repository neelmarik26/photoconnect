"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import adminStyles from "../page.module.css";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";

async function requestPartnerApi(path = "", options = {}) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partner-companies${path}`,
		{
			...options,
			headers: options.body
				? { "Content-Type": "application/json", ...options.headers }
				: options.headers,
		},
	);
	const result = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error(result?.message || "Could not complete the company request.");
	}
	return result;
}

function mapPartnerCompany(partner) {
	return { ...partner, id: String(partner._id || partner.id) };
}

export default function PartnerCompaniesPage() {
	const router = useRouter();
	const [hasAdminAccess, setHasAdminAccess] = useState(false);
	const [partners, setPartners] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [deletingPartnerId, setDeletingPartnerId] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All statuses");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingPartner, setEditingPartner] = useState(null);
	const [message, setMessage] = useState("");
	const [messageIsError, setMessageIsError] = useState(false);

	useEffect(() => {
		let isCurrent = true;
		const savedUser = window.localStorage.getItem(savedUserKey);
		if (!savedUser) {
			router.replace("/admin/security");
			return () => {
				isCurrent = false;
			};
		}

		let user;
		try {
			user = JSON.parse(savedUser);
			if (
				!user.userId ||
				user.expiresAt <= Date.now() ||
				!["ADMIN", "SUPERADMIN"].includes(user.type) ||
				(user.type === "SUPERADMIN" && user.accountCollection !== "admins")
			) {
				router.replace("/admin/security");
				return () => {
					isCurrent = false;
				};
			}
		} catch {
			router.replace("/admin/security");
			return () => {
				isCurrent = false;
			};
		}

		startTransition(() => setHasAdminAccess(true));
		requestPartnerApi()
			.then((result) => {
				if (isCurrent) {
					setPartners(
						(Array.isArray(result?.data) ? result.data : []).map(
							mapPartnerCompany,
						),
					);
				}
			})
			.catch((error) => {
				if (isCurrent) {
					setMessage(error.message || "Could not load partner companies.");
					setMessageIsError(true);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoading(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [router]);

	const searchValue = searchTerm.trim().toLowerCase();
	const filteredPartners = partners.filter((partner) => {
		const matchesSearch =
			!searchValue ||
			[partner.name, partner.description]
				.join(" ")
				.toLowerCase()
				.includes(searchValue);
		const matchesStatus =
			statusFilter === "All statuses" || partner.status === statusFilter;
		return matchesSearch && matchesStatus;
	});
	const publishedCount = partners.filter(
		(partner) => partner.status === "Published",
	).length;
	const draftCount = partners.length - publishedCount;

	function closeForm() {
		setIsFormOpen(false);
		setEditingPartner(null);
	}

	async function savePartner(event) {
		event.preventDefault();
		setIsSaving(true);
		setMessage("");
		const formData = new FormData(event.currentTarget);
		const nextPartner = {
			icon: String(formData.get("icon") || "").trim() || "★",
			name: String(formData.get("name") || "").trim(),
			description: String(formData.get("description") || "").trim(),
			facebookUrl: String(formData.get("facebookUrl") || "").trim() || null,
			instagramUrl: String(formData.get("instagramUrl") || "").trim() || null,
			linkedinUrl: String(formData.get("linkedinUrl") || "").trim() || null,
			status: String(formData.get("status") || "Draft"),
		};

		try {
			const result = await requestPartnerApi(
				editingPartner ? `/${encodeURIComponent(editingPartner.id)}` : "",
				{
					method: editingPartner ? "PATCH" : "POST",
					body: JSON.stringify(nextPartner),
				},
			);
			const savedPartner = mapPartnerCompany(result?.data ?? result);
			setPartners((currentPartners) =>
				editingPartner
					? currentPartners.map((partner) =>
							partner.id === editingPartner.id ? savedPartner : partner,
						)
					: [savedPartner, ...currentPartners],
			);
			setMessage(`${nextPartner.name} ${editingPartner ? "updated" : "added"}.`);
			setMessageIsError(false);
			closeForm();
		} catch (error) {
			setMessage(error.message || "Could not save this company.");
			setMessageIsError(true);
		} finally {
			setIsSaving(false);
		}
	}

	async function deletePartner(partner) {
		if (!window.confirm(`Remove ${partner.name} from partner companies?`)) {
			return;
		}

		setDeletingPartnerId(partner.id);
		setMessage("");
		try {
			await requestPartnerApi(`/${encodeURIComponent(partner.id)}`, {
				method: "DELETE",
			});
			setPartners((currentPartners) =>
				currentPartners.filter((item) => item.id !== partner.id),
			);
			setMessage(`${partner.name} removed.`);
			setMessageIsError(false);
		} catch (error) {
			setMessage(error.message || "Could not remove this company.");
			setMessageIsError(true);
		} finally {
			setDeletingPartnerId("");
		}
	}

	if (!hasAdminAccess) return null;

	return (
		<>
			<div>
					<div className={adminStyles.pageIntro}>
						<div>
							<p className={adminStyles.eyebrow}>WORKSPACE / DIRECTORY</p>
							<h1>Partner Companies</h1>
							<p>Manage the companies featured alongside your photographers.</p>
						</div>
						<button
							className={styles.addButton}
							type="button"
							onClick={() => {
								setEditingPartner(null);
								setMessage("");
								setIsFormOpen(true);
							}}
						>
							<span aria-hidden="true">+</span> Add company
						</button>
					</div>

					<div className={styles.summaryGrid}>
						<div className={styles.summaryItem}>
							<span className={styles.summaryIcon}>▣</span>
							<div><small>Total companies</small><strong>{partners.length}</strong></div>
						</div>
						<div className={styles.summaryItem}>
							<span className={`${styles.summaryIcon} ${styles.publishedIcon}`}>✓</span>
							<div><small>Published</small><strong>{publishedCount}</strong></div>
						</div>
						<div className={styles.summaryItem}>
							<span className={`${styles.summaryIcon} ${styles.draftIcon}`}>◷</span>
							<div><small>Drafts</small><strong>{draftCount}</strong></div>
						</div>
					</div>

					<section className={styles.directory} aria-label="Partner directory">
						<div className={styles.directoryHeader}>
							<div>
								<h2>Company directory</h2>
								<p>{filteredPartners.length} companies shown</p>
							</div>
							<div className={styles.filters}>
								<label className={styles.searchBox}>
									<span aria-hidden="true">⌕</span>
									<input
										type="search"
										placeholder="Search companies"
										aria-label="Search companies"
										value={searchTerm}
										onChange={(event) => setSearchTerm(event.target.value)}
									/>
								</label>
								<select
									className={styles.statusSelect}
									aria-label="Filter by publication status"
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
								>
									<option>All statuses</option>
									<option>Published</option>
									<option>Draft</option>
								</select>
							</div>
						</div>

						{message && (
							<p
								className={`${styles.feedback} ${messageIsError ? styles.feedbackError : ""}`}
								role={messageIsError ? "alert" : "status"}
							>
								{message}
							</p>
						)}

						<div className={styles.tableWrap}>
							<table className={styles.table}>
								<thead>
									<tr>
										<th scope="col">Company</th>
										<th scope="col">Description</th>
										<th scope="col">Social profiles</th>
										<th scope="col">Status</th>
										<th scope="col"><span className={styles.srOnly}>Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{isLoading && (
										<tr>
											<td className={styles.emptyState} colSpan={5}>
												Loading partner companies...
											</td>
										</tr>
									)}
									{filteredPartners.map((partner) => (
										<tr key={partner.id}>
											<td>
												<div className={styles.companyCell}>
													<span className={styles.companyMark}>{partner.icon}</span>
													<strong>{partner.name}</strong>
												</div>
											</td>
											<td className={styles.descriptionCell}>{partner.description}</td>
											<td>
												<div className={styles.socialLinks}>
													{partner.facebookUrl && (
														<a
															href={partner.facebookUrl}
															target="_blank"
															rel="noreferrer"
															aria-label={`${partner.name} on Facebook`}
															className={styles.socialFacebook}
														>
															f
														</a>
													)}
													{partner.instagramUrl && (
														<a
															href={partner.instagramUrl}
															target="_blank"
															rel="noreferrer"
															aria-label={`${partner.name} on Instagram`}
															className={styles.socialInstagram}
														>
															◎
														</a>
													)}
													{partner.linkedinUrl && (
														<a
															href={partner.linkedinUrl}
															target="_blank"
															rel="noreferrer"
															aria-label={`${partner.name} on LinkedIn`}
															className={styles.socialLinkedin}
														>
															in
														</a>
													)}
													{!partner.facebookUrl &&
														!partner.instagramUrl &&
														!partner.linkedinUrl && (
															<span className={styles.noSocialLinks}>None</span>
														)}
												</div>
											</td>
											<td>
												<span className={`${styles.status} ${partner.status === "Published" ? styles.statusPublished : styles.statusDraft}`}>
													<i aria-hidden="true" /> {partner.status}
												</span>
											</td>
											<td>
												<div className={styles.rowActions}>
													<button
														type="button"
														className={styles.editAction}
														onClick={() => {
															setEditingPartner(partner);
															setMessage("");
															setIsFormOpen(true);
														}}
													>
														Edit
													</button>
													<button
														type="button"
														className={styles.deleteAction}
														disabled={deletingPartnerId === partner.id}
														onClick={() => deletePartner(partner)}
													>
														{deletingPartnerId === partner.id ? "Removing..." : "Remove"}
													</button>
												</div>
											</td>
										</tr>
									))}
									{!isLoading && filteredPartners.length === 0 && (
										<tr>
											<td className={styles.emptyState} colSpan={5}>
												No partner companies match your search.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>
					<p className={adminStyles.footerNote}>
							Partner companies are managed through the connected backend.
					</p>
			</div>

			{isFormOpen && (
				<div
					className={styles.modalBackdrop}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) closeForm();
					}}
				>
					<section
						className={styles.modal}
						role="dialog"
						aria-modal="true"
						aria-labelledby="partner-form-title"
					>
						<header className={styles.modalHeader}>
							<div>
								<p>{editingPartner ? "COMPANY DETAILS" : "NEW DIRECTORY ENTRY"}</p>
								<h2 id="partner-form-title">
									{editingPartner ? "Edit company" : "Add partner company"}
								</h2>
							</div>
							<button
								className={styles.closeButton}
								type="button"
								aria-label="Close form"
								onClick={closeForm}
							>
								×
							</button>
						</header>
						<form className={styles.form} onSubmit={savePartner}>
							<label>
								Company name
								<input
									autoFocus
									required
									maxLength={80}
									name="name"
									defaultValue={editingPartner?.name || ""}
									placeholder="e.g. Northstar Weddings"
								/>
							</label>
							<div className={styles.formRow}>
								<label>
									Mark
									<input
										maxLength={3}
										name="icon"
										defaultValue={editingPartner?.icon || ""}
										placeholder="★"
									/>
								</label>
								<label>
									Publication status
									<select
										name="status"
										defaultValue={editingPartner?.status || "Draft"}
									>
										<option>Draft</option>
										<option>Published</option>
									</select>
								</label>
							</div>
							<label>
								Description
								<input
									required
									maxLength={120}
									name="description"
									defaultValue={editingPartner?.description || ""}
									placeholder="A short line about the company"
								/>
							</label>
							<fieldset className={styles.socialFields}>
								<legend>Social media links</legend>
								<label>
									Facebook URL
									<input
										type="url"
										maxLength={2048}
										name="facebookUrl"
										defaultValue={editingPartner?.facebookUrl || ""}
										placeholder="https://facebook.com/company"
									/>
								</label>
								<label>
									Instagram URL
									<input
										type="url"
										maxLength={2048}
										name="instagramUrl"
										defaultValue={editingPartner?.instagramUrl || ""}
										placeholder="https://instagram.com/company"
									/>
								</label>
								<label>
									LinkedIn URL
									<input
										type="url"
										maxLength={2048}
										name="linkedinUrl"
										defaultValue={editingPartner?.linkedinUrl || ""}
										placeholder="https://linkedin.com/company/name"
									/>
								</label>
							</fieldset>
							<div className={styles.formActions}>
												<button
									className={styles.cancelButton}
									type="button"
													disabled={isSaving}
									onClick={closeForm}
								>
									Cancel
								</button>
											<button className={styles.saveButton} type="submit" disabled={isSaving}>
												{isSaving ? "Saving..." : editingPartner ? "Save changes" : "Add company"}
								</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</>
	);
}
