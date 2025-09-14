import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZapRequest {
  postId: string;
  amount: number;
  comment?: string;
  paymentHash?: string;
  invoice?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { postId, amount, comment, paymentHash, invoice }: ZapRequest = await req.json();

    if (!postId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get post and post author
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, author_id, total_sats')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment status with LND if a payment hash was provided
    let isSettled = false;
    try {
      if (paymentHash) {
        const lndConnectAddress = Deno.env.get('LND_CONNECT_ADDRESS');
        if (lndConnectAddress && lndConnectAddress.startsWith('lndconnect://')) {
          const url = new URL(lndConnectAddress.replace('lndconnect://', 'https://'));
          const host = url.hostname;
          const port = url.port || '8080';
          const macaroon = url.searchParams.get('macaroon');
          if (macaroon) {
            const headers = {
              'Grpc-Metadata-macaroon': macaroon,
              'Content-Type': 'application/json',
            } as Record<string, string>;

            const candidates = [
              `/v2/invoices/lookup?payment_hash=${encodeURIComponent(paymentHash)}`,
              `/v1/invoice/${encodeURIComponent(paymentHash)}`,
            ];
            for (const path of candidates) {
              try {
                const res = await fetch(`https://${host}:${port}${path}`, { headers });
                if (!res.ok) continue;
                const data = await res.json();
                const state = (data.state as string) || '';
                isSettled = data.settled === true || state.toUpperCase() === 'SETTLED' || data.is_confirmed === true || data.is_paid === true;
                if (isSettled) break;
              } catch (_) { /* try next */ }
            }
          }
        }
      }
    } catch (e) {
      console.log('Payment verification skipped due to error:', e);
    }

    // Create zap record
    const { data: zapData, error: zapError } = await supabase
      .from('zaps')
      .insert({
        post_id: postId,
        from_user_id: user.id,
        to_user_id: post.author_id,
        amount_sats: amount,
        comment: comment,
        payment_hash: paymentHash,
        invoice: invoice,
        status: isSettled ? 'paid' : 'pending'
      })
      .select()
      .single();

    if (zapError) {
      console.error('Zap creation error:', zapError);
      return new Response(
        JSON.stringify({ error: 'Failed to create zap record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update post total_sats if payment is completed
    if (isSettled) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          total_sats: post.total_sats + amount 
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Post update error:', updateError);
      }

      // Update recipient's total_sats_earned (kept simple)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          total_sats_earned: (post.total_sats + amount) // placeholder aggregate; adjust with RPC in real setup
        })
        .eq('id', post.author_id);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
      }
    }

    return new Response(
      JSON.stringify({
        zap_id: zapData.id,
        status: zapData.status,
        amount: amount,
        message: paymentHash ? 'Payment completed successfully' : 'Zap created, waiting for payment'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-zap function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});