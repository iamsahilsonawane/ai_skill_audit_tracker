import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const model = new Supabase.ai.Session('gte-small')

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_) => {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data } = await supabase
    .from('search_index')
    .select('*')
    .is('embedding', null)
    .order('created_at', { ascending: true })
    .limit(10)

  console.log(`Found ${data?.length} rows to update`)

  for (const row of data ?? []) {
    const text = `${row.title} ${row.content}`

    const embedding = await model.run(text, { mean_pool: true, normalize: true })
    console.log(`Updating embedding for ${row.id}`)

    const { error } = await supabase
      .from('search_index')
      .update({ embedding: Array.from(embedding as number[]) })
      .eq('id', row.id)
      .select()

    if (error) {
      console.error(`Error updating embedding for ${row.id}: ${error.message}`)
      continue
    }

    console.log(`Updated embedding for ${row.id}`)
  }

  return new Response('Embeddings updated', { status: 200 })
})
