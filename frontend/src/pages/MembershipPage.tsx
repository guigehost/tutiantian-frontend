import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Button, Divider, Space, Modal, message } from 'antd';
import {
  CreditCardOutlined, HomeOutlined, WechatOutlined, MailOutlined, CrownOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function MembershipPage() {
  const { user, tuPoints, fetchUser, refreshPoints } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    refreshPoints();
  }, []);

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">我的兔点</Text>}
              value={tuPoints ?? 0}
              prefix={<CreditCardOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold', fontSize: 48 }}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                style={{ borderRadius: 8 }}
                onClick={() => window.location.href = '/user?tab=recharge'}
              >
                去充值兔点
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <img src="/assets/logo.png" alt="兔填填" style={{ width: 80, height: 80, borderRadius: 16 }} />
              <Title level={4} style={{ marginTop: 16 }}>兔填填</Title>
              <Text type="secondary">Word模板填充工具</Text>
              <Divider />
              <Text type="secondary" style={{ fontSize: 12 }}>
                兔点用于支付文档生成费用<br/>
                每生成一个文档消耗 1 兔点
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <Title level={5}>使用规则</Title>
        <ul style={{ color: '#666' }}>
          <li>每次成功生成一个Word文档计为 1 兔点</li>
          <li>预览功能不消耗兔点</li>
          <li>失败任务不扣减兔点</li>
        </ul>

        <Divider />

        <Title level={5}>常见问题</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Paragraph>
              <Text strong>Q: 兔点用完怎么办？</Text><br/>
              A: 请前往龟兔算法网站充值兔点
            </Paragraph>
            <Paragraph>
              <Text strong>Q: 支持退款吗？</Text><br/>
              A: 请联系客服
            </Paragraph>
          </Col>
          <Col span={12}>
            <Paragraph>
              <Text strong>Q: 如何开发票？</Text><br/>
              A: 请联系客服开具发票
            </Paragraph>
            <Paragraph>
              <Text strong>Q: 充值后多久到账？</Text><br/>
              A: 付款后联系客服，24小时内开通
            </Paragraph>
          </Col>
        </Row>
      </Card>

      {/* 联系客服 */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <Title level={5}>联系客服</Title>
        <Row gutter={24}>
          <Col span={12}>
            <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <WechatOutlined style={{ fontSize: 64, color: '#07c160' }} />
                <Title level={4}>微信客服</Title>
                <Paragraph>
                  <Text strong style={{ fontSize: 20 }}>openclaw876</Text>
                </Paragraph>
                <Text type="secondary">
                  备注"兔填填+手机号"以便快速核实
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <MailOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                <Title level={4}>邮箱客服</Title>
                <Paragraph>
                  <Text strong style={{ fontSize: 18 }}>guige20231@outlook.com</Text>
                </Paragraph>
                <Text type="secondary">
                  工作时间：周一至周五 9:00-18:00
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type="secondary">
          © 2026 兔填填 · Word模板填充工具 · 联系客服：openclaw876 · 邮箱：guige20231@outlook.com
        </Text>
      </div>
    </div>
  );
}
