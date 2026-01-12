/**
 * Admin API for IP Blocking Management
 *
 * Provides endpoints to manage blocked IPs:
 * - GET: List all blocked IPs
 * - POST: Unblock an IP or add to whitelist
 * - DELETE: Remove from whitelist
 *
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  getBlockedIps,
  getWhitelistedIps,
  unblockIp,
  addToWhitelist,
  removeFromWhitelist,
  blockIp,
  clearSuspiciousActivity,
  type SuspiciousActivityType,
} from '@/lib/security/ip-blocking';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if user has admin permissions
 */
async function isAdmin(usuarioId: number): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('usuarios')
      .select('papel, is_super_admin')
      .eq('id', usuarioId)
      .single();

    if (error || !data) {
      return false;
    }

    // Prefer is_super_admin (flag oficial). Mantém compatibilidade com 'papel'.
    if (data.is_super_admin) return true;
    return data.papel === 'admin' || data.papel === 'superadmin';
  } catch {
    return false;
  }
}

// =============================================================================
// GET - List blocked IPs
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!(await isAdmin(auth.usuarioId))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get blocked IPs and whitelist
    const [blockedIps, whitelistedIps] = await Promise.all([
      getBlockedIps(),
      getWhitelistedIps(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        blocked: blockedIps.map((ip) => ({
          ...ip,
          blockedAt: ip.blockedAt.toISOString(),
          expiresAt: ip.expiresAt?.toISOString() || null,
        })),
        whitelist: whitelistedIps,
        stats: {
          totalBlocked: blockedIps.length,
          permanent: blockedIps.filter((ip) => ip.permanent).length,
          temporary: blockedIps.filter((ip) => !ip.permanent).length,
          whitelisted: whitelistedIps.length,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Security] Error fetching blocked IPs:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Manage IPs (unblock, whitelist, block)
// =============================================================================

interface PostRequestBody {
  action: 'unblock' | 'whitelist' | 'block' | 'clear_suspicious';
  ip: string;
  reason?: string;
  ttlMs?: number;
  permanent?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!(await isAdmin(auth.usuarioId))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: PostRequestBody = await request.json();

    if (!body.action || !body.ip) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'action and ip are required' },
        { status: 400 }
      );
    }

    // Validate IP format (basic check)
    const ipRegex = /^[\d.a-fA-F:]+$/;
    if (!ipRegex.test(body.ip) && body.ip !== 'unknown') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid IP format' },
        { status: 400 }
      );
    }

    switch (body.action) {
      case 'unblock': {
        await unblockIp(body.ip);
        console.log(`[Admin Security] IP unblocked by user ${auth.usuarioId}: ${body.ip}`);
        return NextResponse.json({
          success: true,
          message: `IP ${body.ip} has been unblocked`,
        });
      }

      case 'whitelist': {
        await addToWhitelist(body.ip);
        console.log(`[Admin Security] IP whitelisted by user ${auth.usuarioId}: ${body.ip}`);
        return NextResponse.json({
          success: true,
          message: `IP ${body.ip} has been added to whitelist`,
        });
      }

      case 'block': {
        const ttlMs = body.permanent ? 0 : body.ttlMs || 60 * 60 * 1000; // Default 1 hour
        await blockIp(
          body.ip,
          {
            type: 'manual' as SuspiciousActivityType,
            count: 1,
            timestamp: Date.now(),
            details: body.reason || `Manual block by admin ${auth.usuarioId}`,
          },
          ttlMs
        );
        console.log(
          `[Admin Security] IP manually blocked by user ${auth.usuarioId}: ${body.ip} (permanent: ${body.permanent})`
        );
        return NextResponse.json({
          success: true,
          message: `IP ${body.ip} has been blocked${body.permanent ? ' permanently' : ''}`,
        });
      }

      case 'clear_suspicious': {
        await clearSuspiciousActivity(body.ip);
        console.log(
          `[Admin Security] Suspicious activity cleared by user ${auth.usuarioId}: ${body.ip}`
        );
        return NextResponse.json({
          success: true,
          message: `Suspicious activity cleared for IP ${body.ip}`,
        });
      }

      default: {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: `Invalid action: ${body.action}. Valid actions: unblock, whitelist, block, clear_suspicious`,
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('[Admin Security] Error managing IP:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Remove from whitelist
// =============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!(await isAdmin(auth.usuarioId))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get IP from query params
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'ip query parameter is required' },
        { status: 400 }
      );
    }

    await removeFromWhitelist(ip);
    console.log(`[Admin Security] IP removed from whitelist by user ${auth.usuarioId}: ${ip}`);

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been removed from whitelist`,
    });
  } catch (error) {
    console.error('[Admin Security] Error removing from whitelist:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
