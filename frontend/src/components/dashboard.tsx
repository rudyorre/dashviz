'use client';

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
import { Chart as ChartType, Dashboard as DashboardType, PreviousPreset } from '@/lib/types';
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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('Current Month');
  const [selectedPrevious, setSelectedPrevious] = useState<PreviousPreset>(PreviousPreset.PreviousPeriod);

  const [charts, setCharts] = useState<ChartType[]>([]);
  
  const handlePresetChange = async (selectedOption: string) => {
    setSelectedPreset(selectedOption);
    let from: Date;
    switch (selectedOption) {
      case 'Current Month':
        from = startOfMonth(startOfToday());
        break;
      case 'Last 30 days':
        from = subDays(startOfToday(), 29);
        break;
      case 'Last 90 days':
        from = subDays(startOfToday(), 89);
        break;
      default:
        from = startOfToday();
        break;
    }
    setDateRange({
      from: from,
      to: startOfToday(),
    });
  };

  const handlePreviousChange = async (selectedOption: PreviousPreset) => {
    setSelectedPrevious(selectedOption);
    // Do something with the selected preset, e.g., update your chart data
  };

  const handleDateRangeChange = async (selectedDateRange: DateRange) => {
    setDateRange(selectedDateRange);
    let from: Date;
    switch (selectedPreset) {
      case 'Current Month':
        from = startOfMonth(startOfToday());
        break;
      case 'Last 30 days':
        from = subDays(startOfToday(), 29);
        break;
      case 'Last 90 days':
        from = subDays(startOfToday(), 89);
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
  }, [dateRange, selectedPrevious, selectedPreset, charts, name]);

  return (<>
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{name} Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            onChange={handleDateRangeChange}
            dateRange={dateRange}
          />
          <Dropdown
            options={presetDropdown}
            onSelect={handlePresetChange}
            value={selectedPreset}
            placeholder={selectedPreset}
          />
          <p className="text-gray-500">compared to</p>
          <Dropdown
            options={previousDropdown}
            onSelect={handlePreviousChange}
            placeholder={selectedPrevious}
          />
        </div>
      </div>
      {charts.length == 0 ? <div className="mx-auto flex items-center justify-center">No associated charts for this dashboard 😔.</div> : <div />}
    </div>
    <div className="grid grid-cols-2 gap-1 mt-5">
      {charts.map((c: ChartType) => {
          return <div key={c.id}>
            <Chart
              chartId={c.id}
              containerStyle={{}}
              dateRange={dateRange}
              preset={selectedPreset}
              previous={selectedPrevious}
            />
          </div>
        })
      }
    </div>
  </>);
}