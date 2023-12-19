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
  startOfToday,
  isEqual,
} from 'date-fns';
import { DateRange } from 'react-day-picker';

import { DateRangePicker } from '@/components/dateRangePicker';
import { Dropdown } from '@/components/dropdown';
import { Button } from '@/components/ui/button';

import { useState, useEffect } from 'react';
import { SelectContent } from '@radix-ui/react-select';

import { getDateString, fetchData, getData, getVolume } from '@/lib/dashboardUtils';
import { Chart } from '@/lib/types';

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

export function Dashboard({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [data, setData] = useState<any>(initial_data);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date('01 January 2023'),
    to: new Date('31 December 2023'),
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('Current Month');
  const [selectedPrevious, setSelectedPrevious] = useState<string>('Previous Period');

  const [chartDates, setChartDates] = useState({
    currStart: dateRange.from,
    currEnd: dateRange.to,
    prevStart: dateRange.from,
    prevEnd: dateRange.to,
  });

  const [chart, setChart] = useState<Chart>({
    id: 'id1',
    dashboardName: 'Linear Transaction Data (Line Chart)',
    chartType: 'line',
    sqlQuery: 'select * from transactions_linear',
  });

  const [chartName, setChartName] = useState(chart.dashboardName);

  const [chartType, setChartType] = useState(chart.chartType);
  
  const handlePresetChange = (selectedOption: string) => {
    setSelectedPreset(selectedOption);
    let from: Date;
    switch (selectedOption) {
      case 'Current Month':
        from = startOfMonth(startOfToday());
        break;
      case 'Last 30 days':
        from = subDays(startOfToday(), 30);
        break;
      case 'Last 90 days':
        from = subDays(startOfToday(), 90);
        break;
      default:
        from = startOfToday();
        break;
    }
    setDateRange({
      from: from,
      to: startOfToday(),
    });
    handleClick();
  };

  const handleChartChange = async (selectedOption: string) => {
    try {
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
    } catch (error) {
      throw error;
    } finally {
      await handleClick();
    }
  }

  const handlePreviousChange = (selectedOption: string) => {
    setSelectedPrevious(selectedOption);
    // Do something with the selected preset, e.g., update your chart data
    handleClick();
  };

  const handleClick = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return null;
    }
    const { result, currRange, prevRange }: any = await getData(dateRange, selectedPreset, selectedPrevious, chart);
    if (
      currRange.from &&
      currRange.to &&
      prevRange.from &&
      prevRange.to
    ) {
      setChartDates({
        currStart: currRange.from,
        currEnd: currRange.to,
        prevStart: prevRange.from,
        prevEnd: prevRange.to,
      });
    }
    setData(result);
    setChartType(chart.chartType);
    setChartName(chart.dashboardName);
  };

  const handleDateRangeChange = async (selectedDateRange: DateRange) => {
    setDateRange(selectedDateRange);
    let from: Date;
    switch (selectedPreset) {
      case 'Current Month':
        from = startOfMonth(startOfToday());
        break;
      case 'Last 30 days':
        from = subDays(startOfToday(), 30);
        break;
      case 'Last 90 days':
        from = subDays(startOfToday(), 90);
        break;
      default:
        from = startOfToday();
        break;
    }
    const to: Date = startOfToday();
    if (
      selectedDateRange.from &&
      selectedDateRange.to &&
      isEqual(startOfDay(selectedDateRange.from), from) &&
      isEqual(startOfDay(selectedDateRange.to), to)
    ) {
      return null;
    }
    
    setSelectedPreset('Select');
    handleClick();
  };

  useEffect(() => {
    handleClick();
  }, []);

  return (<>
    <div style={{ display: 'flex', gap: '10px' }} className="items-center mt-8">
      <Dropdown
        options={['id4', 'id3', 'id2', 'id1']}
        onSelect={handleChartChange}
        placeholder={'id1'}
      />
      <DateRangePicker
        onChange={handleDateRangeChange}
        dateRange={dateRange}
      />
      <Dropdown
        options={presetDropdown}
        onSelect={handlePresetChange}
        value={selectedPreset}
      />
      <p className="text-gray-500">compared to</p>
      <Dropdown
        options={previousDropdown}
        onSelect={handlePreviousChange}
        placeholder={selectedPrevious}
      />
      <Button onClick={handleClick}>Update</Button>
    </div>

    <div className="w-screen sm:w-3/5 mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{chartName}</h2>
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
          <p className="text-indigo-600">{Math.round(getVolume(data)['curr'])}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Change</p>
          {
            getVolume(data)['percent'] > 0
              ? <p className="text-green-500">+{getVolume(data)['percent']}%</p>
              : <p className="text-red-500">{getVolume(data)['percent']}%</p>
          }
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
          <p className="text-gray-500">{Math.round(getVolume(data)['prev'])}</p>
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
        <span className="text-indigo-600">{chartDates.currStart?.toDateString()}</span>
        <span className="text-indigo-600">{chartDates.currEnd?.toDateString()}</span>
      </div>
      <div className="flex justify-between text-sm mt-2">
        <span className="text-gray-500">{chartDates.prevStart?.toDateString()}</span>
        <span className="text-gray-500">{chartDates.prevEnd?.toDateString()}</span>
      </div>
    </div>
  </>);
}