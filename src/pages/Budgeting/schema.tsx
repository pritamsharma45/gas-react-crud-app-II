import { Space, Tag } from 'antd';
import dayjs from 'dayjs';

const schema = {
  sheetName: 'ProjectBudgeting',
  fields: [
    {
      title: '📁 Project',
      dataIndex: 'project',
      key: 'project',
      type: 'creatable_select',
      ddSource: 'DD_Projects',
      rules: [{ required: true, message: 'Please select a project' }],
    },
    {
      title: '📊 Account Category',
      dataIndex: 'accountCategory',
      key: 'accountCategory',
      type: 'select',
      options: ['Personnel', 'Equipment', 'Supplies', 'Travel', 'Other'],
      rules: [{ required: true, message: 'Please select an account category' }],
    },
    {
      title: '💵 Budget Amount',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      type: 'number',
      rules: [
        { required: true, message: 'Please enter the budget amount' },
        { type: 'number', min: 0, message: 'Amount must be a positive number' },
      ],
      render: (amount) => `$${Number(amount)?.toLocaleString() || '0.00'}`,
    },
    {
      title: '💸 Spent Amount',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      type: 'number',
      rules: [{ type: 'number', min: 0, message: 'Amount must be a positive number' }],
      render: (amount) => {
        if (!amount) return '$0.00';
        return `$${Number(amount).toLocaleString()}`;
      },
    },
    {
      title: '⚖️ Balance',
      dataIndex: 'balance',
      key: 'balance',
      type: 'computed',
      dependencies: ['budgetAmount', 'spentAmount'],
      compute: (record) => {
        const budget = parseFloat(record.budgetAmount) || 0;
        const spent = parseFloat(record.spentAmount) || 0;
        return budget - spent;
      },
      render: (_, record) => {
        const balance = record.balance;
        let color = 'green';
        if (balance < 0) {
          color = 'red';
        } else if (balance === 0) {
          color = 'orange';
        }
        return (
          <Tag color={color}>
            ${Number(balance)?.toLocaleString() || '0.00'}
          </Tag>
        );
      }
    },
    {
      title: '📈 % Used',
      dataIndex: 'percentageUsed',
      key: 'percentageUsed',
      type: 'computed',
      dependencies: ['budgetAmount', 'spentAmount'],
      compute: (record) => {
        const budget = parseFloat(record.budgetAmount) || 0;
        const spent = parseFloat(record.spentAmount) || 0;
        if (budget === 0) return 0;
        return (spent / budget) * 100;
      },
      render: (_, record) => {
        const percentage = record.percentageUsed;
        let color = 'green';
        if (percentage >= 100) {
          color = 'red';
        } else if (percentage >= 80) {
          color = 'orange';
        }
        return (
          <Tag color={color}>
            {percentage.toFixed(1)}%
          </Tag>
        );
      }
    },
    {
      title: '🗓️ Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      type: 'date',
      rules: [{ type: 'object', required: true, message: 'Please select a start date' }],
      render: (startDate) => {
        if (!startDate) return null;
        return (
          <Tag color="blue" key={startDate}>
            {new Date(startDate).toLocaleDateString()}
          </Tag>
        );
      },
    },
    {
      title: '🗓️ End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      type: 'date',
      rules: [{ type: 'object', required: true, message: 'Please select an end date' }],
      render: (endDate) => {
        if (!endDate) return null;
        return (
          <Tag color="blue" key={endDate}>
            {new Date(endDate).toLocaleDateString()}
          </Tag>
        );
      },
    },
    {
      title: '📈 Status',
      dataIndex: 'status',
      key: 'status',
      type: 'radio',
      options: ['Planned', 'Ongoing', 'Completed', 'Over Budget'],
      render: (_, { status, budgetAmount, spentAmount }) => {
        let color = 'geekblue';
        if (status === 'Ongoing') color = 'volcano';
        if (status === 'Completed') color = 'green';
        if (spentAmount > budgetAmount) color = 'red';

        return (
          <Tag color={color} key={status}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: '📝 Notes',
      dataIndex: 'notes',
      key: 'notes',
      type: 'textarea',
    },
    {
      title: '📊 Approver',
      dataIndex: 'approver',
      key: 'approver',
      type: 'creatable_select',
      ddSource: 'DD_Users',
    },
  ],
  filterSchema: {
    project: {
      type: 'select',
      placeholder: 'Filter by project',
      ddSource: 'DD_Projects'
    },
    accountCategory: {
      type: 'select',
      placeholder: 'Filter by category',
      options: ['Personnel', 'Equipment', 'Supplies', 'Travel', 'Other']
    },
    status: {
      type: 'select',
      placeholder: 'Filter by status',
      options: ['Planned', 'Ongoing', 'Completed', 'Over Budget']
    },
    startDate: {
      type: 'date_range',
      placeholder: ['Start date', 'End date']
    },
    approver: {
      type: 'select',
      placeholder: 'Filter by approver',
      ddSource: 'DD_Users'
    }
  }
};

export default schema;
