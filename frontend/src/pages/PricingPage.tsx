import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Tag, message, Modal, Spin, Space } from 'antd';
import { CheckOutlined, WechatOutlined, HomeOutlined } from '@ant-design/icons';
import { packageApi, orderApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function PricingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await packageApi.list();
      setPackages(res.data);
    } catch (e) {
      message.error('加载套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: any) => {
    if (pkg.price === 0) {
      message.success('套餐已发放');
      fetchUser();
      return;
    }

    Modal.info({
      title: '购买套餐',
      content: (
        <div>
          <p>套餐：{pkg.name}</p>
          <p>价格：¥{pkg.price}</p>
          <p>次数：{pkg.quota}次</p>
          <hr />
          <p><Text strong>请联系客服购买：</Text></p>
          <p>微信：openclaw876</p>
          <p>邮箱：guige20231@outlook.com</p>
        </div>
      ),
      okText: '我知道了',
    });
  };

  const checkOrderStatus = async () => {
    if (!currentOrder?.order_no) return;
    try {
      const res = await orderApi.get(currentOrder.order_no);
      if (res.data.payment_status === 'paid') {
        message.success('支付成功！');
        setQrModalVisible(false);
        fetchUser();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (qrModalVisible) {
      const timer = setInterval(checkOrderStatus, 3000);
      return () => clearInterval(timer);
    }
  }, [qrModalVisible, currentOrder]);

  const getFeatureList = (pkg: any) => {
    const features = [];
    if (pkg.quota > 0) {
      features.push(`${pkg.quota}次填充机会`);
    } else {
      features.push('不限次填充');
    }
    features.push(`${pkg.max_templates}个模板`);
    features.push(`${pkg.max_file_size / 1048576}MB文件大小`);
    return features;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={2}>选择您的套餐</Title>
        <Text type="secondary">注册即送10次免费体验</Text>
      </div>

      <Row gutter={16} justify="center">
        {packages.map((pkg) => (
          <Col key={pkg.id} span={6}>
            <Card
              style={{
                height: '100%',
                border: pkg.is_featured ? '2px solid #1890ff' : undefined,
                position: 'relative'
              }}
            >
              {pkg.is_featured && (
                <Tag color="blue" style={{ position: 'absolute', top: -12, right: 16 }}>
                  推荐
                </Tag>
              )}

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4}>{pkg.name}</Title>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
                  {pkg.price === 0 ? '免费' : `¥${pkg.price}`}
                </div>
                {pkg.period_days && (
                  <Text type="secondary">/{pkg.period_days}天</Text>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                {getFeatureList(pkg).map((f, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {f}
                  </div>
                ))}
              </div>

              <Button
                type={pkg.is_featured ? 'primary' : 'default'}
                size="large"
                block
                loading={paying === pkg.id}
                onClick={() => handlePurchase(pkg)}
              >
                {pkg.price === 0 ? '立即领取' : '立即购买'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 支付二维码弹窗 */}
      <Modal
        title="请使用微信扫码支付"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={300}
      >
        <div style={{ textAlign: 'center' }}>
          {qrCodeUrl ? (
            <div>
              <WechatOutlined style={{ fontSize: 200, color: '#07c160' }} />
              <div style={{ marginTop: 16 }}>
                <Text>订单号: {currentOrder?.order_no}</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text>金额: ¥{currentOrder?.amount}</Text>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">请在30分钟内完成支付</Text>
              </div>
            </div>
          ) : (
            <Spin size="large" />
          )}
        </div>
      </Modal>
    </div>
  );
}