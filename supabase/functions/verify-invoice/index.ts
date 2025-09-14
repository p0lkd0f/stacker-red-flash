import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  paymentHash?: string;
  invoice?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentHash, invoice }: VerifyRequest = await req.json();

    if (!paymentHash && !invoice) {
      return new Response(
        JSON.stringify({ error: 'paymentHash or invoice is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lndConnectAddress = Deno.env.get('LND_CONNECT_ADDRESS');

    if (!lndConnectAddress) {
      return new Response(
        JSON.stringify({ error: 'LND connection not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let host, port, macaroon;

    if (lndConnectAddress.startsWith('lndconnect://')) {
      const url = new URL(lndConnectAddress.replace('lndconnect://', 'https://'));
      host = url.hostname;
      port = url.port || '8080';
      macaroon = url.searchParams.get('macaroon');
    } else if (lndConnectAddress.includes('@')) {
      // Demo/simple mode – we can't verify with a pubkey@host format
      return new Response(
        JSON.stringify({ settled: false, amount_paid_sat: 0, message: 'Demo connection format; cannot verify payment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported LND connection format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!macaroon) {
      return new Response(
        JSON.stringify({ error: 'Invalid LND connection - missing macaroon' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try multiple lookup endpoints (LND REST variations)
    let settled = false;
    let amountPaid = 0;
    let lastError = '';

    const headers = {
      'Grpc-Metadata-macaroon': macaroon,
      'Content-Type': 'application/json',
    } as Record<string, string>;

    const candidates: string[] = [];

    if (paymentHash) {
      // v2 lookup by payment hash
      candidates.push(`/v2/invoices/lookup?payment_hash=${encodeURIComponent(paymentHash)}`);
      // v1 lookup by r_hash_str
      candidates.push(`/v1/invoice/${encodeURIComponent(paymentHash)}`);
    }

    // Some LNDs support lookup by payment request as well
    if (invoice) {
      candidates.push(`/v1/payreq/${encodeURIComponent(invoice)}`);
    }

    for (const path of candidates) {
      try {
        const res = await fetch(`https://${host}:${port}${path}`, { headers });
        if (!res.ok) {
          lastError = await res.text();
          continue;
        }
        const data = await res.json();
        // Normalize different shapes
        const state = (data.state as string) || '';
        const wasSettled = data.settled === true || state.toUpperCase() === 'SETTLED' || data.is_confirmed === true || data.is_paid === true;
        const paid = Number(data.amt_paid_sat ?? data.amtPaidSat ?? data.amt_paid ?? data.value ?? 0) || 0;
        settled = !!wasSettled;
        amountPaid = paid;
        break;
      } catch (e: any) {
        lastError = e?.message || 'unknown error';
        continue;
      }
    }

    if (!settled && lastError) {
      console.log('LND verify not settled. Last error:', lastError);
    }

    return new Response(
      JSON.stringify({ settled, amount_paid_sat: amountPaid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-invoice function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});