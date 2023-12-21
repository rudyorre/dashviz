import dotenv from 'dotenv';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { DateRange } from 'react-day-picker';
import {
   differenceInDays,
   subDays,
   subMonths,
   startOfMonth,
   endOfMonth,
   startOfToday,
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
 * 
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
 * 
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
 * 
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

export const fetchData = async (
   range: DateRange,
   chart: Chart,
) => {
   if (!range.from || !range.to) {
       return null;
   }

   // Build SQL query
   const response = await fetchQuery(`
      SELECT * FROM
      (
      ${chart.sqlQuery}
      ) sub
      WHERE
      ${chart.dateField.field} >= '${getDateString(range.from)}'
      and ${chart.dateField.field} <= '${getDateString(range.to)}'
   `);
   return response;
};

/**
 * Assumes the `dateRange` is properly set from the date range picker / preset
 * dropdown. The `previous` dropdown will be used with the `dateRange` to
 * extend the query filter range.
 * @param dateRange 
 * @param previous 
 * @param chart 
 */
export const retrieveData = async (
   dateRange: DateRange,
   previous: PreviousPreset,
   chart: Chart
) => {
   if (!dateRange.from || !dateRange.to) {
      return null;
   }

   const currRange = {...dateRange};
   const prevRange = {...dateRange};
   const currLength: number = differenceInDays(dateRange.to, dateRange.from);
   switch (previous) {
      case PreviousPreset.PreviousPeriod:
         prevRange.from = subDays(dateRange.from, currLength);
         prevRange.to = subDays(dateRange.from, 1);
         break;
      case PreviousPreset.PreviousMonth:
         prevRange.from = startOfMonth(subMonths(startOfToday(), 1));
         prevRange.to = endOfMonth(prevRange.from);
         break;
      case PreviousPreset.Previous30Days:
         prevRange.from = subDays(dateRange.from, 30);
         prevRange.to = subDays(dateRange.from, 1);
         break;
      case PreviousPreset.Previous90Days:
         prevRange.from = subDays(dateRange.from, 90);
         prevRange.to = subDays(dateRange.from, 1);
         break;
   }

   // Query selected date ranges
   const currData = await fetchData(currRange, chart);
   const prevData = await fetchData(prevRange, chart);

   if (currData === null || prevData === null) {
      return null;
   }

   let processedData = [];
   for (let i = 0; i < Math.min(currData.length, prevData.length); i++) {
      const json = {
         pv: currData[i].amount,
         uv: prevData[i].amount,
      }
      processedData.push(json);
   }
   
   if (chart.chartType == 'bar') {
      let interval = 1;
      // TODO
      // if (selectedPreset == 'Last 90 days') {
      //    interval = 30;
      // } else {
      //    interval = 7;
      // }
   const groupedData = [];
   let tempGroup = { uv: 0, pv: 0 };

   for (let i = 0; i < processedData.length; i++) {
      tempGroup.uv += processedData[i].uv;
      tempGroup.pv += processedData[i].pv;

      if ((i + 1) % interval === 0 || i === processedData.length - 1) {
         // Add the grouped values to the result array
         groupedData.push({
         uv: tempGroup.uv / interval,
         pv: tempGroup.pv / interval,
         });

         // Reset the temporary group for the next interval
         tempGroup = { uv: 0, pv: 0 };
      }
   }
   processedData = groupedData;
   }

   return { result: processedData, currRange, prevRange };
};
