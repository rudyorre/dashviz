import postgres from 'postgres';

const connection_string = process.env.SUPABASE_CONNECTION!;
const sql = postgres(connection_string);

export default sql;
