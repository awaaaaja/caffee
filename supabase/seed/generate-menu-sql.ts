import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

type SeedItem = {
  name: string
  category_slug: string
  price: number
  description: string | null
  TODO_VERIFY: boolean
  TODO_VERIFY_REASON: string | null
}

type SeedData = { items: SeedItem[] }

const here = dirname(fileURLToPath(import.meta.url))
const seedPath = join(here, '../../data/menu.seed.json')
const outPath = join(here, 'menu_items.sql')

const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as SeedData
const verified = seed.items.filter((i) => !i.TODO_VERIFY)
const skipped = seed.items.length - verified.length

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const esc = (s: string) => s.replace(/'/g, "''")

const slugs = new Set<string>()
const rows = verified.map((i) => {
  const slug = slugify(i.name)
  if (slugs.has(slug)) throw new Error(`duplicate slug: ${slug}`)
  slugs.add(slug)
  const desc = i.description ? `'${esc(i.description)}'` : 'null'
  return `  ((select id from categories where slug = '${i.category_slug}'), '${esc(i.name)}', '${slug}', ${desc}, ${i.price})`
})

const sql = `-- GENERATED dari data/menu.seed.json — JANGAN edit manual.
-- Re-generate: npm run seed:menu

insert into menu_items (category_id, name, slug, description, price)
values
${rows.join(',\n')}
on conflict (slug) do update
  set category_id = excluded.category_id,
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      updated_at = now();
`

writeFileSync(outPath, sql)
console.log(`menu_items.sql: ${verified.length} item terverifikasi di-generate, ${skipped} item TODO_VERIFY dilewati`)
