'use client';

import { 
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

import {
  addDays,
  startOfMonth,
  startOfDay,
  endOfDay,
  endOfMonth,
  subMonths,
  subDays,
  max,
} from 'date-fns';

import { DateRangePicker } from '@/components/dateRangePicker';
import { Dropdown } from '@/components/dropdown';
import { Button } from '@/components/ui/button';

import { useState, useEffect } from 'react';
import { SelectContent } from '@radix-ui/react-select';

const initial_data = [
    {
      name: 'Page A',
      uv: 4000,
      pv: 2400,
      // amt: 2400,
    },
    {
      name: 'Page B',
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      // name: 'Page E',
      uv: 1890,
      pv: 4800,
      // amt: 2181,
    },
    {
      // name: 'Page F',
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

const presetDropdown = [
  'Last 90 days',
  'Last 30 days',
  'Current Month',
];

const previousDropdown = [
  'Previous 90 days',
  'Previous 30 days',
  'Previous Month',
  'Previous Period',
];

/**
 * Formats a Date object into a string in the 'YYYY-MM-DD' format.
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} A string representing the formatted date.
 */
const getDateString = (date: Date): string => {
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });
  return year + '-' + month + '-' + day;
};

export function Dashboard({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
  const initialStartDate = new Date('01 January 2023');
  const initialEndDate = new Date('31 December 2023');

  const [data, setData] = useState(initial_data);
  const [dateRange, setDateRange] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('Current Month');
  const [selectedPrevious, setSelectedPrevious] = useState<string>('Previous Period');

  const [chartDates, setChartDates] = useState({
    currStart: dateRange.startDate,
    currEnd: dateRange.endDate,
    prevStart: dateRange.startDate,
    prevEnd: dateRange.endDate,
  });

  const [chart, setChart] = useState({
    id: 'id1',
    dashboardName: 'Linear Transaction Data (Line Chart)',
    chartType: 'line',
    sqlQuery: 'select * from transactions_linear',
  });

  const [chartName, setChartName] = useState(chart.dashboardName);

  const [chartType, setChartType] = useState(chart.chartType);
  
  const handlePresetChange = (selectedOption: string) => {
    setSelectedPreset(selectedOption);
    // Do something with the selected preset, e.g., update your chart data
    console.log(`Selected preset: ${selectedOption}`);
  };

  const handleChartChange = async (selectedOption: string) => {
    // Make query
    const response = await fetch(`http://localhost:3001/chart/${selectedOption}`);
    let raw = await response.json();
    raw = raw.chart[0];
    setChart({
      id: selectedOption,
      dashboardName: raw.dashboardName,
      chartType: raw.chartType,
      sqlQuery: raw.sqlQuery,
    });
  }

  const handlePreviousChange = (selectedOption: string) => {
    setSelectedPrevious(selectedOption);
    // Do something with the selected preset, e.g., update your chart data
    console.log(`Selected previous: ${selectedOption}`);
  };

  const handleClick = async () => {
    if (typeof dateRange.startDate == 'undefined' || typeof dateRange.endDate == 'undefined') {
      return;
    }
    const result = await getData(
      dateRange.startDate,
      dateRange.endDate,
    );
    setData(result);
    setChartType(chart.chartType);
    setChartName(chart.dashboardName);
  };

  const handleDateRangeChange = async (startDate: any, endDate: any) => {
    if (typeof startDate == 'undefined' || typeof endDate == 'undefined') {
      return;
    }

    setDateRange({
      startDate: startDate,
      endDate: endDate,
    });
  };

  const fetchData = async (startDate: string, endDate: string) => {
    // Build SQL query
    const sqlQuery = `
      ${chart.sqlQuery}
      WHERE
        created_at >= '${startDate}'
        and created_at <= '${endDate}'
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
  }

  // convert to two parameters of DateRange type
  const getData = async (
    startDate: Date,
    endDate: Date,
  ) => {
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
    console.log(getDateString(currStartDate), getDateString(startDate), getDateString(max([currStartDate, startDate])));
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

    console.log(selectedPreset, selectedPrevious);
    console.log(currStartDate, currEndDate);
    console.log(prevStartDate, prevEndDate);
    
    if (
      currStartDate &&
      currEndDate &&
      prevStartDate &&
      prevEndDate
    ) {
      setChartDates({
        currStart: currStartDate,
        currEnd: currEndDate,
        prevStart: prevStartDate,
        prevEnd: prevEndDate,
      });
    }

    // Query selected date ranges
    const currData = await fetchData(
      getDateString(currStartDate),
      getDateString(currEndDate)
    );
    const prevData = await fetchData(
      getDateString(prevStartDate),
      getDateString(prevEndDate)
    );
    console.log(currData);
    console.log(prevData);
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

    return processedData;
  };

  const getVolume = () => {
    console.log('getvolume');
    console.log(data);
    let curr = 0;
    let prev = 0;
    for (let i = 0; i < data.length; i++) {
      curr += data[i]['pv'];
      prev += data[i]['uv'];
    }
    const percent = Math.round((curr - prev) / prev * 100);
    return { curr, prev, percent };
  };

  useEffect(() => {
    (async () => {
      const result = await getData(
        dateRange.startDate,
        dateRange.endDate,
      );
      setData(result);
    })();
  }, []);

  return (<>
    <div style={{ display: 'flex', gap: '10px' }} className="items-center mt-8">
      <Dropdown options={['id4', 'id3', 'id2', 'id1']} onSelect={handleChartChange} />
      <DateRangePicker onChange={handleDateRangeChange}/>
      <Dropdown options={presetDropdown} onSelect={handlePresetChange} />
      <p className="text-gray-500">compared to</p>
      <Dropdown options={previousDropdown} onSelect={handlePreviousChange}/>
      <Button onClick={handleClick}>Update</Button>
    </div>

    <div className="w-screen sm:w-3/5 mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{chartName}</h2>
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
          <p className="text-indigo-600">{Math.round(getVolume()['curr'])}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Change</p>
          {
            getVolume()['percent'] > 0
              ? <p className="text-green-500">+{getVolume()['percent']}%</p>
              : <p className="text-red-500">{getVolume()['percent']}%</p>
          }
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
          <p className="text-gray-500">{Math.round(getVolume()['prev'])}</p>
        </div>
      </div>
    </div>
    
    <ResponsiveContainer width="60%" minWidth={400} aspect={1.5}>
        {chartType == 'line' ?
          <LineChart
              width={500}
              height={300}
              data={data}
              margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
              }}
          >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis type="number" domain={['auto', 'auto']}/>
              <Tooltip />
              <Legend />
              <Line
                  name="Current"
                  type="monotone"
                  dataKey="pv"
                  stroke="#566CD6"
                  activeDot={{ r: 8 }}
              />
              <Line
                  name="Previous"
                  type="monotone"
                  dataKey="uv"
                  stroke="#727889"
              />
          </LineChart>
          :
          <BarChart
              width={500}
              height={300}
              data={data}
              margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
              }}
          >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis type="number" domain={['auto', 'auto']}/>
              <Tooltip />
              <Legend />
              <Bar
                  name="Current"
                  dataKey="pv"
                  fill="#566CD6"
              />
              <Bar
                  name="Previous"
                  dataKey="uv"
                  fill="#727889"
              />
          </BarChart>
        }
    </ResponsiveContainer>
    <div className="w-screen sm:w-3/5 mb-8">
      <div className="flex justify-between text-sm mt-2">
        <span className="text-indigo-600">{chartDates.currStart.toDateString()}</span>
        <span className="text-indigo-600">{chartDates.currEnd.toDateString()}</span>
      </div>
      <div className="flex justify-between text-sm mt-2">
        <span className="text-gray-500">{chartDates.prevStart.toDateString()}</span>
        <span className="text-gray-500">{chartDates.prevEnd.toDateString()}</span>
      </div>
    </div>
  </>);
}