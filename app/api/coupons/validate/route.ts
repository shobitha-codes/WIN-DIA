import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { CouponService } from '@/src/backend/services/coupon.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

/**
 * Public endpoint to validate and calculate discount for a coupon code
 * POST /api/coupons/validate
 * Body: { code: string, cart_total: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, cart_total } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Coupon code is required'),
        { status: 400 }
      );
    }

    if (cart_total === undefined || cart_total === null || typeof cart_total !== 'number') {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Cart total is required'),
        { status: 400 }
      );
    }

    // Get the coupon service - no auth required for validation
    const { container: globalContainer } = await import('@/src/backend/providers/container.provider');
    const couponService = globalContainer.resolve<CouponService>(ServiceTokens.CouponService);

    const result = await couponService.calculateDiscount({
      code: code.trim(),
      cart_total,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          errorCode: result.error.errorCode || 'COUPON_VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: code.toUpperCase(),
        discount_amount: result.value.discountAmount,
        final_total: result.value.finalTotal,
        discount_type: result.value.coupon.discount_type,
        discount_value: result.value.coupon.discount_value,
      },
    });
  } catch (err: any) {
    console.error('[API /api/coupons/validate] Error:', err);
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
