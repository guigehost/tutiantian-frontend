import React from 'react';
import { Card, Typography, Row, Col, Button, Steps, Divider, Collapse, Space } from 'antd';
import {
  HomeOutlined, UploadOutlined, EditOutlined, FileTextOutlined,
  DatabaseOutlined, RocketOutlined, QuestionCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function HelpPage() {
  const navigate = useNavigate();

  const faqItems = [
    {
      key: '1',
      label: '支持哪些Excel格式？',
      children: <Text>支持 .xlsx、.xls 和 .csv 格式的Excel文件。建议使用 .xlsx 格式以获得最佳兼容性。</Text>
    },
    {
      key: '2',
      label: '每次生成有限制吗？',
      children: <Text>免费用户100次，专业版/企业版无限制。失败任务不扣次数。</Text>
    },
    {
      key: '3',
      label: '如何联系客服？',
      children: (
        <Space direction="vertical">
          <Text>微信：openclaw876</Text>
          <Text>邮箱：guige20231@outlook.com</Text>
          <Text type="secondary">工作时间：周一至周五 9:00-18:00</Text>
        </Space>
      )
    },
    {
      key: '4',
      label: '生成失败会扣次数吗？',
      children: <Text>不会。只有成功生成文档才扣次数，失败任务不扣。</Text>
    },
    {
      key: '5',
      label: '模板字段可以设置格式吗？',
      children: <Text>可以。标记字段时可以设置字体、颜色、对齐方式等格式。</Text>
    },
    {
      key: '6',
      label: '数据安全性如何？',
      children: <Text>您的数据仅用于本次生成，不会保存或共享给第三方。</Text>
    },
    {
      key: '7',
      label: '支持退款吗？',
      children: <Text>未使用的次数支持退款，请联系客服办理。</Text>
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      {/* Hero Section */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 24
        }}
        bodyStyle={{ padding: '40px 32px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: 16 }}>
          <img src="/assets/logo.png" alt="兔填填" style={{ width: 72, height: 72, borderRadius: 16 }} />
        </div>
        <Title level={2} style={{ color: '#fff', margin: '8px 0' }}>兔填填</Title>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
          告别重复粘贴，一键批量生成Word文档
        </Text>
      </Card>

      {/* Quick Start */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}
      >
        <Title level={4}>快速开始</Title>
        <Steps
          current={0}
          direction="horizontal"
          items={[
            { title: '注册账号', description: '验证邮箱获得100次', icon: <UploadOutlined /> },
            { title: '上传模板', description: '标记需要填充的位置', icon: <FileTextOutlined /> },
            { title: '上传数据', description: '上传Excel数据', icon: <DatabaseOutlined /> },
            { title: '生成文档', description: '一键批量生成', icon: <RocketOutlined /> },
          ]}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Features & Tutorial */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%' }}
          >
            <Title level={4}>功能介绍</Title>
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 12 }}>
                <Text>📄 <strong>Word模板</strong> - 上传文档，标记填充位置</Text>
              </li>
              <li style={{ marginBottom: 12 }}>
                <Text>📊 <strong>Excel数据源</strong> - 支持 .xlsx/.xls/.csv</Text>
              </li>
              <li style={{ marginBottom: 12 }}>
                <Text>🔗 <strong>自动映射</strong> - 智能匹配模板字段与数据列</Text>
              </li>
              <li style={{ marginBottom: 12 }}>
                <Text>⚡ <strong>批量生成</strong> - 一键生成数百份文档</Text>
              </li>
              <li>
                <Text>💾 <strong>便捷下载</strong> - 打包下载所有生成文档</Text>
              </li>
            </ul>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%' }}
          >
            <Title level={4}>模板制作教程</Title>
            <Steps
              direction="vertical"
              current={0}
              size="small"
              items={[
                {
                  title: '准备模板',
                  description: '创建Word文档，使用 {{字段名}} 格式作为占位符'
                },
                {
                  title: '标记字段',
                  description: '在标记页面选择模板，选中文本并输入字段名'
                },
                {
                  title: '保存模板',
                  description: '标记完成后保存，系统生成带占位符的模板'
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* FAQ */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}
      >
        <Title level={4} style={{ marginBottom: 16 }}>
          <QuestionCircleOutlined style={{ marginRight: 8 }} />
          常见问题
        </Title>
        <Collapse
          bordered={false}
          items={faqItems}
          style={{ background: 'transparent' }}
        />
      </Card>

      {/* Footer */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, background: '#fafafa', textAlign: 'center' }}
      >
        <Space direction="vertical" size={4}>
          <Text type="secondary">© 2026 兔填填 · Word模板填充工具</Text>
          <Text type="secondary">联系客服：openclaw876 · 邮箱：guige20231@outlook.com</Text>
        </Space>
      </Card>
    </div>
  );
}
