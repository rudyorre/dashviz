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

import { useState, useEffect } from 'react';

import { Chart as ChartType } from '@/lib/types';
import { getVolume, getData } from '@/lib/dashboardUtils';

interface ChartProps {
    chartId: string, // fetches chart by id from the server
    containerStyle: React.CSSProperties, // wraps the chart in a container
    d: any,
    dateRange: DateRange,
    preset: string,
    previous: string,
};

export function Chart({ chartId, containerStyle, d, dateRange, preset, previous }: ChartProps) {
    const [chart, setChart] = useState<ChartType | null>();
    const [data, setData] = useState([]);
    const [range, setRange] = useState<{curr: DateRange, prev: DateRange}>({
        curr: {
            from: undefined,
            to: undefined,
        },
        prev: {
            from: undefined,
            to: undefined,
        }
    });

    useEffect(() => {
        const fetchChartData = async () => {
            const data = await fetch(`http://localhost:3001/chart/${chartId}`);
            const json = await data.json();
            setChart(json.chart);
        };
        if (chart == null) {
            fetchChartData();
        } else {
            (async () => {
                if (dateRange.from && dateRange.to) {
                    const { result, currRange, prevRange }: any = await getData(
                        dateRange,
                        preset,
                        previous,
                        chart
                    );
                    setData(result);
                    setRange({ curr: currRange, prev: prevRange });
                }
            })();
            console.log(data);
        }
    }, [chart, dateRange, previous]);
    return (
        <div>
            <div className="w-screen sm:w-3/5 mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{chart?.name}</h2>
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
                        dataKey="pv"
                        stroke="#566CD6"
                        activeDot={{ r: 8 }}
                        dot={false}
                    />
                    <Line
                        name="Previous"
                        type="monotone"
                        dataKey="uv"
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