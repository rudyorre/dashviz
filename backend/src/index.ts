import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 3001;

// Subabase connection
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Define Routes
app.get('/', async (req, res) => {
    res.json(['hello', 'world']);
});

app.get('/test', async (req, res) => {
    res.json('just a test');
});

app.get('/dashboard/:name', async (req, res) => {
    // use supabase to fetch data fro the dashboard
});

app.get('/chart/:id', async (req, res) => {
    // use supabase to fetch data from the chart
});

// Starter server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
