import { TableConfig } from 'src/common/table/interfaces/table-config.interface';

export const usersTableConfig: TableConfig = {
    resource: 'users',

    columns: [
        {
            key: 'name',
            label: 'Name',
            visible: true,
            sortable: true,
            searchable: true,
            exportable: true,
        },
        {
            key: 'email',
            label: 'Email',
            visible: true,
            sortable: true,
            searchable: true,
            exportable: true,
        },
        {
            key: 'phoneNumber',
            label: 'Phone Number',
            visible: true,
            sortable: false,
            searchable: true,
            exportable: true,
        },
        {
            key: 'role',
            label: 'Role',
            visible: true,
            sortable: true,
            searchable: false,
            exportable: true,
            filter: {
                type: 'select',
                options: [
                    {
                        label: 'Admin',
                        value: 'ADMIN',
                    },
                    {
                        label: 'User',
                        value: 'USER',
                    },
                ],
            },
        },
        {
            key: 'isEmailVerified',
            label: 'Email Verification Status',
            visible: true,
            sortable: true,
            searchable: true,
            exportable: true,
            filter: {
                type: 'select',
                options: [
                    {
                        label: 'Verified',
                        value: 'true',
                    },
                    {
                        label: 'Not Verified',
                        value: 'false',
                    },
                ],
            },
        },
        {
            key: 'emailVerifiedAt',
            label: 'Email Verified At',
            visible: true,
            sortable: true,
            searchable: false,
            exportable: true,
        },
        {
            key: 'isActive',
            label: 'Activity Status',
            visible: true,
            sortable: true,
            searchable: false,
            exportable: true,
            filter: {
                type: 'select',
                options: [
                    {
                        label: 'Active',
                        value: 'true',
                    },
                    {
                        label: 'Inactive',
                        value: 'false',
                    },
                ],
            },
        },
        {
            key: 'createdAt',
            label: 'Registered On',
            visible: true,
            sortable: true,
            searchable: false,
            exportable: true,
        },
    ],
};