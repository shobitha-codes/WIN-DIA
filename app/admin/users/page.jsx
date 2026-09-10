"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

// ---- Data hook: encapsulates all user API calls (list) ----
function useAdminUsers() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    setLoading(true);
    authFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = data.data?.items || data.users || (Array.isArray(data.data) ? data.data : data.data ? [data.data] : []);
          setUsers(Array.isArray(items) ? items : []);
        } else {
          toast.error(data.error || "Could not load users");
        }
      })
      .finally(() => setLoading(false));
  }, [authFetch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading };
}

function formatJoinedDate(createdAt) {
  return createdAt ? new Date(createdAt).toLocaleDateString("en-IN") : "-";
}

// ---- Users table row ----
function UserRow({ user }) {
  const isAdminRole = user.role === "admin";
  return (
    <tr>
      <td>{user.full_name || user.name || "-"}</td>
      <td>{user.email}</td>
      <td>{user.phone || "-"}</td>
      <td>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "capitalize",
            backgroundColor: isAdminRole ? "#8b5cf618" : "#10b98118",
            color: isAdminRole ? "#8b5cf6" : "#10b981",
            border: `1px solid ${isAdminRole ? "#8b5cf640" : "#10b98140"}`,
          }}
        >
          {user.role || "customer"}
        </span>
      </td>
      <td>{formatJoinedDate(user.created_at)}</td>
    </tr>
  );
}

// ---- Users table ----
function UsersTable({ users, loading }) {
  if (loading) return <div className={styles.empty}>Loading users...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
          {!users.length && (
            <tr>
              <td colSpan="5">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- Page ----
export default function AdminUsersPage() {
  const { users, loading } = useAdminUsers();

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Users</h1>
          <p className={styles.muted}>View registered customers and their roles.</p>
        </div>
      </div>
      <section className={styles.panel}>
        <UsersTable users={users} loading={loading} />
      </section>
    </>
  );
}