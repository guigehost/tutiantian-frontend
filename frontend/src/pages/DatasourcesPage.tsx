import React, { useState, useEffect } from 'react';
import { Table, Button, Upload, Modal, message, Space, Tag, Card, Typography, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined, FileExcelOutlined, UploadOutlined } from '@ant-design/icons';
import { datasourceApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function DatasourcesPage() {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDatasources();
  }, []);

  const loadDatasources = async () => {
    setLoading(true);
    try {
      const res = await datasourceApi.list();
      setDatasources(res.data);
    } catch (e) {
      message.error('加载数据源失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.(xlsx|xls|csv)$/, ''));

    setUploading(true);
    try {
      await datasourceApi.upload(formData);
      message.success('上传成功');
      setModalVisible(false);
      loadDatasources();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await datasourceApi.delete(id);
      message.success('删除成功');
      loadDatasources();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: '列数',
      dataIndex: 'columns',
      key: 'columns',
      render: (cols: string[]) => <Tag color="blue">{cols?.length || 0} 列</Tag>
    },
    {
      title: '行数',
      dataIndex: 'row_count',
      key: 'row_count',
      render: (count: number) => <Text>{count} 行</Text>
    },
    {
      title: '列名预览',
      dataIndex: 'columns',
      key: 'columns_preview',
      render: (cols: string[]) => (
        <Space wrap>
          {cols?.slice(0, 4).map((c: string) => (
            <Tag key={c} style={{ borderRadius: 4 }}>{c}</Tag>
          ))}
          {cols?.length > 4 && <Tag style={{ borderRadius: 4 }}>+{cols.length - 4}</Tag>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定删除此数据源？"
          description="删除后无法恢复"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>我的数据源</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ borderRadius: 8 }}
          >
            上传数据
          </Button>
        </div>

        <Table
          dataSource={datasources}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          locale={{ emptyText: '暂无数据源，请上传' }}
          style={{ borderRadius: 8, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title="上传Excel数据"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={480}
        closable={!uploading}
        maskClosable={!uploading}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={handleUpload}
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
            }}
          >
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 48, marginBottom: 16, color: '#1890ff' }}>
                <UploadOutlined />
              </p>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                点击或拖拽上传Excel文件
              </p>
              <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
                支持 .xlsx, .xls, .csv 格式
              </p>
              <Space>
                <Tag color="green">.xlsx</Tag>
                <Tag color="blue">.xls</Tag>
                <Tag color="orange">.csv</Tag>
              </Space>
            </div>
          </Upload.Dragger>
          {uploading && (
            <div style={{ marginTop: 16, color: '#1890ff' }}>上传中，请稍候...</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
