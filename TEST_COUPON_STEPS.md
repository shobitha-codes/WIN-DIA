# Testing Coupon Creation

## Step 1: Go to Admin Coupons Page
- URL: http://localhost:3000/admin/coupons
- Click "+ New Coupon" button

## Step 2: Fill in the Form
Try these test values:

**Test Coupon 1: Simple Percentage Discount**
- Code: `WINDIA10`
- Discount Type: `Percentage (%)`
- Discount %: `10`
- Min Order Amount: (leave empty)
- Max Discount: (leave empty)
- Usage Limit: (leave empty)
- Starts At: (leave empty)
- Expires At: (leave empty)
- Description: `Get 10% off on all orders`

**Test Coupon 2: Fixed Amount with Min Order**
- Code: `SAVE50`
- Discount Type: `Fixed Amount (₹)`
- Discount Amount: `50`
- Min Order Amount: `500`
- Max Discount: (leave empty)
- Usage Limit: `100`
- Starts At: (leave empty)
- Expires At: (leave empty)
- Description: `Save ₹50 on orders above ₹500`

## Step 3: Click "Create Coupon"
You should see a success message.

## Step 4: Test on Cart Page
1. Add items to cart (total > ₹500 if testing SAVE50)
2. Enter coupon code in promo field
3. Click "Apply"
4. Should see discount applied

## Step 5: Test on Checkout Page
1. Go to checkout
2. Coupon should persist
3. Can apply/remove coupon
4. Place order

## Step 6: Check Packing Slip
1. Go to Admin → Orders
2. Find the order you just placed
3. Click "Packing Slip" button
4. Should see discount line between Shipping and Total

---

## Current Database Schema
```
coupons table:
- id (uuid, primary key)
- code (text, unique, required)
- description (text, optional)
- discount_type (text, required) - 'percentage' or 'fixed'
- discount_value (numeric, required)
- min_order_amount (numeric, optional)
- max_discount_amount (numeric, optional)
- usage_limit (integer, optional)
- used_count (integer, default 0)
- starts_at (timestamp, optional)
- expires_at (timestamp, optional)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
```
