import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FUNCTION_NAME = 'invite-user';

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
      return new Response(JSON.stringify({ error: 'Invite service is not configured' }), {
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

    // Check caller is admin
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

    const full_name = String(payload.full_name ?? '').trim();
    const email = String(payload.email ?? '').trim().toLowerCase();
    const role = String(payload.role ?? '');
    const redirectTo = String(payload.redirect_to ?? req.headers.get('origin') ?? '').trim();

    if (!full_name || !email || !role) {
      logEvent('payload_invalid_missing_fields', { requestId });
      return new Response(JSON.stringify({ error: 'Missing fields: full_name, email, role' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    if (!['admin', 'member'].includes(role)) {
      logEvent('payload_invalid_role', { requestId, role });
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Invite via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role },
        ...(redirectTo ? { redirectTo } : {}),
      });

    if (inviteError) {
      logEvent('invite_failed', { requestId, email, reason: inviteError.message });
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!inviteData.user?.id) {
      logEvent('invite_missing_user', { requestId, email });
      return new Response(JSON.stringify({ error: 'Invitation was not created' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Upsert profile
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: inviteData.user.id,
      email,
      full_name,
      role,
    });

    if (profileError) {
      logEvent('profile_upsert_failed', {
        requestId,
        invitedUserId: inviteData.user.id,
        reason: profileError.message,
      });
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    logEvent('invite_success', { requestId, callerId, invitedUserId: inviteData.user.id, email, role });

    return new Response(JSON.stringify({ message: 'Invitation sent successfully' }), {
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
