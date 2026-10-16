// GET /api/keepalive – kalles av Vercel hver morgen (se «crons» i vercel.json).
// Supabase sin gratisplan setter databasen på pause etter en uke uten bruk, og
// da slutter deling, egne middager og felles butikker å virke. Et lite oppslag
// hver dag holder den våken. Oppslaget er det samme som appen gjør for alle.

const SUPABASE_URL = 'https://ocryrmuvwthsceovybqx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C2_Cb7ugeYLDx61Ng2nedQ_CI9CA-of';

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hk_list_stores`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: '{}',
    });
    return Response.json({ ok: response.ok, status: response.status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
