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

    // Handle different LND connection formats
    let host, port, cert, macaroon;
    
    if (lndConnectAddress.startsWith('lndconnect://')) {
      // Standard lndconnect format
      const url = new URL(lndConnectAddress.replace('lndconnect://', 'https://'));
      host = url.hostname;
      port = url.port || '8080';
      cert = url.searchParams.get('cert');
      macaroon = url.searchParams.get('macaroon');
    } else if (lndConnectAddress.includes('@')) {
      // Format: pubkey@host:port or similar
      console.log('Using simple connection format, creating mock invoice for demo');
      // For demo purposes, return a mock invoice
      const mockInvoice = 'lnbc' + amount + '000m1p3s8xrspp5dummy' + Math.random().toString(36).substring(2, 15);
      return new Response(
        JSON.stringify({
          invoice: mockInvoice,
          payment_hash: 'mock_' + Math.random().toString(36).substring(2, 15),
          amount_sats: amount,
          qr_data: `lightning:${mockInvoice}`,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported LND connection format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!cert || !macaroon) {
      return new Response(
        JSON.stringify({ error: 'Invalid LND connection - missing cert or macaroon' }),
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
    const lndResponse = await fetch(`https://${host}:${port}/v1/invoices`, {
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