import React, { useState, useEffect } from 'react';
import { Card, Typography, Steps, Button, Select, Table, message, Space, Row, Col, Spin, Alert, Divider, Tag, Upload, Modal } from 'antd';
import { HomeOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { projectApi, templateApi, datasourceApi, taskApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

interface MarkedTemplate {
  id: number;
  name: string;
  placeholders: string[];
  marked_file_path?: string;
}

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get('templateId');
  const { tuPoints, consumePoints, refreshPoints } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [markedTemplates, setMarkedTemplates] = useState<MarkedTemplate[]>([]);
  const [datasources, setDatasources] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MarkedTemplate | null>(null);
  const [selectedDatasource, setSelectedDatasource] = useState<number | null>(null);
  const [selectedDatasourceDetail, setSelectedDatasourceDetail] = useState<any>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingDs, setUploadingDs] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  useEffect(() => {
    loadData();
    refreshPoints();
  }, []);

  useEffect(() => {
    if (markedTemplates.length > 0 && templateIdFromUrl) {
      const t = markedTemplates.find(t => String(t.id) === String(templateIdFromUrl));
      if (t) {
        setSelectedTemplate(t);
      }
    }
  }, [markedTemplates, templateIdFromUrl]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        templateApi.listMarked(),
        datasourceApi.list()
      ]);
      setMarkedTemplates(mRes.data);
      setDatasources(dRes.data);
    } catch (e: any) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasourceSelect = async (id: number) => {
    setSelectedDatasource(id);
    try {
      const res = await datasourceApi.get(id);
      setSelectedDatasourceDetail(res.data);
    } catch (e) {
      console.error('获取数据源详情失败', e);
      setSelectedDatasourceDetail(null);
    }
  };

  const handleUploadDatasource = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.(xlsx|xls|csv)$/, ''));

    setUploadingDs(true);
    try {
      const res = await datasourceApi.upload(formData);
      message.success('上传成功');
      setUploadModalVisible(false);
      // 刷新数据源列表
      const dRes = await datasourceApi.list();
      setDatasources(dRes.data);
      // 自动选中新上传的数据源
      const newDs = dRes.data.find((d: any) => d.name === file.name.replace(/\.(xlsx|xls|csv)$/, ''));
      if (newDs) {
        handleDatasourceSelect(newDs.id);
      }
    } catch (e: any) {
      message.error(e.response?.data?.detail || '上传失败');
    } finally {
      setUploadingDs(false);
    }
    return false;
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate || !selectedDatasource) {
      message.warning('请选择模板和数据源');
      return;
    }

    // 获取行数（用于扣除兔点）
    const rowCount = selectedDatasourceDetail?.row_count || 0;
    if (rowCount === 0) {
      message.warning('数据源没有数据');
      return;
    }

    setGenerating(true);
    try {
      // 1. 先扣除兔点
      try {
        await consumePoints(rowCount, `兔填填生成${rowCount}个文档`);
      } catch (e: any) {
        if (e.message?.includes('兔点不足')) {
          Modal.confirm({
            title: '兔点不足',
            content: (
              <div>
                <p>当前剩余 <strong>{tuPoints}</strong> 兔点，本次需要 <strong>{rowCount}</strong> 兔点</p>
                <p>请先充值足够的兔点后再试</p>
              </div>
            ),
            okText: '去充值',
            cancelText: '取消',
            onOk: () => {
              window.location.href = '/user?tab=recharge';
            },
          });
          return;
        }
        throw e;
      }

      // 2. 创建项目
      const mappings = selectedTemplate.placeholders.map((p: string) => ({
        placeholder: `{{${p}}}`,
        column: p
      }));

      const res = await projectApi.create({
        name: `项目_${Date.now()}`,
        template_id: selectedTemplate.id,
        datasource_id: selectedDatasource,
        mappings: mappings
      });
      setProjectId(res.data.id);

      // 3. 生成文档（后端不再检查余额）
      const genRes = await taskApi.generate(res.data.id, {
        filename_pattern: 'result_{index}'
      });
      setTaskId(genRes.data.task_id);
      setCurrentStep(2);
      message.success('生成任务已提交，兔点已扣除');
    } catch (e: any) {
      // 生成失败时，兔点已被扣除（这是个问题，但暂不处理）
      message.error(e.response?.data?.detail || '创建失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!projectId) return;

    // 获取行数
    const rowCount = selectedDatasourceDetail?.row_count || 0;
    if (rowCount === 0) {
      message.warning('数据源没有数据');
      return;
    }

    setGenerating(true);
    try {
      // 1. 先扣除兔点
      try {
        await consumePoints(rowCount, `兔填填生成${rowCount}个文档`);
      } catch (e: any) {
        if (e.message?.includes('兔点不足')) {
          Modal.confirm({
            title: '兔点不足',
            content: (
              <div>
                <p>当前剩余 <strong>{tuPoints}</strong> 兔点，本次需要 <strong>{rowCount}</strong> 兔点</p>
                <p>请先充值足够的兔点后再试</p>
              </div>
            ),
            okText: '去充值',
            cancelText: '取消',
            onOk: () => {
              window.location.href = '/user?tab=recharge';
            },
          });
          return;
        }
        throw e;
      }

      // 2. 生成文档
      const res = await taskApi.generate(projectId, {
        filename_pattern: 'result_{index}'
      });
      setTaskId(res.data.task_id);
      setCurrentStep(2);
      message.success('生成任务已提交，兔点已扣除');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const checkTaskStatus = async () => {
    if (!taskId) return;
    try {
      const res = await taskApi.status(taskId);
      setTaskStatus(res.data);
      if (res.data.status === 'completed') {
        setCurrentStep(3);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (taskId && taskStatus?.status === 'processing') {
      const timer = setInterval(checkTaskStatus, 2000);
      return () => clearInterval(timer);
    }
  }, [taskId, taskStatus]);

  const handleDownload = async () => {
    if (!taskId) return;
    try {
      const res = await taskApi.download(taskId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${taskId}.zip`;
      a.click();
    } catch (e) {
      message.error('下载失败');
    }
  };

  const previewColumns = (selectedDatasourceDetail?.columns || []).map((c: string) => ({
    title: c,
    dataIndex: c,
    key: c
  }));

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '8px 16px', borderRadius: 8 }}>
          当前兔点: <strong>{tuPoints}</strong>
        </div>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Title level={3}>创建文档生成任务</Title>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="选择模板和数据源" description="选择已保存的模板" />
          <Steps.Step title="生成文档" description="批量生成Word" />
          <Steps.Step title="下载结果" description="获取文档" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>选择已标记的模板:</div>
                <Select
                  placeholder="请选择模板（只显示已标记的模板）"
                  style={{ width: '100%' }}
                  value={selectedTemplate?.id}
                  onChange={(v) => {
                    const t = markedTemplates.find(t => t.id === v);
                    setSelectedTemplate(t || null);
                  }}
                  loading={loading}
                  size="large"
                >
                  {markedTemplates.map((t) => (
                    <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                  ))}
                </Select>

                {selectedTemplate && (
                  <div style={{ marginTop: 16 }}>
                    <Alert
                      message="模板字段"
                      description={
                        <Space wrap>
                          {selectedTemplate.placeholders.map((p: string) => (
                            <Tag key={p} color="blue">{`{{ ${p} }}`}</Tag>
                          ))}
                        </Space>
                      }
                      type="info"
                      showIcon
                    />
                  </div>
                )}
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  选择Excel数据源:
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => setUploadModalVisible(true)}
                    style={{ marginLeft: 8 }}
                  >
                    上传新数据源
                  </Button>
                </div>
                <Select
                  placeholder="请选择或上传数据源"
                  style={{ width: '100%' }}
                  value={selectedDatasource}
                  onChange={handleDatasourceSelect}
                  size="large"
                >
                  {datasources.map((d: any) => (
                    <Select.Option key={d.id} value={d.id}>{d.name} ({d.row_count}行)</Select.Option>
                  ))}
                </Select>

                {selectedDatasource && !selectedDatasourceDetail && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">加载中...</Text>
                  </div>
                )}
              </Col>
            </Row>

            {selectedDatasourceDetail && (
              <div style={{ marginBottom: 24 }}>
                <Divider style={{ margin: '16px 0' }} />
                <Title level={5}>数据预览（前5行）</Title>
                <Table
                  dataSource={selectedDatasourceDetail?.preview || []}
                  columns={previewColumns}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  style={{ marginTop: 8 }}
                  rowKey={(record: any) => record.key || JSON.stringify(record)}
                />

                <Alert
                  message="自动映射说明"
                  description={
                    <Text type="secondary">
                      系统将自动把模板中的 <Tag>{`{{ 字段名 }}`}</Tag> 与数据源中同名的列进行映射。
                    </Text>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />

                <Alert
                  message={`本次将消耗 ${selectedDatasourceDetail.row_count} 兔点（每行1个文档）`}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button onClick={loadData} size="large">刷新</Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCreateProject}
                  disabled={!selectedTemplate || !selectedDatasource}
                  loading={generating}
                >
                  生成文档
                </Button>
              </Space>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            {taskStatus?.status === 'processing' ? (
              <>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Title level={4}>正在生成文档...</Title>
                  <p>已完成: {taskStatus?.completed || 0} / {taskStatus?.total || 0}</p>
                  <p>进度: {taskStatus?.progress || 0}%</p>
                </div>
              </>
            ) : (
              <>
                <Title level={4}>准备生成...</Title>
                <Button type="primary" onClick={checkTaskStatus}>检查状态</Button>
              </>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Title level={4}>生成完成！</Title>
            <p>成功生成 {taskStatus?.completed || 0} 个文档</p>
            <p>已消耗 {(taskStatus?.completed || 0)} 兔点</p>
            <Button type="primary" onClick={handleDownload} size="large">
              下载结果
            </Button>
          </div>
        )}
      </Card>

      {/* 上传数据源弹窗 */}
      <Modal
        title="上传Excel数据源"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={handleUploadDatasource}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">点击或拖拽上传Excel文件</p>
            <p className="ant-upload-hint">支持 .xlsx, .xls, .csv 格式</p>
          </Upload.Dragger>
        </div>
        {uploadingDs && <div style={{ textAlign: 'center', marginTop: 16 }}>上传中...</div>}
      </Modal>
    </div>
  );
}
