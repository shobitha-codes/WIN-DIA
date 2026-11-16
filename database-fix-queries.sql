-- ================================================================
-- WIN-DIA Database Fix Queries
-- Run these in Supabase SQL Editor
-- ================================================================

-- 1. CHECK CURRENT ORDER STATUSES
-- See what's actually in the database right now
SELECT 
  order_number,
  order_status,
  payment_status,
  payment_method,
  total_price,
  created_at,
  awb_code,
  tracking_token
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ================================================================
-- 2. FIX DELIVERED COD ORDERS - SET PAYMENT TO COLLECTED
-- ================================================================
-- For COD orders that are delivered, payment should be "cod_collected"
UPDATE orders 
SET 
  payment_status = 'cod_collected',
  updated_at = NOW()
WHERE 
  payment_method = 'cod'
  AND order_status = 'delivered'
  AND payment_status != 'cod_collected';

-- Show how many were updated
SELECT 
  COUNT(*) as updated_count,
  'COD orders marked as collected' as description
FROM orders
WHERE 
  payment_method = 'cod'
  AND order_status = 'delivered'
  AND payment_status = 'cod_collected';

-- ================================================================
-- 3. FIX ONLINE PAID ORDERS - ENSURE MARKED AS PAID
-- ================================================================
-- For online orders that are delivered, payment should be "paid"
UPDATE orders 
SET 
  payment_status = 'paid',
  updated_at = NOW()
WHERE 
  payment_method != 'cod'
  AND order_status = 'delivered'
  AND payment_status != 'paid';

-- ================================================================
-- 4. CHECK REVENUE - PAID ORDERS SUMMARY
-- ================================================================
-- See total revenue from actually paid orders
SELECT 
  payment_method,
  payment_status,
  COUNT(*) as order_count,
  SUM(total_price) as total_revenue
FROM orders
WHERE 
  order_status != 'cancelled'
  AND (
    payment_status = 'paid' 
    OR payment_status = 'cod_collected'
  )
GROUP BY payment_method, payment_status
ORDER BY payment_method, payment_status;

-- ================================================================
-- 5. TOTAL REVENUE (ALL PAID ORDERS)
-- ================================================================
SELECT 
  SUM(total_price) as total_revenue,
  COUNT(*) as total_paid_orders
FROM orders
WHERE 
  order_status != 'cancelled'
  AND (
    payment_status = 'paid' 
    OR payment_status = 'cod_collected'
  );

-- ================================================================
-- 6. CHECK FOR PROBLEMATIC ORDERS
-- ================================================================
-- Find orders where status might be wrong
SELECT 
  order_number,
  order_status,
  payment_status,
  payment_method,
  created_at,
  'Delivered but payment pending' as issue
FROM orders
WHERE 
  order_status = 'delivered'
  AND payment_status IN ('cod_pending', 'pending')
  
UNION ALL

SELECT 
  order_number,
  order_status,
  payment_status,
  payment_method,
  created_at,
  'Payment collected but not delivered' as issue
FROM orders
WHERE 
  payment_status = 'cod_collected'
  AND order_status != 'delivered';

-- ================================================================
-- 7. RESET SPECIFIC ORDERS (IF NEEDED)
-- ================================================================
-- If you know certain order numbers that should be "delivered",
-- uncomment and modify this query:

/*
UPDATE orders 
SET 
  order_status = 'delivered',
  payment_status = CASE 
    WHEN payment_method = 'cod' THEN 'cod_collected'
    ELSE 'paid'
  END,
  updated_at = NOW()
WHERE order_number IN (
  'WIN-1794548869802',
  'WIN-1794547895953'
  -- Add more order numbers here
);
*/

-- ================================================================
-- 8. VIEW FINAL STATE
-- ================================================================
-- Check all orders after fixes
SELECT 
  order_number,
  order_status,
  payment_status,
  payment_method,
  total_price,
  CASE 
    WHEN order_status = 'cancelled' THEN 'Cancelled'
    WHEN payment_status = 'paid' OR payment_status = 'cod_collected' THEN 'Paid'
    WHEN payment_status = 'cod_pending' OR payment_status = 'pending' THEN 'Pending'
    ELSE payment_status
  END as display_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ================================================================
-- 9. DASHBOARD STATS QUERY
-- ================================================================
-- This is what the dashboard should show
SELECT 
  (SELECT COUNT(*) FROM orders WHERE order_status != 'cancelled') as total_orders,
  (SELECT COUNT(*) FROM orders WHERE order_status IN ('placed', 'shipped', 'out_for_delivery')) as pending_orders,
  (SELECT COALESCE(SUM(total_price), 0) FROM orders 
   WHERE order_status != 'cancelled' 
   AND (payment_status = 'paid' OR payment_status = 'cod_collected')) as revenue;
