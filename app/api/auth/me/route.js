import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  try {
    // Try cookie-based auth first (browser requests)
    const supabase = await createSupabaseServerClient();
    let user = null;

    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }

    // Fallback: try Authorization header (useAuth hook sends Bearer token)
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const { data: tokenData, error: tokenError } = await supabase.auth.getUser(token);
        if (!tokenError && tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'customer',
        full_name: profile?.full_name || null,
        phone: profile?.phone || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
