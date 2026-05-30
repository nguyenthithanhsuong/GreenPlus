"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../../../frontend/dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
	SCREEN_BACKGROUND_GRADIENT,
	SCREEN_CONTENT_PADDING_X,
	SCREEN_HEADER_PADDING_X,
	SCREEN_MAX_WIDTH_PX,
	SCREEN_SIDE_PADDING_PX,
} from "../../../../frontend/shared/screen.styles";

type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "unknown";
type PaymentMethod = "cod" | "momo" | "vnpay" | "bank_transfer" | "unknown";
type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";

type PaymentHistoryItem = {
	payment_id: string;
	order_id: string;
	order_date: string;
	order_status: OrderStatus;
	payment_method: PaymentMethod;
	payment_status: PaymentStatus;
	amount: number;
	transaction_id: string | null;
	payment_date: string | null;
};

type PaymentHistoryResponse = {
	items: PaymentHistoryItem[];
};

const styles: Record<string, React.CSSProperties> = {
	page: {
		minHeight: "100vh",
		background: SCREEN_BACKGROUND_GRADIENT,
		padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
	},
	container: {
		width: "100%",
		maxWidth: SCREEN_MAX_WIDTH_PX,
		minHeight: "100vh",
		background: "#FFFFFF",
		margin: "0 auto",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
		fontFamily: "'Inter', sans-serif",
	},
	topHeader: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: `16px ${SCREEN_HEADER_PADDING_X}`,
		minHeight: "72px",
		borderBottom: "1px solid #E5E7EB",
		background: "#FFFFFF",
	},
	backLink: {
		width: "24px",
		height: "24px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: "#1F2937",
		textDecoration: "none",
	},
	headerTitle: {
		margin: 0,
		fontSize: "18px",
		lineHeight: "22px",
		fontWeight: 700,
		color: "#111827",
	},
	headerSub: {
		margin: 0,
		fontSize: "12px",
		lineHeight: "16px",
		color: "#6B7280",
	},
	mainContent: {
		flex: 1,
		padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
		display: "flex",
		flexDirection: "column",
		gap: "14px",
		overflowY: "auto",
		background: "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)",
	},
	summaryGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: "12px",
	},
	summaryCard: {
		borderRadius: "16px",
		background: "#FFFFFF",
		border: "1px solid #E5E7EB",
		padding: "14px",
		boxShadow: "0px 1px 2px rgba(0,0,0,0.04)",
		display: "flex",
		flexDirection: "column",
		gap: "4px",
	},
	summaryLabel: {
		margin: 0,
		fontSize: "12px",
		lineHeight: "16px",
		color: "#6B7280",
	},
	summaryValue: {
		margin: 0,
		fontSize: "18px",
		lineHeight: "24px",
		fontWeight: 700,
		color: "#111827",
	},
	card: {
		borderRadius: "16px",
		background: "#FFFFFF",
		border: "1px solid #E5E7EB",
		padding: "14px",
		display: "flex",
		flexDirection: "column",
		gap: "10px",
	},
	sectionTitle: {
		margin: 0,
		fontSize: "14px",
		lineHeight: "20px",
		fontWeight: 700,
		color: "#111827",
	},
	helperText: {
		margin: 0,
		fontSize: "12px",
		lineHeight: "16px",
		color: "#6B7280",
	},
	emptyState: {
		borderRadius: "14px",
		border: "1px dashed #D1D5DB",
		background: "#F9FAFB",
		padding: "18px",
		textAlign: "center",
		color: "#6B7280",
		fontSize: "13px",
		lineHeight: "20px",
	},
	tabRow: {
		display: "flex",
		gap: "8px",
		flexWrap: "wrap",
	},
	tabButton: {
		flex: "1 1 0",
		minWidth: "96px",
		height: "40px",
		borderRadius: "999px",
		border: "1px solid #E5E7EB",
		background: "#F9FAFB",
		color: "#4B5563",
		fontSize: "13px",
		fontWeight: 700,
		cursor: "pointer",
	},
	tabButtonActive: {
		border: "1px solid #4EA96A",
		background: "#4EA96A",
		color: "#FFFFFF",
		boxShadow: "0px 10px 15px -3px rgba(16, 185, 129, 0.18)",
	},
	list: {
		display: "flex",
		flexDirection: "column",
		gap: "10px",
	},
	item: {
		borderRadius: "14px",
		border: "1px solid #E5E7EB",
		background: "#FFFFFF",
		padding: "12px",
		display: "flex",
		flexDirection: "column",
		gap: "10px",
		boxShadow: "0px 1px 2px rgba(0,0,0,0.03)",
	},
	itemTop: {
		display: "flex",
		justifyContent: "space-between",
		gap: "10px",
		alignItems: "flex-start",
	},
	orderText: {
		margin: 0,
		fontSize: "14px",
		lineHeight: "20px",
		fontWeight: 700,
		color: "#111827",
	},
	itemMeta: {
		margin: 0,
		fontSize: "12px",
		lineHeight: "16px",
		color: "#6B7280",
	},
	amount: {
		margin: 0,
		fontSize: "15px",
		lineHeight: "20px",
		fontWeight: 700,
		color: "#059669",
		textAlign: "right",
	},
	badge: {
		borderRadius: "999px",
		padding: "4px 10px",
		fontSize: "11px",
		lineHeight: "16px",
		fontWeight: 700,
		display: "inline-flex",
		alignItems: "center",
		gap: "4px",
	},
	badgeRow: {
		display: "flex",
		gap: "8px",
		flexWrap: "wrap",
		alignItems: "center",
	},
	detailGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: "8px 12px",
	},
	detailLabel: {
		margin: 0,
		fontSize: "11px",
		lineHeight: "16px",
		color: "#6B7280",
	},
	detailValue: {
		margin: 0,
		fontSize: "13px",
		lineHeight: "18px",
		color: "#111827",
		fontWeight: 600,
	},
	linkBtn: {
		height: "40px",
		borderRadius: "10px",
		border: "1px solid #4EA96A",
		background: "#4EA96A",
		color: "#FFFFFF",
		fontSize: "13px",
		fontWeight: 700,
		cursor: "pointer",
	},
	errorText: {
		margin: 0,
		fontSize: "13px",
		lineHeight: "18px",
		color: "#B91C1C",
		textAlign: "center",
	},
	loadingText: {
		margin: 0,
		fontSize: "13px",
		lineHeight: "18px",
		color: "#6B7280",
		textAlign: "center",
	},
};

