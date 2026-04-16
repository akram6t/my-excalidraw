import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Get the authenticated user's session from the request cookies.
 * Returns the user ID if authenticated, or null if not.
 */
export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    return (token?.id as string) || null;
  } catch {
    return null;
  }
}
