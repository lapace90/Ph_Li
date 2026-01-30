// Supabase Edge Function : Clôture automatique des offres expirées
// À exécuter via un cron job (ex: tous les jours à 2h du matin)
//
// Pour configurer le cron dans Supabase:
// 1. Aller dans le Dashboard Supabase > Database > Extensions > pg_cron
// 2. Activer l'extension pg_cron
// 3. Créer un job:
//    SELECT cron.schedule('close-expired-offers', '0 2 * * *', $$SELECT close_expired_offers()$$);
//
// Ou utiliser cette Edge Function avec un service externe (cron-job.org, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérification du secret pour sécuriser l'endpoint
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec les clés d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Appeler la fonction SQL qui clôture les offres expirées
    const { data, error } = await supabase.rpc('close_expired_offers')

    if (error) {
      console.error('Error closing expired offers:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const closedCount = data || 0
    console.log(`Closed ${closedCount} expired offers`)

    return new Response(
      JSON.stringify({
        success: true,
        closedCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
