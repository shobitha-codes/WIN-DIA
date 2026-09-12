"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY = { 
  code: "", 
  description: "",
  discount_type: "percentage", 
  discount_value: "", 
  min_order_amount: "", 
  max_discount_amount: "",
  usage_limit: "", 
  starts_at: "",
  expires_at: "" 
};

function formatMinOrder(value) {
  return value ? `₹${value}` : "-";
}

function formatUsage(timesUsed, usageLimit) {
  return `${timesUsed || 0}${usageLimit ? ` / ${usageLimit}` : ""}`;
}

function formatExpiry(expiresAt) {
  return expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN") : "-";
}

function CouponForm({ form, setForm, onSave }) {
  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={onSave}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          Code
          <input
            type="text"
            className={styles.input}
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="WINDIA10"
            required
          />
        </label>
        
        <label className={styles.field}>
          Discount Type
          <select
            className={styles.select}
            value={form.discount_type || "percentage"}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            required
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </label>
        
        <label className={styles.field}>
          {form.discount_type === "percentage" ? "Discount %" : "Discount Amount ₹"}
          <input
            type="number"
            className={styles.input}
            min="1"
            max={form.discount_type === "percentage" ? "100" : undefined}
            step={form.discount_type === "percentage" ? "1" : "0.01"}
            value={form.discount_value || ""}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            placeholder={form.discount_type === "percentage" ? "10" : "50"}
            required
          />
        </label>
        
        <label className={styles.field}>
          Min Order Amount ₹
          <input
            type="number"
            className={styles.input}
            value={form.min_order_amount || ""}
            onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
            placeholder="Optional"
          />
        </label>
        
        <label className={styles.field}>
          Max Discount ₹
          <input
            type="number"
            className={styles.input}
            value={form.max_discount_amount || ""}
            onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
            placeholder="Optional"
          />
        </label>
        
        <label className={styles.field}>
          Usage Limit
          <input
            type="number"
            className={styles.input}
            value={form.usage_limit || ""}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            placeholder="Optional"
          />
        </label>
        
        <label className={styles.field}>
          Starts At
          <input
            type="datetime-local"
            className={styles.input}
            value={form.starts_at || ""}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </label>
        
        <label className={styles.field}>
          Expires At
          <input
            type="datetime-local"
            className={styles.input}
            value={form.expires_at || ""}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </label>
        
        <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
          Description
          <input
            type="text"
            className={styles.input}
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
          />
        </label>
      </div>
      <button className={styles.button} style={{ marginTop: 14 }} type="submit">
        Create Coupon
      </button>
    </form>
  );
}

function CouponRow({ coupon, onToggle }) {
  const discountDisplay = coupon.discount_type === 'percentage' 
    ? `${coupon.discount_value}%` 
    : `₹${coupon.discount_value}`;
    
  return (
    <tr>
      <td>
        <strong>{coupon.code}</strong>
        {coupon.description && <div style={{ fontSize: "12px", color: "var(--coco-light)", marginTop: "2px" }}>{coupon.description}</div>}
      </td>
      <td>{discountDisplay}</td>
      <td>{formatMinOrder(coupon.min_order_amount)}</td>
      <td>{formatUsage(coupon.used_count, coupon.usage_limit)}</td>
      <td>{formatExpiry(coupon.expires_at)}</td>
      <td>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => onToggle(coupon)}>
          {coupon.is_active ? "Active" : "Inactive"}
        </button>
      </td>
    </tr>
  );
}

function CouponsTable({ coupons, loading, onToggle }) {
  if (loading) return <div className={styles.empty}>Loading coupons...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Min Order</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} onToggle={onToggle} />
          ))}
          {!coupons.length && (
            <tr>
              <td colSpan="6">No coupons found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminCouponsPage() {
  const { authFetch } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => {
        console.log('[DEBUG] Coupons API response:', data);
        if (data.success && data.coupons) {
          setCoupons(data.coupons);
          console.log('[DEBUG] Coupons loaded:', data.coupons.length);
        } else {
          toast.error(data.error || "Could not load coupons");
        }
      })
      .catch((err) => {
        console.error('[ERROR] Loading coupons failed:', err);
        toast.error("Failed to load coupons");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    
    // Convert form data to match API expectations
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
    };
    
    console.log('[DEBUG] Creating coupon with payload:', payload);
    
    try {
      const res = await authFetch("/api/admin/coupons", { 
        method: "POST", 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      
      console.log('[DEBUG] Create coupon response:', data);
      
      if (!data.success) {
        console.error('[ERROR] Create coupon failed:', data);
        toast.error(data.error || "Could not create coupon");
        return;
      }
      
      toast.success("Coupon created");
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      console.error('[ERROR] Create coupon exception:', err);
      toast.error("Failed to create coupon");
    }
  };

  const toggle = async (coupon) => {
    const res = await authFetch("/api/admin/coupons", {
      method: "PATCH",
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
    });
    const data = await res.json();
    if (!data.success) toast.error(data.error || "Could not update coupon");
    else load();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Coupons</h1>
          <p className={styles.muted}>Create and disable discount codes.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ New Coupon"}
        </button>
      </div>

      {showForm && <CouponForm form={form} setForm={setForm} onSave={save} />}

      <section className={styles.panel}>
        <CouponsTable coupons={coupons} loading={loading} onToggle={toggle} />
      </section>
    </>
  );
}