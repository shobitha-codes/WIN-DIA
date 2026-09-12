import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { CouponService } from '@/src/backend/services/coupon.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const couponService = adminRes.value.scope.resolve<CouponService>(ServiceTokens.CouponService);
    const result = await couponService.createCoupon(body);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const couponService = adminRes.value.scope.resolve<CouponService>(ServiceTokens.CouponService);

    // No ?code param → list all coupons (admin table view).
    // With ?code param → look up a single coupon by code.
    if (!code) {
      console.log('[API /api/admin/coupons GET] Fetching all coupons...');
      const result = await couponService.listCoupons();
      console.log('[API /api/admin/coupons GET] Result success:', result.success);
      console.log('[API /api/admin/coupons GET] Result value:', result.value);
      console.log('[API /api/admin/coupons GET] Result error:', result.error);
      
      if (!result.success) {
        console.error('[API /api/admin/coupons GET] Failed to fetch coupons:', result.error);
        return handleServiceResult(result);
      }
      
      console.log('[API /api/admin/coupons GET] Returning coupons count:', result.value?.length || 0);
      return NextResponse.json({ success: true, coupons: result.value || [] });
    }

    const result = await couponService.getCouponByCode(code);
    return handleServiceResult(result);
  } catch (err: any) {
    console.error('[API /api/admin/coupons GET] Error:', err);
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const { id, ...dto } = body;

    if (!id) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Coupon id is required'),
        { status: 400 }
      );
    }

    const couponService = adminRes.value.scope.resolve<CouponService>(ServiceTokens.CouponService);
    const result = await couponService.updateCoupon(id, dto);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
