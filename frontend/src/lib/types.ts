export interface Chart {
    id: string,
    dashboardName: string,
    chartType: 'line' | 'bar',
    sqlQuery: string,
};
