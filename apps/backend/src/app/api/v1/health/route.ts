import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Verify database connectivity
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          service: 'nursery-saas-api',
          version: '0.1.0',
          timestamp: new Date().toISOString(),
          reason: 'Database connectivity failed',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'nursery-saas-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'nursery-saas-api',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        reason: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