function formatPrice(value: number): string {
	return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function formatDateTime(value: string | null): string {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	return new Intl.DateTimeFormat("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

function getPaymentLabel(method: PaymentMethod): string {
	if (method === "cod") return "COD";
	if (method === "momo") return "MoMo";
	if (method === "vnpay") return "VNPay";
	if (method === "bank_transfer") return "Chuyển khoản";
	return "Không rõ";
}

function getStatusLabel(status: PaymentStatus): string {
	if (status === "paid") return "Đã thanh toán";
	if (status === "pending") return "Chờ thanh toán";
	if (status === "failed") return "Thanh toán lỗi";
	if (status === "cancelled") return "Đã hủy";
	return "Không xác định";
}

function getStatusStyle(status: PaymentStatus): React.CSSProperties {
	if (status === "paid") return { color: "#059669", background: "#D1FAE5" };
	if (status === "pending") return { color: "#CA8A04", background: "#FEF9C3" };
	if (status === "failed") return { color: "#B91C1C", background: "#FEE2E2" };
	if (status === "cancelled") return { color: "#4B5563", background: "#F3F4F6" };
	return { color: "#6B7280", background: "#E5E7EB" };
}

function getOrderStatusLabel(status: OrderStatus): string {
	if (status === "completed") return "Hoàn thành";
	if (status === "delivering") return "Đang giao";
	if (status === "preparing") return "Đang chuẩn bị";
	if (status === "confirmed") return "Đã xác nhận";
	if (status === "cancelled") return "Đã hủy";
	return "Chờ xác nhận";
}

export default function TransactionHistoryPage() {
	const router = useRouter();
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<PaymentHistoryItem[]>([]);
	const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
	const [activeStatusTab, setActiveStatusTab] = useState<PaymentStatus>("pending");

	useEffect(() => {
		if (!initialized) {
			return;
		}

		if (!isAuthenticated || !user?.user_id) {
			router.replace("/login");
			return;
		}

		const controller = new AbortController();

		const loadPayments = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/payments?userId=${encodeURIComponent(user.user_id)}`, {
					signal: controller.signal,
				});
				const data = (await response.json()) as PaymentHistoryResponse | { error?: string };

				if (!response.ok) {
					const msg = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
					throw new Error(msg || "Không thể tải lịch sử thanh toán.");
				}

				setItems((data as PaymentHistoryResponse).items ?? []);
			} catch (requestError) {
				if ((requestError as Error).name === "AbortError") {
					return;
				}

				setItems([]);
				setError(requestError instanceof Error ? requestError.message : "Không thể tải lịch sử thanh toán.");
			} finally {
				setLoading(false);
			}
		};

		void loadPayments();

		return () => {
			controller.abort();
		};
	}, [initialized, isAuthenticated, router, user?.user_id]);

	const summary = useMemo(() => {
		const paid = items.filter((item) => item.payment_status === "paid").length;
		const pending = items.filter((item) => item.payment_status === "pending").length;
		const failed = items.filter((item) => item.payment_status === "failed").length;

		return {
			total: items.length,
			paid,
			pending,
			failed,
		};
	}, [items]);

	const filteredItems = useMemo(() => {
		return items.filter((item) => item.payment_status === activeStatusTab);
	}, [activeStatusTab, items]);

	const firstPaymentDate = items[0]?.payment_date ?? null;

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<header style={styles.topHeader}>
					<Link href="/profile" style={styles.backLink} aria-label="Quay lại profile">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</Link>

					<div style={{ textAlign: "center" }}>
						<h1 style={styles.headerTitle}>Lịch sử thanh toán</h1>
						<p style={styles.headerSub}>{user?.name ? `Xin chào ${user.name}` : "Chỉ hiển thị dữ liệu của tài khoản hiện tại"}</p>
					</div>

					<div style={{ width: "24px" }} />
				</header>

				<main style={styles.mainContent}>
					<section style={styles.summaryGrid}>
						<div style={styles.summaryCard}>
							<p style={styles.summaryLabel}>Tổng giao dịch</p>
							<p style={styles.summaryValue}>{summary.total}</p>
						</div>
						<div style={styles.summaryCard}>
							<p style={styles.summaryLabel}>Đã thanh toán</p>
							<p style={styles.summaryValue}>{summary.paid}</p>
						</div>
						<div style={styles.summaryCard}>
							<p style={styles.summaryLabel}>Chờ xử lý</p>
							<p style={styles.summaryValue}>{summary.pending}</p>
						</div>
						<div style={styles.summaryCard}>
							<p style={styles.summaryLabel}>Lỗi / thất bại</p>
							<p style={styles.summaryValue}>{summary.failed}</p>
						</div>
					</section>

                    <section style={styles.card}>
						<h2 style={styles.sectionTitle}>Ghi chú</h2>
						<p style={styles.helperText}>
							{firstPaymentDate ? `Giao dịch gần nhất được ghi nhận lúc ${formatDateTime(firstPaymentDate)}.` : "Các giao dịch COD có thể không có transaction_id."}
						</p>
					</section>

					<section style={styles.card}>
						<h2 style={styles.sectionTitle}>Danh sách thanh toán</h2>
						  <p style={styles.helperText}>Trang này chỉ lấy dữ liệu theo userId của tài khoản đang đăng nhập.</p>

						<div style={styles.tabRow}>
							{([
								{ key: "pending", label: "Chờ thanh toán" },
								{ key: "paid", label: "Đã thanh toán" },
								{ key: "failed", label: "Thanh toán lỗi" },
							] as const).map((tab) => (
								<button
									key={tab.key}
									type="button"
									style={{
										...styles.tabButton,
										...(activeStatusTab === tab.key ? styles.tabButtonActive : {}),
									}}
									onClick={() => {
										setActiveStatusTab(tab.key);
										setExpandedPaymentId(null);
									}}
								>
									{tab.label}
								</button>
							))}
						</div>

						{loading ? <p style={styles.loadingText}>Đang tải lịch sử thanh toán...</p> : null}
						{!loading && error ? <p style={styles.errorText}>{error}</p> : null}
						{!loading && !error && items.length === 0 ? (
							<div style={styles.emptyState}>
								Bạn chưa có giao dịch thanh toán nào.
							</div>
						) : null}

						{!loading && !error && items.length > 0 ? (
							<div style={styles.list}>
								{filteredItems.length > 0 ? filteredItems.map((item) => {
									const isExpanded = expandedPaymentId === item.payment_id;
									return (
										<article key={item.payment_id} style={styles.item} onClick={() => setExpandedPaymentId(isExpanded ? null : item.payment_id)}>
											<div style={styles.itemTop}>
												<div>
													<p style={styles.orderText}>#{item.order_id.slice(0, 8).toUpperCase()}</p>
													<p style={styles.itemMeta}>Thanh toán lúc {formatDateTime(item.payment_date ?? item.order_date)}</p>
												</div>
												<div style={{ textAlign: "right" }}>
													<p style={styles.amount}>{formatPrice(item.amount)}</p>
													<span style={{ ...styles.badge, ...getStatusStyle(item.payment_status) }}>{getStatusLabel(item.payment_status)}</span>
												</div>
											</div>

											<div style={styles.badgeRow}>
												<span style={{ ...styles.badge, background: "#EFF6FF", color: "#2563EB" }}>{getPaymentLabel(item.payment_method)}</span>
												<span style={{ ...styles.badge, background: "#F3F4F6", color: "#4B5563" }}>Đơn: {getOrderStatusLabel(item.order_status)}</span>
											</div>

											{isExpanded ? (
												<div style={styles.detailGrid}>
													<div>
														<p style={styles.detailLabel}>Mã giao dịch</p>
														<p style={styles.detailValue}>{item.transaction_id ?? "-"}</p>
													</div>
													<div>
														<p style={styles.detailLabel}>Ngày thanh toán</p>
														<p style={styles.detailValue}>{formatDateTime(item.payment_date)}</p>
													</div>
													<div>
														<p style={styles.detailLabel}>Mã đơn hàng</p>
														<p style={styles.detailValue}>#{item.order_id.slice(0, 8).toUpperCase()}</p>
													</div>
													<div>
														<p style={styles.detailLabel}>Trạng thái đơn</p>
														<p style={styles.detailValue}>{getOrderStatusLabel(item.order_status)}</p>
													</div>
												</div>
											) : null}

											<button
												type="button"
												style={styles.linkBtn}
												onClick={(event) => {
													event.stopPropagation();
													router.push(`/orders/${encodeURIComponent(item.order_id)}`);
												}}
											>
												Xem đơn hàng
											</button>
										</article>
									);
									}) : (
										<div style={styles.emptyState}>
											Không có giao dịch nào ở trạng thái này.
										</div>
									)}
							</div>
						) : null}
					</section>

					
				</main>

				<NavigationBar />
			</div>
		</div>
	);
}
