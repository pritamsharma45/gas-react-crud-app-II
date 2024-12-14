import { Space, Tag } from 'antd';

import dayjs from 'dayjs';

const schema = {
  sheetName: 'Records',

  fields : [
    {
      title: '📝 Task',
      dataIndex: 'task',
      key: 'task',
      rules: [{ required: true, message: 'Please input task name' }],
      type: 'text',
    },
    {
      title: '📁 Project',
      dataIndex: 'project',
      key: 'project',
      type: 'creatable_select',
      ddSource: 'DD_Projects',
    },
    {
      title: '📅 Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      type: 'date',
      rules: [{ type: 'object' as const, required: false, message: 'Please select date' }],
      render: (_,{dueDate,status}) => {
        if(!dueDate) return null;
        const today = dayjs();
        const dueDateObj = dayjs(dueDate);
        let color = 'green';
        if (dueDateObj.isBefore(today, 'day')) {
          color = 'red';
        } else if (dueDateObj.isBefore(today.add(7, 'day'), 'day')) {
          color = 'orange';
        }
        if(status === 'Done') {
          color = 'green';
        }
        return (
          <Tag color={color} key={dueDate}>
            {new Date(dueDate).toLocaleDateString()}
          </Tag>
        );
      }
    },
    {
      title: '⏳ Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      type: 'date',
      render: (startDate) => {
        if(!startDate) return null;
        return (
          <Tag color="blue" key={startDate}>
            {new Date(startDate).toLocaleDateString()}
          </Tag>
        );
      }
    },
    {
      title: '🏁 End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      type: 'date',
      render: (endDate) => {
        if(!endDate) return null;
        return (
          <Tag color="blue" key={endDate}>
            {new Date(endDate).toLocaleDateString()}
          </Tag>
        );
      }
    },
    {
      title: '📊 Status',
      dataIndex: 'status',
      key: 'status',
      type: 'radio',
      options: ['To Do', 'In Progress', 'Done'],
      render: (_,{status, dueDate}) => {
        let color = 'geekblue';
        if (status === 'In Progress') {
          color = 'volcano';
        }
        if (status === 'Done') {
          color = 'green';
        }
        
        const isOverdue = dueDate && status !== 'Done' && dayjs(dueDate).isBefore(dayjs(), 'day');
        
        return (
          <Space>
            <Tag color={color} key={status}>
              {status}
            </Tag>
            {isOverdue && (
              <Tag color="red">
                OVERDUE!
              </Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: '🗒️ Notes',
      dataIndex: 'notes',
      key: 'notes',
      type: 'textarea',
    },
    {
      title: '👤 Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      type: 'creatable_select',
      ddSource: 'DD_Users',
    },
    {
      title: '⌛ Duration',
      dataIndex: 'duration',
      key: 'duration',
      type: 'computed',
      dependencies: ['startDate', 'endDate', 'dueDate', 'status'],
      compute: (record) => {
        if (!record.startDate || !record.endDate) return null;
        
        const start = dayjs(record.startDate);
        const end = dayjs(record.endDate);
        const due = record.dueDate ? dayjs(record.dueDate) : null;
        
        const duration = end.diff(start, 'day');
        let variance = 0;
        
        if (due && record.status === 'Done') {
          variance = due.diff(end, 'day');
        }
        
        return {
          days: duration,
          variance: variance
        };
      },
      render: (_, record) => {
        if (!record.duration) return null;
        
        const { days, variance } = record.duration;
        let varianceTag = null;
        
        if (record.status === 'Done' && variance !== 0) {
          const color = variance > 0 ? 'green' : 'red';
          const text = variance > 0 
            ? `Early by ${variance} days`
            : `Delayed by ${Math.abs(variance)} days`;
            
          varianceTag = (
            <Tag color={color} style={{ marginLeft: 8 }}>
              {text}
            </Tag>
          );
        }
        
        return (
          <Space>
            <Tag color="blue">
              {days} days
            </Tag>
            {varianceTag}
          </Space>
        );
      }
    },
  ],
  filterSchema: {
    task: {
      type: 'text',
      placeholder: 'Search task...'
    },
    project: {
      type: 'select',
      placeholder: 'Filter by project',
      ddSource: 'DD_Projects'
    },
    status: {
      type: 'select',
      placeholder: 'Filter by status',
      options: ['To Do', 'In Progress', 'Done']
    },
    dueDate: {
      type: 'date_range',
      placeholder: ['Start date', 'End date']
    },
    assignedTo: {
      type: 'select',
      placeholder: 'Filter by assignee',
      ddSource: 'DD_Users'
    }
  },

}


export default schema;
