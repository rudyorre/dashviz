import express, { Express, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import sql from './db';
import postgres from 'postgres';
import cors from 'cors';

dotenv.config();

// Express setup
const app: Express = express();
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use(express.json());

// const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
// const options: cors.CorsOptions = {
//   origin: allowedOrigins
// };

// app.use(cors(options));


const PORT: number = parseInt(process.env.PORT || '3001', 10);

const supabase_url: string = process.env.SUPABASE_URL!;
const supabase_key: string = process.env.SUPABASE_KEY!;

const supabase: SupabaseClient = createClient(supabase_url, supabase_key);

const sql = postgres({
  host                 : process.env.SUPABASE_HOST!,            // Postgres ip address[s] or domain name[s]
  port                 : 5432,          // Postgres server port[s]
  database             : process.env.SUPABASE_DATABASE!,            // Name of database to connect to
  username             : process.env.SUPABASE_USERNAME!,            // Username of database user
  password             : process.env.SUPABASE_PASSWORD!,            // Password of database user
});

interface Dashboard {
    name: string,
    id: string,
      dateFilter: { 
       name: string, 
       initialDateRange: 'LAST_90_DAYS' | 'LAST_30_DAYS' | 'CURRENT_MONTH'
    }
};

interface Chart {
    name: string,
    id: string,
    dashboardName: string,
    chartType: 'line' | 'bar',
    sqlQuery: string,
    xAxisField: string,
    yAxisField: string,
    dateField: { table: string, field: string };
 };

interface ApiResponse<T> {
    data?: T;
    error?: Error;
}

// Define Routes
app.get('/', async (req, res) => {
    res.json(['hello', 'world']);
});

app.get('/test', async (req, res) => {
    res.json('just a test');
});

/**
 * Fetches a dashboard by `name` with the list of charts with the corresponing
 * `dashboardName`.
 */
app.get('/dashboard/:name', async (req: Request, res: Response) => {
    try {
        const { data: dashboard, error: dashboardError } = await supabase
            .from('dashboard')
            .select()
            .eq('name', req.params.name);

        if (dashboardError) {
            throw dashboardError;
        }

        if (!dashboard) { // When no dashboard is found
            res.status(404).json({ error: 'Dashboard not found.' });
            return;
        }

        const { data: charts, error: chartError } = await supabase
            .from('chart')
            .select()
            .eq('dashboardName', req.params.name);
        
        if (chartError) {
            throw chartError;
        }

        if (!charts) { // When no chart is found
            res.status(404).json({ error: 'No matching charts found.' });
            return;
        }
        res.json({ dashboard: dashboard[0], charts });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Fetches a chart by `id`.
 */
app.get('/chart/:id', async (req: Request, res: Response) => {
    try {
        const { data: chart, error: chartError } = await supabase
            .from('chart')
            .select()
            .eq('id', req.params.id);
        
        if (chartError) {
            throw chartError;
        }
    
        if (!chart) { // When no chart is found
            res.status(404).json({ error: 'No matching charts found.' });
            return;
        }

        res.json({ chart: chart[0] });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/fetch-dashboard-names', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('dashboard')
            .select('name')

        if (error) {
            throw error;
        }

        if (!data) {
            res.status(404).json({ error: 'No dashboards found.' });
            return;
        }

        res.send(data);
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Handle POST requests to execute custom SQL queries.
 */
app.post('/query', async (req: Request, res: Response) => {
    try {
        const sqlQuery = req.body.sqlQuery;
        
        // sanitation would go here to prevent sql injection

        const data = await sql`${sql.unsafe(sqlQuery)}`;
        res.json(data);
    } catch (error) {
        console.error('Error fetching from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Starter server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
