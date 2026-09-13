# Coupon System Setup

## Overview
The coupon/promo code system is now fully functional on both Cart and Payment pages.

## Changes Made

### 1. Added Discount to Packing Slip
- Discount line now appears between Shipping and Total in the packing slip
- Only shows if `order.discount_price > 0`
- Format: `Discount: - ₹XX`

### 2. Added Promo Code Input to Payment Page
- Added promo code input field in the Order Summary sidebar on `/checkout` page
- Matches the UI from the Cart page
- Real-time validation via API

### 3. Created Public Coupon Validation API
- **Endpoint**: `POST /api/coupons/validate`
- **Body**: `{ code: string, cart_total: number }`
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "code": "WINDIA10",
      "discount_amount": 100,
      "final_total": 900,
      "discount_type": "percentage",
      "discount_value": 10
    }
  }
  ```

### 4. Updated Cart & Checkout Pages
- Both pages now use the real coupon validation API
- Loading states while validating
- Proper error handling
- Shows discount amount in success message

## Database Schema

Coupons table structure:
```sql
coupons (
  id UUID PRIMARY KEY,
  code VARCHAR UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR (percentage|fixed),
  discount_value DECIMAL NOT NULL,
  min_order_amount DECIMAL,
  max_discount_amount DECIMAL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Creating Test Coupons

### Via Admin Panel
1. Go to `/admin/coupons`
2. Click "Add Coupon"
3. Fill in the details:
   - **Code**: WINDIA10 (or any code)
   - **Discount Type**: Percentage or Fixed
   - **Discount Value**: 10 (for 10% or ₹10)
   - **Min Order Amount**: (optional) minimum cart value
   - **Max Discount**: (optional) cap on discount amount
   - **Usage Limit**: (optional) max uses
   - **Expires On**: (optional) expiry date
   - **Status**: Active

### Via SQL (for testing)
```sql
INSERT INTO coupons (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount_amount,
  usage_limit,
  used_count,
  is_active,
  created_at,
  updated_at
) VALUES (
  'WINDIA10',
  'Get 10% off on all orders',
  'percentage',
  10,
  NULL,
  NULL,
  NULL,
  0,
  true,
  NOW(),
  NOW()
);
```

## Coupon Validation Rules

The system validates:
1. ✅ Coupon exists and is active (`is_active = true`)
2. ✅ Start date (if set): `starts_at <= NOW()`
3. ✅ Expiry date (if set): `expires_at > NOW()`
4. ✅ Usage limit (if set): `used_count < usage_limit`
5. ✅ Minimum order amount (if set): `cart_total >= min_order_amount`

## Discount Calculation

### Percentage Discount
```javascript
discountAmount = (cart_total * discount_value) / 100
if (max_discount_amount) {
  discountAmount = Math.min(discountAmount, max_discount_amount)
}
```

### Fixed Discount
```javascript
discountAmount = Math.min(discount_value, cart_total)
```

## Testing

1. Add products to cart
2. On Cart page, enter coupon code (e.g., "WINDIA10")
3. Click "Apply" - should see success message
4. Discount should appear in order summary
5. Go to checkout - discount should persist
6. On Payment page, can also apply/remove coupon
7. Place order - discount should appear in packing slip

## Files Modified

- `src/frontend/screens/Cart/CartPage.jsx` - Added real API validation
- `src/frontend/screens/Checkout/CheckoutPage.jsx` - Added promo input UI
- `app/api/coupons/validate/route.ts` - **NEW** public validation endpoint
- `app/admin/orders/page.jsx` - Discount already in packing slip

## Next Steps

1. Create initial test coupons via admin panel
2. Test full flow: Cart → Checkout → Order → Packing Slip
3. Verify discount shows correctly in all places
4. Test edge cases: expired coupons, usage limits, min order amounts
