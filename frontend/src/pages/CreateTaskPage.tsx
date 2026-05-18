import React, { useState, useEffect } from 'react';
import { Card, Typography, Steps, Button, Select, Table, message, Space, Row, Col, Spin, Alert, Divider, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { projectApi, templateApi, datasourceApi, taskApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface MarkedTemplate {
  id: number;
  name: string;
  placeholders: string[];
  marked_file_path?: string;
}

export default function CreateTaskPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    loadData();
  }, []);

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

  // 选择数据源时获取详情（包括预览数据）
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

  const handleCreateProject = async () => {
    if (!selectedTemplate || !selectedDatasource) {
      message.warning('请选择模板和数据源');
      return;
    }
    setGenerating(true);
    try {
      // 自动生成映射：模板占位符 <-> 数据源列名
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

      // 直接开始生成文档（映射已自动完成）
      const genRes = await taskApi.generate(res.data.id, {
        filename_pattern: 'result_{index}'
      });
      setTaskId(genRes.data.task_id);
      setCurrentStep(2);
      message.success('生成任务已提交');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '创建失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      const res = await taskApi.generate(projectId, {
        filename_pattern: 'result_{index}'
      });
      setTaskId(res.data.task_id);
      setCurrentStep(2);
      message.success('生成任务已提交');
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
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Card>
        <Title level={3}>创建文档生成任务</Title>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="选择模板和数据源" description="选择已保存的模板" />
          <Steps.Step title="生成文档" description="批量生成Word" />
          <Steps.Step title="下载结果" description="获取文档" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
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
                <div style={{ marginBottom: 8, fontWeight: 500 }}>选择Excel数据源:</div>
                <Select
                  placeholder="请选择数据源"
                  style={{ width: '100%' }}
                  value={selectedDatasource}
                  onChange={handleDatasourceSelect}
                >
                  {datasources.map((d: any) => (
                    <Select.Option key={d.id} value={d.id}>{d.name} ({d.row_count}行)</Select.Option>
                  ))}
                </Select>

                {selectedDatasource && !selectedDatasourceDetail && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">请选择数据源查看预览</Text>
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
                      如果列名不同，请在下一步手动调整映射关系。
                    </Text>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button onClick={loadData}>刷新</Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCreateProject}
                  disabled={!selectedTemplate || !selectedDatasource}
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
            <Button type="primary" onClick={handleDownload} size="large">
              下载结果
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
