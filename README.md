# dash

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