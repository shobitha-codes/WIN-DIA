"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "./admin.module.css";

const RECENT_ORDERS_LIMIT = 8;

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

// Status badge component matching orders page
function StatusBadge({ status }) {
  const colorMap = {
    placed: "#f59e0b",
    shipped: "#06b6d4",
    out_for_delivery: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  const color = colorMap[status] || "#6b7280";

  const labelMap = {
    placed: "Placed",
    shipped: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {labelMap[status] || status}
    </span>
  );
}

// ---- Single stat card ----
function StatCard({ value, label }) {
  return (
    <article className={styles.card}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </article>
  );
}

// ---- Stat cards row ----
function StatsGrid({ stats }) {
  const cards = [
    { value: stats.totalOrders, label: "Orders" },
    { value: stats.pendingOrders, label: "Pending" },
    { value: stats.totalProducts, label: "Products" },
    { value: stats.totalUsers, label: "Users" },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ---- Recent orders row ----
function OrderRow({ order }) {
  return (
    <tr>
      <td>{order.order_number || order.id}</td>
      <td>{formatDate(order.created_at)}</td>
      <td>{money(order.total_price)}</td>
      <td>
        <span className={styles.status}>
          {order.payment_status === "paid" || order.payment_status === "cod_collected"
            ? "Paid" 
            : order.payment_status === "cod_pending" 
            ? "Pending" 
            : order.payment_status === "refund_initiated"
            ? "Refunding"
            : order.payment_status === "refunded"
            ? "Refunded"
            : order.payment_status || "Pending"}
        </span>
      </td>
      <td>
        <StatusBadge status={order.order_status || "placed"} />
      </td>
    </tr>
  );
}

// ---- Recent orders panel ----
function RecentOrdersPanel({ orders }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Recent Orders</h2>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="5">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    Promise.all([
      authFetch("/api/admin/orders").then(r => r.json()),
      authFetch("/api/admin/products").then(r => r.json()),
      authFetch("/api/admin/users").then(r => r.json()),
    ])
      .then(async ([ordersRes, productsRes, usersRes]) => {
        const orders = ordersRes.data?.items || ordersRes.orders || ordersRes.data || [];
        const products = productsRes.data?.items || productsRes.products || productsRes.data || [];
        const users = usersRes.data?.items || usersRes.users || usersRes.data || [];

        // Don't fetch tracking - just use database values
        // The tracking API was overwriting correct "delivered" status with wrong data
        
        // Calculate stats with current database data
        const pendingStatuses = ["placed", "shipped", "out_for_delivery"];
        const pendingOrders = orders.filter(o => pendingStatuses.includes(o.order_status));

        // Get recent orders
        const recentOrders = orders
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, RECENT_ORDERS_LIMIT);

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          totalProducts: products.length,
          totalUsers: users.length,
          recentOrders,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard stats:", err);
        setLoading(false);
      });
  }, [authFetch]);

  if (loading) {
    return (
      <div className={styles.empty}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.top}>
        <div>
          <h1>Admin Dashboard</h1>
          <p className={styles.muted}>Manage orders, products, and users.</p>
        </div>
      </div>

      <StatsGrid stats={stats} />
      <RecentOrdersPanel orders={stats.recentOrders} />
    </>
  );
}