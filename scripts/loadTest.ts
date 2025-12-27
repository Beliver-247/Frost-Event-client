import { createClient } from '@supabase/supabase-js'

// Ensure these resolve to strings for type-checking during Next build
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const CONCURRENCY = 200

async function simulateAudienceRead(userIdx: number) {
  const supabase = createClient(url, anon)
  const start = performance.now()

  const { data: state, error: stateErr } = await supabase
    .from('show_state')
    .select('id,current_item_id,updated_at')
    .eq('id', 1)
    .single()

  const mid = performance.now()

  if (stateErr || !state) {
    return {
      ok: false,
      userIdx,
      msState: mid - start,
      msItem: 0,
      error: stateErr?.message || 'no state',
    }
  }

  let msItem = 0
  if (state.current_item_id) {
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id,title,content')
      .eq('id', state.current_item_id)
      .single()
    const end = performance.now()
    msItem = end - mid
    if (itemErr || !item) {
      return { ok: false, userIdx, msState: mid - start, msItem, error: itemErr?.message || 'no item' }
    }
  }

  return {
    ok: true,
    userIdx,
    msState: mid - start,
    msItem,
  }
}

async function main() {
  console.log(`Starting load test: ${CONCURRENCY} concurrent users`)
  const tasks = Array.from({ length: CONCURRENCY }, (_, i) => simulateAudienceRead(i + 1))
  const results = await Promise.all(tasks)

  const successes = results.filter(r => r.ok)
  const failures = results.filter(r => !r.ok)

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const msStateList = successes.map(r => r.msState)
  const msItemList = successes.map(r => r.msItem)

  console.log('\nResults:')
  console.log({
    total: results.length,
    successes: successes.length,
    failures: failures.length,
    avgMsState: Math.round(avg(msStateList)),
    avgMsItem: Math.round(avg(msItemList)),
    p95MsState: Math.round(msStateList.sort((a,b)=>a-b)[Math.floor(msStateList.length*0.95)] || 0),
    p95MsItem: Math.round(msItemList.sort((a,b)=>a-b)[Math.floor(msItemList.length*0.95)] || 0),
  })

  if (failures.length) {
    console.log('\nSample failures (up to 5):')
    failures.slice(0,5).forEach(f => console.log(`User ${f.userIdx}: ${f.error}`))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
