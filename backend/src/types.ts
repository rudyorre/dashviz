export interface Dashboard {
    name: string,
    id: string,
      dateFilter: { 
       name: string, 
       initialDateRange: 'LAST_90_DAYS' | 'LAST_30_DAYS' | 'CURRENT_MONTH'
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
    dateField: { table: string, field: string };
};

export enum PreviousPreset {
    PreviousPeriod = 'Previous Period',
    PreviousMonth = 'Previous Month',
    Previous30Days = 'Previous 30 days',
    Previous90Days = 'Previous 90 days',
};

export enum CurrentPreset { 
    CurrentMonth = 'Current Month',
    Last30Days = 'Last 30 days',
    Last90Days = 'Last 90 days',
};
