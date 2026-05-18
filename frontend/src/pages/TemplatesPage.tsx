import React, { useState, useEffect } from 'react';
import { Table, Button, Upload, Modal, message, Space, Tag, Card, Typography, Drawer } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, ArrowRightOutlined, EditOutlined, EyeOutlined, HomeOutlined } from '@ant-design/icons';
import { templateApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldsDrawerVisible, setFieldsDrawerVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await templateApi.list();
      setTemplates(res.data);
    } catch (e) {
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.docx', ''));

    setUploading(true);
    try {
      await templateApi.upload(formData);
      message.success('上传成功');
      setUploadModalVisible(false);
      loadTemplates();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await templateApi.delete(id);
      message.success('删除成功');
      loadTemplates();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleViewFields = async (template: any) => {
    setSelectedTemplate(template);
    setFieldsDrawerVisible(true);
    setFieldsLoading(true);
    try {
      const res = await templateApi.getFields(template.id);
      setTemplateFields(res.data);
    } catch (e) {
      message.error('加载字段失败');
    } finally {
      setFieldsLoading(false);
    }
  };

  const handleCreateTask = (template: any) => {
    // 如果模板已标记，直接跳转创建任务
    if (template.is_marked === 1) {
      navigate(`/create?templateId=${template.id}`);
    } else {
      // 模板未标记，先去标记
      message.warning('请先标记模板字段');
      navigate(`/word-marker?templateId=${template.id}`);
    }
  };

  const fieldColumns = [
    { title: '字段名', dataIndex: 'field_name', key: 'field_name', width: 120 },
    { title: '原文', dataIndex: 'original_text', key: 'original_text', ellipsis: true },
    {
      title: '字体',
      key: 'format',
      width: 180,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <Tag style={{ fontFamily: record.font_name, margin: 0 }}>{record.font_name}</Tag>
            <Tag style={{ margin: 0 }}>{record.font_size}</Tag>
          </Space>
          <Space size={4}>
            {record.bold ? <Tag color="gold" style={{ margin: 0 }}>加粗</Tag> : null}
            {record.italic ? <Tag color="purple" style={{ margin: 0 }}>斜体</Tag> : null}
            <Tag style={{ backgroundColor: record.color, color: '#fff', border: 'none', margin: 0 }}>
              {record.color}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '对齐',
      dataIndex: 'alignment',
      key: 'alignment',
      width: 80,
      render: (v: string) => ({ left: '左对齐', center: '居中', right: '右对齐', justify: '两端' }[v] || v)
    },
  ];

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          {text}
          {record.is_marked === 1 && <Tag color="green">已标记</Tag>}
        </Space>
      )
    },
    { title: '占位符', dataIndex: 'placeholders', key: 'placeholders',
      render: (placeholders: string[]) => (
        <Space>
          {placeholders?.slice(0, 3).map((p: string) => (
            <Tag key={p}>{`{{${p}}}`}</Tag>
          ))}
          {placeholders?.length > 3 && <Tag>+{placeholders.length - 3}</Tag>}
        </Space>
      )
    },
    { title: '使用次数', dataIndex: 'usage_count', key: 'usage_count' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewFields(record)}
          >
            查看字段
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => handleCreateTask(record)}
          >
            创建任务
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>我的模板</Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              上传模板
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate('/word-marker')}
            >
              标记字段
            </Button>
          </Space>
        </div>

        <Table
          dataSource={templates}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无模板，请上传' }}
        />
      </Card>

      <Modal
        title="上传Word模板"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Upload.Dragger
            accept=".docx"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <p className="ant-upload-drag-icon">
              <DownloadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽上传Word模板</p>
            <p className="ant-upload-hint">支持 .docx 格式，模板中请使用 {"{{字段名}}"} 作为占位符</p>
          </Upload.Dragger>
        </div>
        {uploading && <div style={{ textAlign: 'center', marginTop: 16 }}>上传中...</div>}
      </Modal>

      <Drawer
        title={<Space><EditOutlined /> 模板字段详情 - {selectedTemplate?.name}</Space>}
        placement="right"
        width={600}
        open={fieldsDrawerVisible}
        onClose={() => setFieldsDrawerVisible(false)}
      >
        {templateFields.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">共 {templateFields.length} 个字段，已设置格式</Text>
            </div>
            <Table
              dataSource={templateFields}
              columns={fieldColumns}
              rowKey="id"
              loading={fieldsLoading}
              size="small"
              pagination={false}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">暂无字段信息</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
}
