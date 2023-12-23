import dotenv from 'dotenv';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { DateRange } from 'react-day-picker';
import {
   startOfDay,
} from 'date-fns';

import { Chart, PreviousPreset } from './types';

dotenv.config();

const supabase_url: string = process.env.SUPABASE_URL!;
const supabase_key: string = process.env.SUPABASE_KEY!;
const supabase: SupabaseClient = createClient(supabase_url, supabase_key);

const sql = postgres({
   host                 : process.env.SUPABASE_HOST!,
   port                 : 5432,
   database             : process.env.SUPABASE_DATABASE!,
   username             : process.env.SUPABASE_USERNAME!,
   password             : process.env.SUPABASE_PASSWORD!,
 });

/**
 * Create a separate function for chart retrieval
 * @param id 
 * @returns 
 */
export const fetchChartById = async (id: string): Promise<Chart> => {
   try {
      const { data: chart, error: chartError } = await supabase
         .from('chart')
         .select()
         .eq('id', id);

      if (chartError) {
         throw chartError;
      }

      return chart?.[0]; // Return the first chart if found
   } catch (error) {
      console.error('Error fetching chart:', error);
      throw error;
   }
};

/**
 * Fetch all dashboard names.
 * @returns 
 */
export const fetchDashboardNames = async () => {
   try {
      const { data, error } = await supabase
         .from('dashboard')
         .select('name')
   
      if (error) {
         throw error;
      }

      return data;
   } catch (error) {
      console.error('Error fetching dashboards:', error);
      throw error;
   }
};

/**
 * 
 * @param name 
 * @returns 
 */
export const fetchDashboardByName = async (name: string) => {
   try {
      const { data: dashboard, error: dashboardError } = await supabase
         .from('dashboard')
         .select()
         .eq('name', name);

      if (dashboardError) {
         throw dashboardError;
      }

      return dashboard;
   } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
   }
};

/**
 * Fetches charts by dashboard name.
 * @param name 
 * @returns 
 */
export const fetchChartsByDashboard = async (name: string) => {
   try {
      const { data: charts, error: chartError } = await supabase
         .from('chart')
         .select()
         .eq('dashboardName', name);
      
      if (chartError) {
         throw chartError;
      }

      return charts;
   } catch (error) {
      console.error('Error fetching charts:', error);
      throw error;
   }
};

/**
 * Fetches data with a SQL query.
 * @param sqlQuery 
 * @returns 
 */
export const fetchQuery = async (sqlQuery: string) => {
   try {
      const data = await sql`${sql.unsafe(sqlQuery)}`;
      return data;
   } catch (error) {
      console.error('Error running query:', error);
      throw error;
   }
};

/**
 * Formats a Date object into a string in the 'YYYY-MM-DD' format.
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} A string representing the formatted date.
 */
export const getDateString = (date: Date): string => {
   date = startOfDay(date);
   const year = date.toLocaleString('default', { year: 'numeric' });
   const month = date.toLocaleString('default', { month: '2-digit' });
   const day = date.toLocaleString('default', { day: '2-digit' });
   return year + '-' + month + '-' + day;
};

/**
 * Fetches data from a database for a specific date range, tailored for a given chart.
 *
 * @param dateRange - The date range to filter the data, containing `from` and `to` Date objects.
 * @param chart - Chart configuration object containing:
 *      - sqlQuery: The base SQL query to execute.
 *      - dateField: An object with a `field` property specifying the name of the date field in the database.
 * @returns An array of objects with `amount` and `dateField` properties, or null if the date range is invalid.
 * @throws Error if the database query fails.
 */
export const fetchDataByDate = async (
   dateRange: DateRange,
   chart: Chart,
) => {
   if (!dateRange.from || !dateRange.to) {
      return null;
   }

   // Build SQL query
   const response = await fetchQuery(`
      SELECT * FROM
      (
      ${chart.sqlQuery}
      ) sub
      WHERE
      ${chart.dateField.field} >= '${getDateString(dateRange.from)}'
      and ${chart.dateField.field} <= '${getDateString(dateRange.to)}'
   `);

   let processedData = [];
   for (let i = 0; i < Math.min(response.length, response.length); i++) {
      const json = {
         amount: response[i].amount,
         dateField: response[i][chart.dateField.field],
      };
      
      processedData.push(json);
   }
   
   return processedData;
};
