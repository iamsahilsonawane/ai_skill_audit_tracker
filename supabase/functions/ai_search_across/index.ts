import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const model = new Supabase.ai.Session('gte-small')

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const { query } = await req.json()

  const embedding = Array.from(await model.run(query, { mean_pool: true, normalize: true }) as number[])
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: documents } = await supabase.rpc('hybrid_search', {
    query_text: query,
    query_embedding: embedding,
    match_count: 10,
  })

  return new Response(JSON.stringify(documents), {
    headers: { 'Content-Type': 'application/json' },
  })
})