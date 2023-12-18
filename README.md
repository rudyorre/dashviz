# Dash
<p float="left">
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white"/>
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next-black?style=flat&logo=next.js&logoColor=white" />
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white" />
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB" />
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" />
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=flat&logo=postgresql&logoColor=white" />
  </a>
  <a href="https://vercel.com/">
    <img src="https://img.shields.io/badge/Vercel-%23000000.svg?style=flat&logo=vercel&logoColor=white" />
  </a>
</p>
A simple dashboard interface for line and bar charts.

## Supabase Config

### Dummy Data Generators
```sql
INSERT INTO transactions (id, amount, created_at, description)
SELECT
    md5(random()::text),
    random() * 1000,
    generate_series('2022-01-01'::timestamp, '2022-12-31'::timestamp, '1 day') AS created_at,
    'Description' AS description
```

### Extensions
Aside from the default extensions, I enabled
[pg_jsonschema](https://github.com/supabase/pg_jsonschema) which enables
JSON schema validation for `json` and `jsonb` data types.

## Assumptions
- Unique columns in postgres tables:
  - `dashboard`: `name`, `id`
  - `chart`: `name`, `id`