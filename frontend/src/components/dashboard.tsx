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

import { useState, useEffect, useRef } from 'react';

import { getData, getVolume } from '@/lib/dashboardUtils';
import { Chart, Dashboard as DashboardType } from '@/lib/types';
import { StringToBoolean } from 'class-variance-authority/types';

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

interface DashboardProps {
  name: string,
  containerStyle: React.CSSProperties,
  onClickDashboardItem: (dashboardItem: Chart) => void,
};

export function Dashboard({
  name,
  containerStyle,
  onClickDashboardItem,
}: DashboardProps) {
  const prevNameRef = useRef<string | null>(null);

  const [data, setData] = useState<any>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('Current Month');
  const [selectedPrevious, setSelectedPrevious] = useState<string>('Previous Period');

  const [charts, setCharts] = useState<Chart[]>([]);

  const [chartDates, setChartDates] = useState({
    currStart: dateRange.from,
    currEnd: dateRange.to,
    prevStart: dateRange.from,
    prevEnd: dateRange.to,
  });

  const [chart, setChart] = useState<Chart>({
    name: 'name1',
    id: 'id1',
    dashboardName: 'Linear Transaction Data (Line Chart)',
    chartType: 'line',
    sqlQuery: 'select * from transactions_linear',
    xAxisField: 'x-axis',
    yAxisField: 'y-axis',
    dateField: { table: 'transactions_linear', field: 'created_at'},
  });

  const [chartName, setChartName] = useState(chart.dashboardName);

  const [chartType, setChartType] = useState(chart.chartType);
  
  const handlePresetChange = async (selectedOption: string) => {
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
    await handleClick();
  };

  const handleChartChange = async (selectedOption: string) => {
    try {
      // Make query
      const response = await fetch(`http://localhost:3001/chart/${selectedOption}`);
      let raw = await response.json();
      raw = raw.chart[0];
      setChart({
        name: '',
        id: selectedOption,
        dashboardName: raw.dashboardName,
        chartType: raw.chartType,
        sqlQuery: raw.sqlQuery,
        xAxisField: '',
        yAxisField: '',
        dateField: { table: '', field: '' },
      });
    } catch (error) {
      throw error;
    } finally {
      await handleClick();
    }
  }

  const handlePreviousChange = async (selectedOption: string) => {
    setSelectedPrevious(selectedOption);
    // Do something with the selected preset, e.g., update your chart data
    await handleClick();
  };

  const handleClick = async () => {
    // console.log(dateRange.from?.toDateString(), '-', dateRange.to?.toDateString());
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
    await handleClick();
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetch(`http://localhost:3001/dashboard/${name}`);
      const json = await data.json();
      setCharts(json.charts);
      const dashboard: DashboardType = json.dashboard;
      const preset = {
        'LAST_90_DAYS': 'Last 90 days',
        'LAST_30_DAYS': 'Last 30 days',
        'CURRENT_MONTH': 'Current Month',
      }[dashboard.dateFilter.initialDateRange];
      handlePresetChange(preset);
    };

    if (name !== prevNameRef.current) {
      fetchData();
      prevNameRef.current = name;
    }
    handleClick();
  }, [dateRange, chart, selectedPrevious, charts, name]);

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