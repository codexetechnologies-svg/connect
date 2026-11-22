import { clerkMiddleware } from '@clerk/nextjs/server';
import { getSessionSecret } from '@/lib/auth/session-secret';
import { verifySession } from '@/lib/auth/session';

export default clerkMiddleware(async (auth, request) => {
  if (process.env.NODE_ENV === 'development' && process.env.PLAYWRIGHT_TEST_MODE === '1') {
    const secret = getSessionSecret();
    const testSession = secret
      ? await verifySession(request.cookies.get('cp_session')?.value, secret)
      : null;
    if (testSession) return;
  }

  await auth.protect();
});

export const config = {
  matcher: ['/dashboard/:path*', '/search/:path*', '/map/:path*', '/supplier/:path*', '/admin/:path*']
};
