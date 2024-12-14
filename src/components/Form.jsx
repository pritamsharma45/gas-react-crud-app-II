import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Divider,
  Select,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { addupdateItemToSheet, getDropdowns } from "@/server/gas";
import { toJsonArray } from "@/lib/utils";

let index = 0;

const FormModal = ({
  onCreate,
  isModalOpen,
  setIsModalOpen,
  initialValues = {},
  columns,
}) => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({});

  const dd_Source = columns
    .map(({ ddSource }) => ddSource)
    .filter((item) => item !== undefined);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setFormValues(initialValues);
  }, [initialValues, form]);

  const handleCreate = (values) => {
    const updatedValues = { ...formValues, ...values };
    setFormValues(updatedValues);
    onCreate(updatedValues);

    setIsModalOpen(false);
  };

  const [dd, setdd] = useState(
    dd_Source.reduce((acc, key) => ({ ...acc, [key]: [] }), {})
  );

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const dropdownData = await getDropdowns(dd_Source);
        const parsedData = Object.entries(dropdownData).reduce(
          (acc, [key, value]) => {
            acc[key] = toJsonArray(value);
            return acc;
          },
          {}
        );

        setdd(parsedData);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      }
    };

    fetchDropdowns();
  }, []);

  const [name, setName] = useState("");
  const inputRef = useRef(null);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const handleAddItem = async () => {
    try {
      await addupdateItemToSheet("DD_Projects", { name });
      setdd((prev) => ({
        ...prev,
        DD_Projects: [...prev.DD_Projects, { name }],
      }));
      setName("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Failed to add item to sheet:", error);
    }
  };

  const addItem = (e) => {
    e.preventDefault();
    handleAddItem();
  };

  return (
    <>
      <Modal
        open={isModalOpen}
        title={initialValues.id ? "Update Record" : "Create a new record"}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ autoFocus: true, htmlType: "submit" }}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            initialValues={initialValues}
            clearOnDestroy
            onFinish={(values) => handleCreate(values)}
          >
            {dom}
          </Form>
        )}
      >
        {columns
          .filter((c) => c.dataIndex && c.type !== "computed")
          .map(({ key, title, rules, type, options, ddSource }) => {
            switch (type) {
              case "text":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Input />
                  </Form.Item>
                );
              case "number":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <InputNumber />
                  </Form.Item>
                );
              case "select":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Select
                      style={{ width: 300 }}
                      placeholder={`Select ${title}`}
                      options={options.map((o) => ({ label: o, value: o }))}
                    />
                  </Form.Item>
                );
              case "creatable_select":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Select
                      style={{ width: 300 }}
                      placeholder={`Select ${title}`}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: "8px 0" }} />
                          <Space style={{ padding: "0 8px 4px" }}>
                            <Input
                              placeholder={`Add new ${title}`}
                              ref={inputRef}
                              value={name}
                              onChange={onNameChange}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            <Button
                              type="text"
                              style={{ color: "green" }}
                              icon={<PlusOutlined />}
                              onClick={addItem}
                            >
                              Add item
                            </Button>
                          </Space>
                        </>
                      )}
                      options={dd[ddSource]?.map((item) => ({
                        label: item.name,
                        value: item.name,
                      }))}
                    />
                  </Form.Item>
                );
              case "date":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <DatePicker />
                  </Form.Item>
                );
              case "radio":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Radio.Group>
                      {options?.map((option) => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                );
              case "textarea":
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Input.TextArea />
                  </Form.Item>
                );
              default:
                return (
                  <Form.Item key={key} name={key} label={title} rules={rules}>
                    <Input />
                  </Form.Item>
                );
            }
          })}
      </Modal>
    </>
  );
};

export default FormModal;
