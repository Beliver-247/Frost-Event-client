import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  const file = path.resolve(process.cwd(), 'data/items.json')
  if (!fs.existsSync(file)) {
    console.error('data/items.json not found. Copy data/items.example.json to data/items.json and edit it.')
    process.exit(1)
  }
  const raw = fs.readFileSync(file, 'utf-8')
  const items = JSON.parse(raw)
  if (!Array.isArray(items)) {
    console.error('items.json must be an array')
    process.exit(1)
  }

  for (const it of items) {
    const row = {
      id: it.id || crypto.randomUUID(),
      order_index: it.order_index,
      title: it.title,
      type: it.type,
      language: it.language,
      content: it.content,
    }
    const { error } = await supabase.from('items').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error('Upsert failed for', row.title, error.message)
      process.exitCode = 1
    } else {
      console.log('Upserted', row.title)
    }
  }
  console.log('Import finished')
}

main().catch((e) => { console.error(e); process.exit(1) })
