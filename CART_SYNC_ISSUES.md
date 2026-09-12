# Cart Database Sync Issues

## Problem
Cart items are stored ONLY in Redux/localStorage. They are NOT syncing with the database tables (`carts` and `cart_items`).

## Database Schema

### `carts` table
```
- id (uuid, PRIMARY KEY)
- user_id (uuid, nullable) - for logged-in users
- session_id (text, nullable) - for guest users
- created_at (timestamp)
- updated_at (timestamp)
```

### `cart_items` table
```
- id (uuid, PRIMARY KEY)
- cart_id (uuid, FK → carts.id)
- product_id (uuid, FK → products.id)
- quantity (integer, default: 1)
- created_at (timestamp)
- updated_at (timestamp)
```

## Current Behavior

**What happens now:**
1. User adds item to cart → Redux state updates → localStorage saves
2. User removes item → Redux state updates → localStorage saves
3. **Database is NEVER updated** ❌

**Result:**
- Cart items only exist in browser
- Clear browser data = cart is gone
- Switch devices = empty cart
- Database `carts` and `cart_items` tables are empty

## Backend APIs (Already Exist)

The backend has working APIs:
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart` - Update item quantity
- `DELETE /api/cart` - Remove item or clear cart

**But the frontend is NOT calling these APIs!**

## Required Changes

### 1. Update Cart Redux Actions

**File**: `src/frontend/redux/slices/cartSlice.js`

Need to add async thunks for:
- `addToCartAsync` - Calls `POST /api/cart`
- `updateQuantityAsync` - Calls `PUT /api/cart`
- `removeFromCartAsync` - Calls `DELETE /api/cart`
- `loadCartAsync` - Calls `GET /api/cart` on login
- `syncCartOnLogin` - Migrates localStorage cart to database

### 2. Handle Guest vs Authenticated Users

**Guest users (not logged in):**
- Store cart in localStorage only
- On login → migrate to database

**Authenticated users:**
- Every cart action → API call → database update
- On page load → fetch cart from database

### 3. Update Cart Components

**Files to update:**
- `src/frontend/screens/Cart/CartPage.jsx`
- `src/frontend/components/ProductCard.jsx` (or wherever "Add to Cart" is)

Change from:
```javascript
dispatch(addToCart(product));
```

To:
```javascript
if (user) {
  dispatch(addToCartAsync(product)); // Calls API
} else {
  dispatch(addToCart(product)); // localStorage only
}
```

### 4. RLS Policies for Cart Tables

May need to add RLS policies:

```sql
-- Allow users to view their own cart
CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own cart
CREATE POLICY "Users can create own cart" ON carts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own cart
CREATE POLICY "Users can update own cart" ON carts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Similar policies for cart_items table
-- (join through carts table to check ownership)
```

## Migration Strategy

### Phase 1: Add Database Sync (Non-Breaking)
1. Keep existing localStorage cart working
2. Add API calls for logged-in users
3. Cart works in both places temporarily

### Phase 2: Migrate Existing Carts
1. On login, check if user has localStorage cart
2. If yes → create database cart and add items
3. Clear localStorage cart after migration

### Phase 3: Full Database Mode
1. Logged-in users use database exclusively
2. Guests still use localStorage
3. Auto-migrate on login

## Testing Checklist

### For Guests
- [ ] Can add items to cart
- [ ] Cart persists on page refresh (localStorage)
- [ ] Cart items show correct quantities
- [ ] Can update quantities
- [ ] Can remove items

### For Logged-In Users
- [ ] Cart syncs to database on add/remove/update
- [ ] Database `carts` table has user's cart
- [ ] Database `cart_items` table has items with correct quantities
- [ ] Cart loads from database on login
- [ ] Cart persists across devices
- [ ] Cart persists after logout → login

### Migration (Guest → Logged In)
- [ ] Guest adds items to cart
- [ ] Guest logs in
- [ ] Cart items migrate to database
- [ ] Items still visible in cart UI
- [ ] Database shows all items

## Implementation Priority

**High Priority:**
1. ✅ Backend APIs exist (already done)
2. ❌ Frontend needs to call APIs
3. ❌ RLS policies need to be added

**Medium Priority:**
4. ❌ Guest-to-authenticated migration
5. ❌ Handle cart conflicts (if items in both localStorage and DB)

**Low Priority:**
6. ❌ Cross-device cart sync notifications
7. ❌ Cart item availability checks

## Next Steps

1. **Tell database partner**: Add RLS policies for `carts` and `cart_items` tables
2. **Update frontend**: Modify cartSlice.js to call APIs
3. **Test**: Verify database tables populate correctly
4. **Deploy**: Roll out to production

---

## Files That Need Changes

### Backend (RLS only)
- `supabase/migrations/2026XXXX_cart_rls_policies.sql` (NEW)

### Frontend
- `src/frontend/redux/slices/cartSlice.js` (ADD async thunks)
- `src/frontend/screens/Cart/CartPage.jsx` (USE async actions)
- `src/frontend/components/ProductCard.jsx` (USE async actions)
- Any other component that calls `addToCart`, `removeFromCart`, `updateQuantity`

