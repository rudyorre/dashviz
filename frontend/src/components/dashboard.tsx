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
import { Chart as ChartType, Dashboard as DashboardType } from '@/lib/types';
import { StringToBoolean } from 'class-variance-authority/types';

import { Chart } from '@/components/chart';

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
  onClickDashboardItem: (dashboardItem: ChartType) => void,
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

  const [charts, setCharts] = useState<ChartType[]>([]);

  const [chartDates, setChartDates] = useState({
    currStart: dateRange.from,
    currEnd: dateRange.to,
    prevStart: dateRange.from,
    prevEnd: dateRange.to,
  });

  const [chart, setChart] = useState<ChartType>({
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
      raw = raw.chart;
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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Transactions Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* <CalendarDateRangePicker /> */}
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
      </div>
      {/* <h2 className="text-3xl font-bold tracking-tight mt-10">{name} Dashboard</h2> */}
    </div>

    <div className="grid grid-cols-2 gap-5 mt-10">
      {charts.map((c: ChartType) => {
        return <div key={c.id}>
          <Chart
            chartId={c.id}
            containerStyle={{}}
            d={data}
            dateRange={dateRange}
            preset={selectedPreset}
            previous={selectedPrevious}
          />
        </div>
      })}
    </div>
  </>);
}