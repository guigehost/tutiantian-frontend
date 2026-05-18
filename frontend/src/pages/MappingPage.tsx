import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Button, message, Space, Tag, Row, Col, Divider } from 'antd';
import { projectApi, templateApi, datasourceApi } from '../api/client';

const { Title } = Typography;

interface MappingItem {
  placeholder: string;
  column: string;
}

export default function MappingPage({ projectId }: { projectId: number }) {
  const [templates, setTemplates] = useState([]);
  const [datasources, setDatasources] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedDatasource, setSelectedDatasource] = useState<any>(null);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tRes, dRes] = await Promise.all([
      templateApi.list(),
      datasourceApi.list()
    ]);
    setTemplates(tRes.data);
    setDatasources(dRes.data);
  };

  const handleTemplateSelect = async (templateId: number) => {
    const res = await templateApi.get(templateId);
    setSelectedTemplate(res.data);
    // 初始化空映射
    const initialMappings = (res.data.placeholders || []).map((p: string) => ({
      placeholder: `{{${p}}}`,
      column: ''
    }));
    setMappings(initialMappings);
  };

  const handleAutoMap = async () => {
    if (!projectId) return;
    try {
      const res = await projectApi.autoMap(projectId, 0.6);
      setMappings(res.data.mappings.map((m: any) => ({
        placeholder: m.placeholder,
        column: m.column
      })));
      message.success('自动映射完成');
    } catch (e) {
      message.error('自动映射失败');
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await projectApi.updateMappings(projectId, mappings);
      message.success('保存成功');
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = selectedDatasource?.columns || [];
  const placeholders = selectedTemplate?.placeholders || [];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={4}>字段映射配置</Title>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>选择模板:</div>
            <Select
              placeholder="请选择模板"
              style={{ width: '100%' }}
              onChange={handleTemplateSelect}
            >
              {templates.map((t: any) => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>选择数据源:</div>
            <Select
              placeholder="请选择数据源"
              style={{ width: '100%' }}
              onChange={(id) => {
                const ds = datasources.find((d: any) => d.id === id);
                setSelectedDatasource(ds);
              }}
            >
              {datasources.map((d: any) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider>映射关系</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          {placeholders.map((p: string) => (
            <Row key={p} gutter={16} align="middle">
              <Col span={10}>
                <Tag color="blue">{`{{${p}}}`}</Tag>
              </Col>
              <Col span={2} style={{ textAlign: 'center' }}>
                →
              </Col>
              <Col span={12}>
                <Select
                  placeholder="选择对应列"
                  style={{ width: '100%' }}
                  value={mappings.find(m => m.placeholder === `{{${p}}}`)?.column || undefined}
                  onChange={(value) => {
                    setMappings(prev => prev.map(m =>
                      m.placeholder === `{{${p}}}` ? { ...m, column: value } : m
                    ));
                  }}
                >
                  {columns.map((c: string) => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          ))}
        </Space>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button onClick={handleAutoMap}>自动映射</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>保存映射</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}