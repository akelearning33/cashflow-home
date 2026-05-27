import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FUNCTION_NAME = 'delete-user';

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: FUNCTION_NAME, event, ...details }));
}

function getServiceRoleKey(): string | undefined {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (typeof parsed.default === 'string') return parsed.default;
    } catch {
      // Fall back to manually configured secrets below.
    }
  }

  return Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? undefined;
}

serve(async (req: Request) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logEvent('preflight', { requestId });
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    logEvent('invalid_method', { requestId, method: req.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('x-user-authorization') ?? req.headers.get('Authorization');
    logEvent('auth_header_received', {
      requestId,
      hasAuthHeader: Boolean(authHeader),
      hasBearerPrefix: Boolean(authHeader?.startsWith('Bearer ')),
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logEvent('auth_header_invalid', { requestId });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.slice('Bearer '.length).trim();
    if (!jwt) {
      logEvent('jwt_missing_after_bearer', { requestId });
      return new Response(JSON.stringify({ error: 'Invalid JWT' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = getServiceRoleKey();
    if (!supabaseUrl || !serviceRoleKey) {
      logEvent('missing_env', {
        requestId,
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      });
      return new Response(JSON.stringify({ error: 'Delete user service is not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller token and extract caller id.
    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user?.id) {
      logEvent('token_validation_failed', {
        requestId,
        reason: userError?.message ?? 'missing_user_id',
      });
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;
    logEvent('token_validated', { requestId, callerId });
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .single();

    if (callerProfile?.role !== 'admin') {
      logEvent('forbidden_non_admin', { requestId, callerId, role: callerProfile?.role ?? null });
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    let payload;
    try {
      payload = await req.json();
    } catch {
      logEvent('payload_invalid_json', { requestId });
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const user_id = String(payload.user_id ?? '').trim();
    if (!user_id) {
      logEvent('payload_invalid_missing_user_id', { requestId });
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Prevent admin from deleting themselves
    if (user_id === callerId) {
      logEvent('prevent_self_delete', { requestId, callerId });
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Delete auth user (profile cascades via FK)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      const userWasAlreadyMissing =
        deleteError.status === 404 || deleteError.message.toLowerCase().includes('not found');

      if (userWasAlreadyMissing) {
        const { error: profileDeleteError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', user_id);

        if (!profileDeleteError) {
          logEvent('delete_profile_only_success', { requestId, callerId, targetUserId: user_id });
          return new Response(JSON.stringify({ message: 'User profile deleted successfully' }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        logEvent('delete_profile_only_failed', {
          requestId,
          targetUserId: user_id,
          reason: profileDeleteError.message,
        });
      }

      logEvent('delete_failed', { requestId, targetUserId: user_id, reason: deleteError.message });
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    logEvent('delete_success', { requestId, callerId, targetUserId: user_id });

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logEvent('unhandled_error', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
