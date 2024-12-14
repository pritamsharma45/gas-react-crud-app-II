import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Space,
  Table,
  Tag,
  Popconfirm,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Card,
} from "antd";
import FormModal from "./Form";
import { executeAction } from "@/server/gas";
import { toJsonArray } from "@/lib/utils";
import dayjs from "dayjs";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;

const SmartTable = ({ schema, open, setOpen }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  console.log("schema:", schema);
  const headers = schema.fields.map(({ dataIndex }) => dataIndex);

  const [initialValues, setInitialValues] = useState({});
  const [filters, setFilters] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});

  const columns2 = [
    ...schema.fields,
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            onClick={() => handleEdit(record)}
            style={{ cursor: "pointer", color: "purple" }}
          />
          <Popconfirm
            title="Delete the task"
            description="Are you sure to delete this task?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
          </Popconfirm>
        </Space>
      ),
      type: "action",
    },
  ];

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await executeAction({
        action: "delete",
        sheetName: schema.sheetName,
        id: id,
        data: null,
        headers: headers,
      });
      const parsedData = toJsonArray(JSON.parse(res));
      const computedData = computeFields(parsedData);
      setData(computedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  const computeFields = (records) => {
    return records.map(record => {
      const computedRecord = { ...record };
      
      // Find and compute all computed fields
      schema.fields
        .filter(field => field.type === 'computed')
        .forEach(field => {
          try {
            computedRecord[field.dataIndex] = field.compute(record);
          } catch (error) {
            console.warn(`Failed to compute ${field.dataIndex}:`, error);
            computedRecord[field.dataIndex] = null;
          }
        });
      
      return computedRecord;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const records = await executeAction({
          action: "getAll",
          sheetName: schema.sheetName,
          id: null,
          data: null,
          headers: headers,
        });
        const parsedData = toJsonArray(JSON.parse(records));
        // Apply computed fields
        const computedData = computeFields(parsedData);
        setData(computedData);
        console.log("Parsed data:", computedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const onCreate = async (values) => {
    const formValues = JSON.parse(JSON.stringify(values));
    console.log("Received values of form: ", formValues);
    setLoading(true);
    executeAction({
      action: formValues.id ? "update" : "add",
      sheetName: schema.sheetName,
      id: formValues.id || null,
      data: formValues,
      headers: headers,
    })
      .then((res) => {
        console.log("res:", res);
        const parsedData = toJsonArray(JSON.parse(res));
        // Apply computed fields to the response data
        const computedData = computeFields(parsedData);
        setData(computedData);
        setLoading(false);
      })
      .catch((err) => {
        console.log("err:", err);
      });
  };

  const handleEdit = (values) => {
    // onvert date string to dayjs date object for datepicker by mappng over columns and checking date type
    const dateColumns = schema.fields.filter(
      (column) => column.type === "date"
    );
    dateColumns.forEach((column) => {
      values[column.dataIndex] = values[column.dataIndex]
        ? dayjs(values[column.dataIndex])
        : null;
    });
    console.log("Initial Values passed to the Edit Form: ", values);
    setInitialValues(values);
    setOpen(true);
  };

  const fetchDropdownOptions = async (ddSource) => {
    try {
      const response = await executeAction({
        action: "getAll",
        sheetName: ddSource,
        headers: ["name"],
      });
      return toJsonArray(JSON.parse(response)).map((item) => item.name);
    } catch (error) {
      console.error(`Failed to fetch ${ddSource} options:`, error);
      return [];
    }
  };

  useEffect(() => {
    const loadDropdownOptions = async () => {
      const options = {};
      for (const [key, config] of Object.entries(schema.filterSchema || {})) {
        if (config.ddSource) {
          options[key] = await fetchDropdownOptions(config.ddSource);
        }
      }
      setDropdownOptions(options);
    };
    loadDropdownOptions();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getFilteredData = () => {
    return data.filter((record) => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true;

        const filterConfig = schema.filterSchema[field];
        const recordValue = record[field];

        switch (filterConfig.type) {
          case "text":
            return recordValue?.toLowerCase().includes(value.toLowerCase());

          case "select":
            return recordValue === value;

          case "date_range":
            if (!value[0] || !value[1]) return true;
            const recordDate = dayjs(recordValue);
            return (
              recordDate.isAfter(value[0]) && recordDate.isBefore(value[1])
            );

          default:
            return true;
        }
      });
    });
  };

  const renderFilterInput = (field, config) => {
    switch (config.type) {
      case "text":
        return (
          <Input
            placeholder={config.placeholder}
            value={filters[field]}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            prefix={<SearchOutlined />}
          />
        );

      case "select":
        return (
          <Select
            style={{ width: "100%" }}
            placeholder={config.placeholder}
            value={filters[field]}
            onChange={(value) => handleFilterChange(field, value)}
            allowClear
            options={
              config.options
                ? config.options.map((opt) => ({ label: opt, value: opt }))
                : dropdownOptions[field]?.map((opt) => ({
                    label: opt,
                    value: opt,
                  }))
            }
          />
        );

      case "date_range":
        return (
          <RangePicker
            style={{ width: "100%" }}
            value={filters[field]}
            onChange={(dates) => handleFilterChange(field, dates)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {schema.filterSchema && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            {Object.entries(schema.filterSchema).map(([field, config]) => (
              <Col key={field} xs={12} sm={8} md={6} lg={4}>
                {renderFilterInput(field, config)}
              </Col>
            ))}
            <Col xs={2} sm={2} md={2} lg={2}>
              <ClearOutlined
                onClick={clearFilters}
                style={{ fontSize: "20px", cursor: "pointer", color: "#999" }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <FormModal
        onCreate={onCreate}
        isModalOpen={open}
        setIsModalOpen={setOpen}
        initialValues={initialValues}
        columns={schema.fields}
      />
      <Table
        columns={columns2}
        dataSource={getFilteredData()}
        loading={loading}
      />
    </>
  );
};
SmartTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default SmartTable;
