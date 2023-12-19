export interface Dashboard {
    name: string,
    id: string,
    dateFilter: {
        name: string,
        initialDateRange: 'LAST_90_DAYS' | 'LAST_30_DAYS' | 'CURRENT_MONTH',
    }
};

export interface Chart {
    name: string,
    id: string,
    dashboardName: string,
    chartType: 'line' | 'bar',
    sqlQuery: string,
    xAxisField: string,
    yAxisField: string,
    dateField: { 
        table: string,
        field: string,
    },
};
