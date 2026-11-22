import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'KYC submission is unavailable. Verified account authentication and private document storage must be configured before accepting documents.'
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
