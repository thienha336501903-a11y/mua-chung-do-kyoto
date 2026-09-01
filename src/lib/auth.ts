import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_PASSWORD } from './constants';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kyoto_demand_jwt_secret_key_2026_super_secure_default_key'
);

export interface AdminSessionPayload {
  role: 'admin';
  authenticatedAt: number;
}

export async function createAdminToken(): Promise<string> {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function checkAdminAuth(req?: NextRequest): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  // 1. Check header password
  if (req) {
    const headerPassword = req.headers.get('x-admin-password');
    if (headerPassword && headerPassword === adminPassword) {
      return true;
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === adminPassword) return true;
      if (await verifyAdminToken(token)) return true;
    }
  }

  // 2. Check Cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token && (await verifyAdminToken(token))) {
      return true;
    }
  } catch {
    // cookies() might fail if outside request context
  }

  return false;
}
