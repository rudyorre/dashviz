import { DateRange } from 'react-day-picker';
import {
    addDays,
    startOfMonth,
    startOfDay,
    endOfDay,
    endOfMonth,
    subMonths,
    subDays,
    max,
    startOfToday,
    isEqual,
} from 'date-fns';
import { Chart } from '@/lib/types';

/**
 * Formats a Date object into a string in the 'YYYY-MM-DD' format.
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} A string representing the formatted date.
 */
export const getDateString = (date: Date): string => {
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
    const sqlQuery = `
      SELECT * FROM
      (
        ${chart.sqlQuery}
      ) sub
      WHERE
        created_at >= '${getDateString(range.from)}'
        and created_at <= '${getDateString(range.to)}'
    `;
  
    // Make query
    const response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: sqlQuery }),
      });
  
    if (!response.ok) {
      throw new Error(`Error fetching data from server: ${response.statusText}`);
    }
    const contentType = response.headers.get('Content-Type');
  
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Unexpected Content-Type: ${contentType}`);
    }
    const raw_data = await response.json();
    return raw_data;
};

// convert to two parameters of DateRange type
export const getData = async (
    dateRange: DateRange,
    selectedPreset: string,
    selectedPrevious: string,
    chart: Chart
) => {
    if (!dateRange.from || !dateRange.to) {
      return null;
    }
    const startDate = dateRange.from;
    const endDate = dateRange.to;

    let currStartDate = startDate;
    let currEndDate = endDate;

    switch (selectedPreset) {
      case 'Current Month':
        currStartDate = startOfMonth(endDate);
        break;
      case 'Last 30 days':
        currStartDate = subDays(endDate, 29);
        break;
      case 'Last 90 days':
        currStartDate = subDays(endDate, 89);
        break;
    }
    
    currStartDate = max([currStartDate, startDate]);

    let prevStartDate = currStartDate;
    let prevEndDate = currEndDate;

    switch (selectedPrevious) {
      case 'Previous Period':
        switch (selectedPreset) {
          case 'Current Month':
            prevStartDate = startOfMonth(subMonths(currStartDate, 1));
            prevEndDate = endOfMonth(subMonths(currEndDate, 1));
            break;
          case 'Last 30 days':
            prevStartDate = subDays(currStartDate, 30);
            prevEndDate = subDays(currStartDate, 1);
            break;
          case 'Last 90 days':
            prevStartDate = subDays(currStartDate, 90);
            prevEndDate = subDays(currStartDate, 1);
            break;
        }
        break;
      case 'Previous Month':
        prevStartDate = startOfMonth(subMonths(currStartDate, 1));
        prevEndDate = endOfMonth(subMonths(currEndDate, 1));
        break;
      case 'Previous 30 days':
        prevStartDate = subDays(currStartDate, 30);
        prevEndDate = subDays(currStartDate, 1);
        break;
      case 'Previous 90 days':
        prevStartDate = subDays(currStartDate, 90);
        prevEndDate = subDays(currStartDate, 1);
        break;
    }

    // Query selected date ranges
    const currData = await fetchData({ from: currStartDate, to: currEndDate }, chart);
    const prevData = await fetchData({ from: prevStartDate, to: prevEndDate }, chart);

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
      if (selectedPreset == 'Last 90 days') {
        interval = 30;
      } else {
        interval = 7;
      }
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

    const currRange: DateRange = { from: currStartDate, to: currEndDate };
    const prevRange: DateRange = { from: prevStartDate, to: prevEndDate };

    return { result: processedData, currRange, prevRange };
};

export const getVolume = (data: any) => {
    let curr = 0;
    let prev = 0;
    for (let i = 0; i < data.length; i++) {
      curr += data[i]['pv'];
      prev += data[i]['uv'];
    }
    const percent = Math.round((curr - prev) / prev * 100);
    return { curr, prev, percent };
};