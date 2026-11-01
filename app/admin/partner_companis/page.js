"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import adminStyles from "../page.module.css";
import styles from "./page.module.css";

const savedUserKey = "photoConnectUser";

function getImageUrl(imageUrl) {
	if (!imageUrl) return "";
	if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
	return `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${imageUrl}`;
}

function getAccessToken() {
  try {
    const saved = window.localStorage.getItem(savedUserKey);
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user.accessToken || null;
  } catch {
    return null;
  }
}

function handleUnauthorized(router) {
  router.replace("/admin/security");
}

async function requestPartnerApi(path = "", options = {}, router) {
	const token = getAccessToken();
	if (!token) {
		handleUnauthorized(router);
		throw new Error("No access token");
	}
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partner-companies${path}`,
		{
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				...options.headers,
				...(options.body && !(options.body instanceof FormData)
					? { "Content-Type": "application/json" }
					: {}),
			},
		},
	);
	if (response.status === 401) {
		handleUnauthorized(router);
		throw new Error("Unauthorized");
	}
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
	const [selectedImage, setSelectedImage] = useState(null);
	const [selectedImagePreview, setSelectedImagePreview] = useState("");
	const [deletingImagePartnerId, setDeletingImagePartnerId] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		facebookUrl: "",
		instagramUrl: "",
		linkedinUrl: "",
		status: "Draft",
	});

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
		requestPartnerApi("", {}, router)
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
		setSelectedImage(null);
		setSelectedImagePreview("");
		setFormData({
			name: "",
			description: "",
			facebookUrl: "",
			instagramUrl: "",
			linkedinUrl: "",
			status: "Draft",
		});
	}

	async function savePartner(event) {
		event.preventDefault();
		setIsSaving(true);
		setMessage("");

		const nextPartner = {
			name: formData.name.trim(),
			description: formData.description.trim(),
			facebookUrl: formData.facebookUrl.trim() || null,
			instagramUrl: formData.instagramUrl.trim() || null,
			linkedinUrl: formData.linkedinUrl.trim() || null,
			status: formData.status,
		};

		try {
			const result = await requestPartnerApi(
				editingPartner ? `/${encodeURIComponent(editingPartner.id)}` : "",
				{
					method: editingPartner ? "PATCH" : "POST",
					body: JSON.stringify(nextPartner),
				},
				router,
			);
			const savedPartner = mapPartnerCompany(result?.data ?? result);
			if (selectedImage) {
				const imageData = new FormData();
				imageData.append("image", selectedImage);
				const imageResult = await requestPartnerApi(
					`/${encodeURIComponent(savedPartner.id)}/image`,
					{ method: "PATCH", body: imageData },
					router,
				);
				Object.assign(savedPartner, imageResult?.data ?? imageResult);
			}
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
			}, router);
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

	async function deletePartnerImage(partner) {
		if (!window.confirm(`Delete the image for ${partner.name}?`)) {
			return;
		}

		setDeletingImagePartnerId(partner.id);
		setMessage("");
		try {
			await requestPartnerApi(`/${encodeURIComponent(partner.id)}/image`, {
				method: "DELETE",
			}, router);
			setPartners((currentPartners) =>
				currentPartners.map((item) =>
					item.id === partner.id ? { ...item, imageUrl: "" } : item,
				),
			);
			setMessage(`Image for ${partner.name} deleted.`);
			setMessageIsError(false);
		} catch (error) {
			setMessage(error.message || "Could not delete the image.");
			setMessageIsError(true);
		} finally {
			setDeletingImagePartnerId("");
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
								setFormData({
									name: "",
									description: "",
									facebookUrl: "",
									instagramUrl: "",
									linkedinUrl: "",
									status: "Draft",
								});
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
													{partner.imageUrl ? (
														<div className={styles.companyImageWrapper}>
															<img
																className={styles.companyImage}
																src={getImageUrl(partner.imageUrl)}
																alt={`${partner.name} logo`}
															/>
															<button
																type="button"
																className={styles.deleteImageButton}
																onClick={() => deletePartnerImage(partner)}
																disabled={deletingImagePartnerId === partner.id}
																aria-label={`Delete image for ${partner.name}`}
															>
																{deletingImagePartnerId === partner.id ? "Deleting..." : "×"}
															</button>
														</div>
													) : (
														<span className={styles.companyMark} aria-hidden="true" />
													)}
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
															setFormData({
																name: partner.name || "",
																description: partner.description || "",
																facebookUrl: partner.facebookUrl || "",
																instagramUrl: partner.instagramUrl || "",
																linkedinUrl: partner.linkedinUrl || "",
																status: partner.status || "Draft",
															});
															setSelectedImage(null);
															setSelectedImagePreview("");
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
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									placeholder="e.g. Northstar Weddings"
								/>
							</label>
							<div className={styles.formRow}>
								<label>
									Company image
									{editingPartner?.imageUrl && (
										<div className={styles.currentImagePreview}>
											<img
												src={getImageUrl(editingPartner.imageUrl)}
												alt={`${editingPartner.name} current logo`}
											/>
											<span>Current image</span>
										</div>
									)}
									<input
										type="file"
										accept="image/jpeg,image/png,image/gif,image/webp"
										onChange={(event) => {
											const file = event.currentTarget.files?.[0] || null;
											if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
											setSelectedImage(file);
											setSelectedImagePreview(file ? URL.createObjectURL(file) : "");
										}}
									/>
									<small>JPG, PNG, GIF or WebP. Maximum 5 MB.</small>
								</label>
								<label>
									Publication status
									<select
										name="status"
										value={formData.status}
										onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
										value={formData.facebookUrl}
										onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
										placeholder="https://facebook.com/company"
									/>
								</label>
								<label>
									Instagram URL
									<input
										type="url"
										maxLength={2048}
										name="instagramUrl"
										value={formData.instagramUrl}
										onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
										placeholder="https://instagram.com/company"
									/>
								</label>
								<label>
									LinkedIn URL
									<input
										type="url"
										maxLength={2048}
										name="linkedinUrl"
										value={formData.linkedinUrl}
										onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
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
