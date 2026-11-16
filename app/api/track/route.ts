import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDtdcTracking } from '../../../src/backend/lib/dtdc-tracking';
export const dynamic = 'force-dynamic';

// Map DTDC tracking status to our order_status values
function mapDtdcToOrderStatus(dtdcStep: string): string {
  const mapping: Record<string, string> = {
    'softdata_upload': 'shipped',
    'picked_up': 'shipped',
    'accepted': 'shipped',
    'in_transit': 'shipped',
    'at_destination': 'out_for_delivery',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled'
  };
  return mapping[dtdcStep] || 'placed';
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('tracking_token', token)
    .maybeSingle();

  if (error) console.error('[track] Supabase error:', error.message);
  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (!order.awb_code) {
    return NextResponse.json({
      awb: null, 
      step: 'placed', 
      label: 'Order placed', 
      issue: false,
      events: [], 
      paymentStatus: order.payment_status,
    });
  }

  // Fetch real-time tracking from DTDC
  const tracking = await getDtdcTracking(order.awb_code);
  
  // Map DTDC status to our order_status
  const newOrderStatus = mapDtdcToOrderStatus(tracking.step);
  
  // Prepare database updates
  const updates: any = {};
  
  // Update order_status if it changed
  if (newOrderStatus !== order.order_status) {
    updates.order_status = newOrderStatus;
  }
  
  // Auto-update payment status when delivered
  if (newOrderStatus === 'delivered') {
    // For COD orders: mark as collected
    if (order.payment_method === 'cod' && order.payment_status === 'cod_pending') {
      updates.payment_status = 'cod_collected';
    }
    // For online orders: ensure marked as paid (should already be paid, but double-check)
    if (order.payment_method !== 'cod' && order.payment_status !== 'paid') {
      updates.payment_status = 'paid';
    }
  }
  
  // Save updates to database
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id);
    
    if (updateError) {
      console.error('[track] Failed to update order:', updateError.message);
    } else {
      console.log(`[track] Updated order ${order.order_number}:`, updates);
    }
  }
  
  // Return tracking data with current payment status
  const currentPaymentStatus = updates.payment_status || order.payment_status;
  
  return NextResponse.json({
    awb: order.awb_code,
    step: tracking.step,
    label: tracking.label,
    issue: tracking.issue,
    events: tracking.events,
    expectedDelivery: tracking.expectedDelivery,
    paymentStatus: currentPaymentStatus,
  });
}