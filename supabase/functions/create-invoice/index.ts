import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  amount: number; // in sats
  description?: string;
  recipientAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, description, recipientAddress }: InvoiceRequest = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get LND connection details from environment
    const lndConnectAddress = Deno.env.get('LND_CONNECT_ADDRESS');
    
    if (!lndConnectAddress) {
      return new Response(
        JSON.stringify({ error: 'LND connection not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse LND connect string (lndconnect://host:port?cert=...&macaroon=...)
    const url = new URL(lndConnectAddress.replace('lndconnect://', 'https://'));
    const cert = url.searchParams.get('cert');
    const macaroon = url.searchParams.get('macaroon');

    if (!cert || !macaroon) {
      return new Response(
        JSON.stringify({ error: 'Invalid LND connection format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create invoice request
    const invoiceData = {
      value: amount.toString(),
      memo: description || `Payment of ${amount} sats`,
      expiry: "3600" // 1 hour
    };

    console.log('Creating invoice for amount:', amount);

    // Make request to LND
    const lndResponse = await fetch(`${url.origin}/v1/invoices`, {
      method: 'POST',
      headers: {
        'Grpc-Metadata-macaroon': macaroon,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!lndResponse.ok) {
      const errorText = await lndResponse.text();
      console.error('LND error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const invoice = await lndResponse.json();
    
    console.log('Invoice created successfully');

    // Generate QR code data URL
    const qrData = `lightning:${invoice.payment_request}`;
    
    return new Response(
      JSON.stringify({
        invoice: invoice.payment_request,
        payment_hash: invoice.r_hash,
        amount_sats: amount,
        qr_data: qrData,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in create-invoice function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});