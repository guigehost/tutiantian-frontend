import React, { useState, useEffect } from 'react';
import { Table, Button, Upload, Modal, message, Space, Tag, Card, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { datasourceApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

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
    { title: '数据源名称', dataIndex: 'name', key: 'name' },
    { title: '列数', dataIndex: 'columns', key: 'columns',
      render: (cols: string[]) => cols?.length || 0
    },
    { title: '行数', dataIndex: 'row_count', key: 'row_count' },
    { title: '列名', dataIndex: 'columns', key: 'columns_preview',
      render: (cols: string[]) => (
        <Space>
          {cols?.slice(0, 4).map((c: string) => (
            <Tag key={c}>{c}</Tag>
          ))}
          {cols?.length > 4 && <Tag>+{cols.length - 4}</Tag>}
        </Space>
      )
    },
    { title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>我的数据源</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            上传数据
          </Button>
        </div>

        <Table
          dataSource={datasources}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无数据源，请上传' }}
        />
      </Card>

      <Modal title="上传Excel数据" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <p className="ant-upload-drag-icon"><PlusOutlined /></p>
            <p className="ant-upload-text">点击或拖拽上传Excel文件</p>
            <p className="ant-upload-hint">支持 .xlsx, .xls, .csv 格式</p>
          </Upload.Dragger>
        </div>
        {uploading && <div style={{ textAlign: 'center', marginTop: 16 }}>上传中...</div>}
      </Modal>
    </div>
  );
}