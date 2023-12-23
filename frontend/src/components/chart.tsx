import { useState, useEffect } from 'react';

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

import { DateRange } from 'react-day-picker';

import { Chart as ChartType, PreviousPreset } from '@/lib/types';
import { getVolume, getRequiredDateRanges, groupData } from '@/lib/dashboardUtils';

interface ChartProps {
    chartId: string, // fetches chart by id from the server
    containerStyle: React.CSSProperties, // wraps the chart in a container
    dateRange: DateRange,
    preset: string,
    previous: PreviousPreset,
};

export function Chart({ chartId, containerStyle, dateRange, preset, previous }: ChartProps) {
    const [chart, setChart] = useState<ChartType | null>();
    const [data, setData] = useState<{
        currDateField: Date,
        currAmount: number,
        prevDateField: Date | undefined,
        prevAmount: number | undefined,
      }[]>([]);
    const [cachedData, setCachedData] = useState([]);
    const [range, setRange] = useState<{curr: DateRange, prev: DateRange, avail: DateRange}>({
        curr: { from: undefined, to: undefined },
        prev: { from: undefined, to: undefined },
        avail: { from: undefined, to: undefined },
    });

    useEffect(() => {
        if (chart == null) {
            (async () => {
                const data = await fetch(`http://localhost:3001/chart/${chartId}`);
                const json = await data.json();
                setChart(json.chart);
            })();
        } else {
            (async () => {
                if (dateRange.from && dateRange.to) {
                    const { currRange, prevRange, requiredRange } = getRequiredDateRanges(
                        dateRange as { from: Date, to: Date },
                        previous
                    );

                    // If requested range exceeds cached range
                    if (
                        !range.avail.from ||
                        !range.avail.to ||
                        range.avail.from > requiredRange.from ||
                        range.avail.to < requiredRange.to
                    ) {
                        const response2 = await fetch('http://localhost:3001/fetch-data-by-date', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dateRange: requiredRange, chartId: chart.id }),
                        });
                        const { response: output } = await response2.json();
                        setCachedData(output);
                        setRange({ 
                            curr: range.curr,
                            prev: range.prev,
                            avail: requiredRange,
                        });
                    }

                    // If cached data is loaded
                    if (cachedData.length > 0) {
                        const result = groupData(cachedData, prevRange, currRange);
                        setData(result);
                        setRange({
                            curr: currRange,
                            prev: prevRange,
                            avail: requiredRange,
                        });
                    }

                }
            })();
        }
    }, [chart, dateRange, previous, cachedData]);

    return (
        <div>
            <div className="w-screen sm:w-3/5 mt-8 mx-auto">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{chart?.name}</h2>
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
                        <p className="text-indigo-600">{Math.round(getVolume(data, range.curr)['curr'])}</p>
                    </div>
                    <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Change</p>
                    {
                        getVolume(data, range.curr)['percent'] > 0
                        ? <p className="text-green-500">+{getVolume(data, range.curr)['percent']}%</p>
                        : <p className="text-red-500">{getVolume(data, range.curr)['percent']}%</p>
                    }
                    </div>
                    <div>
                    <p className="text-xs text-gray-500 mb-1">Gross Volume</p>
                    <p className="text-gray-500">{Math.round(getVolume(data, range.curr)['prev'])}</p>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="80%" minWidth={400} aspect={1.5} className="mx-auto">
                {chart?.chartType == 'line' ?
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
                        dataKey="currAmount"
                        stroke="#566CD6"
                        activeDot={{ r: 8 }}
                        dot={false}
                    />
                    <Line
                        name="Previous"
                        type="monotone"
                        dataKey="prevAmount"
                        stroke="#727889"
                        dot={false}
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
                        dataKey="currAmount"
                        fill="#566CD6"
                    />
                    <Bar
                        name="Previous"
                        dataKey="prevAmount"
                        fill="#727889"
                    />
                </BarChart>
                }
            </ResponsiveContainer>
            <div className="w-screen sm:w-3/5 mb-8 mx-auto">
            <div className="flex justify-between text-sm mt-2">
                <span className="text-indigo-600">{range.curr.from?.toDateString()}</span>
                <span className="text-indigo-600">{range.curr.to?.toDateString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">{range.prev.from?.toDateString()}</span>
                <span className="text-gray-500">{range.prev.to?.toDateString()}</span>
            </div>
            </div>
        </div>
    );
};