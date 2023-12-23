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
    min,
    startOfToday,
    isEqual,
    differenceInDays,
} from 'date-fns';
import { Chart, PreviousPreset, CurrentPreset } from '@/lib/types';

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

export const getVolume = (data: any, currRange: DateRange) => {
  console.log(currRange);
  if (!currRange.from || !currRange.to) {
    return { curr: 0, prev: 0, percent: 0 };
  }
  const chartWidth = differenceInDays(currRange.to, currRange.from) + 1;
  let bucketSize = 0;
  if (chartWidth >= 90) {
    bucketSize = 30;
  } else if (chartWidth >= 28) {
    bucketSize = 7;
  } else {
    bucketSize = 1;
  }
  let curr = [];
  let prev = [];
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i]['currAmount'] && curr.length < bucketSize) {
      curr.push(data[i]['currAmount']);
    }
    if (data[i]['prevAmount'] && prev.length < bucketSize) {
      prev.push(data[i]['prevAmount']);
    }
  }
  curr = curr.reduce((acc, a) => acc + a, 0);
  prev = prev.reduce((acc, a) => acc + a, 0);
  const percent = (prev != 0) ? Math.round((curr - prev) / prev * 100) : 0;
  return { curr, prev, percent };
};

export const getRequiredDateRanges = (
  dateRange: { from: Date, to: Date }, previous: PreviousPreset
) => {
  const currRange = {...dateRange};
  const prevRange = {...dateRange};
  const currLength: number = differenceInDays(dateRange.to, dateRange.from) + 1;
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
  const requiredRange = {
    from: min([currRange.from, prevRange.from]),
    to: max([currRange.to, prevRange.from])
  };
  return { currRange, prevRange, requiredRange };
};

/**
 * Groups data based on current and previous date ranges, aligning amounts for comparison.
 *
 * @param data - Array of objects with `dateField` (Date) and `amount` (number) properties.
 * @param prevRange - Object representing the previous date range, with `from` and `to` (Date) properties.
 * @param currRange - Object representing the current date range, with `from` and `to` (Date) properties.
 * @returns Array of objects with `currDateField`, `currAmount`, `prevDateField`, and `prevAmount` properties.
 */
export const groupData = (
  data: { dateField: Date; amount: number }[],
  prevRange: { from: Date; to: Date },
  currRange: { from: Date; to: Date }
): {
  currDateField: Date,
  currAmount: number,
  prevDateField: Date | undefined,
  prevAmount: number | undefined,
}[] => {
  if (!prevRange.from || !prevRange.to || !currRange.from || !currRange.to) {
    return [];
  }

  const currData: { dateField: Date, amount: number }[] = [];
  const prevData: { dateField: Date, amount: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const date = addDays(startOfDay(new Date(data[i].dateField)), 1);
    if (date >= currRange.from && date <= currRange.to) {
      currData.push({
        dateField: date,
        amount: data[i].amount,
      });
    }
    if (date >= prevRange.from && date <= prevRange.to) {
      prevData.push({
        dateField: date,
        amount: data[i].amount,
      });
    }
  }

  const groupedData: {
    currDateField: Date,
    currAmount: number,
    prevDateField: Date | undefined,
    prevAmount: number | undefined,
  }[] = [];
  for (let i = 0; i < currData.length; i++) {
    groupedData.push({
      currDateField: currData[i].dateField,
      currAmount: currData[i].amount,
      prevDateField: (prevData.length > i) ? prevData[i].dateField : undefined,
      prevAmount: (prevData.length > i) ? prevData[i].amount : undefined,
    });
  }

  return groupedData;
};
