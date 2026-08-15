export type TableFilterType =
    | 'text'
    | 'select'
    | 'date'
    | 'date-range';

export interface TableFilterOption {
    label: string;
    value: string;
}

export interface TableFilterConfig {
    type: TableFilterType;
    options?: TableFilterOption[];
}

export interface TableColumnConfig {
    key: string;
    label: string;
    visible: boolean;
    sortable: boolean;
    searchable: boolean;
    exportable: boolean;
    filter?: TableFilterConfig;
}

export interface TableConfig {
    resource: string;
    columns: TableColumnConfig[];
}