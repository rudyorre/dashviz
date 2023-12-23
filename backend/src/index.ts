import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { DateRange } from 'react-day-picker';

import { Chart, PreviousPreset } from './types';
import {
    fetchChartById,
    fetchDashboardNames,
    fetchDashboardByName,
    fetchChartsByDashboard,
    fetchQuery,
    fetchDataByDate,
} from './supabaseClient';

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

const PORT: number = parseInt(process.env.PORT || '3001', 10);

/**
 * Fetches a dashboard by `name` with the list of charts with the corresponing
 * `dashboardName`.
 */
app.get('/dashboard/:name', async (req: Request, res: Response) => {
    try {
        const dashboard = await fetchDashboardByName(req.params.name);

        if (!dashboard) { // When no dashboard is found
            res.status(404).json({ error: 'Dashboard not found.' });
            return;
        }

        const charts = await fetchChartsByDashboard(req.params.name);

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
        const chart = await fetchChartById(req.params.id);
    
        if (!chart) { // When no chart is found
            res.status(404).json({ error: 'No matching charts found.' });
            return;
        }

        res.json({ chart: chart });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/fetch-dashboard-names', async (req: Request, res: Response) => {
    try {
        const data = await fetchDashboardNames();

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
        const data = await fetchQuery(req.body.sqlQuery);
        res.json(data);
    } catch (error) {
        console.error('Error fetching from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Fetches raw data given a date range and chart. `chartId` is used to fetch
 * the actual chart data (which contains sql queries) to shield from direct
 * frontend access.
 */
app.post('/fetch-data-by-date', async (req: Request, res: Response) => {
    try {
        const dateRange: DateRange = req.body.dateRange;
        const chartId: Chart['id'] = req.body.chartId;
        const chart = await fetchChartById(chartId);
        const response = await fetchDataByDate(dateRange, chart);
        res.json({ response });
    } catch (error) {

    }
});

// Starter server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
