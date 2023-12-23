import { DateRange } from 'react-day-picker';
import {
    addDays,
    startOfMonth,
    startOfDay,
    endOfMonth,
    subMonths,
    subDays,
    max,
    min,
    startOfToday,
    differenceInDays,
} from 'date-fns';
import { PreviousPreset } from '@/lib/types';

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
 * Calculates volume data for a given range of dates with bucketing. 90 or more
 * days will use a 30 day bucket, 28 or mroe days will use a 7 day bucket, and
 * anything less will be a single day bucket.
 *
 * @param data - An array of objects containing `currAmount` and `prevAmount`
 *  properties.
 * @param currRange - The current date range, containing `from` and `to` Date
 *  objects.
 * @returns An object containing volume information:
 *  - curr: The total current volume, aggregated based on bucketing.
 *  - prev: The total previous volume, aggregated based on bucketing.
 *  - percent: The percentage change between current and previous volume.
 */
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

/**
 * Calculates required date ranges based on a given date range and a previous period preset.
 *
 * @param dateRange - The base date range, containing `from` and `to` Date objects.
 * @param previous - The previous period preset, defining how to calculate the previous range.
 * @returns An object containing three date ranges:
 *      - currRange: The original date range, unmodified.
 *      - prevRange: The calculated previous date range based on the preset.
 *      - requiredRange: The combined range encompassing both currRange and prevRange.
 */
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
