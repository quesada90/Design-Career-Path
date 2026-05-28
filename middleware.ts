import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Configure routes that do not require Clerk authentication.
 * 
 * - `/shared/:token`: The public read-only growth path link for managers/HR leads.
 * - `/sign-in` & `/sign-up`: Standard login and onboarding flows.
 * - `/api/shared/:token`: Serverless API routes feeding public visual graphs.
 */
const isPublicRoute = createRouteMatcher([
  '/shared(.*)',
  '/api/shared(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // If the target path is not listed as public, trigger active authorization check
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Exclude internal Next.js pathways, static files, and icons
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)',
    // Ensure middleware always intercepts API routing channels
    '/(api|trpc)(.*)',
  ],
};
