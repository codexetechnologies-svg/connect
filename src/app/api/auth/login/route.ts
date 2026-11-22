import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Demo sign-in has been removed. Use email one-time-code authentication.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
