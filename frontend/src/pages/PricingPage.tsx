import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Tag, message, Modal, Space } from 'antd';
import { CheckOutlined, HomeOutlined, CrownOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import { packageApi, orderApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function PricingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
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

    setPaying(pkg.id);
    try {
      const res = await orderApi.create(pkg.id);
      const orderData = res.data;

      if (orderData.success) {
        setCurrentOrder({
          order_no: orderData.order_no,
          amount: orderData.package.price,
          package_name: orderData.package.name,
        });
        setQrModalVisible(true);
      } else {
        Modal.info({
          title: '购买套餐',
          content: (
            <div>
              <p><Text strong>{orderData.package.name}</Text></p>
              <p>价格：<Text strong style={{ color: '#1890ff', fontSize: 20 }}>¥{orderData.package.price}</Text></p>
              <p>次数：{orderData.package.quota}次</p>
              <Divider />
              <p><Text strong>请扫码联系客服购买：</Text></p>
              <p>微信：<Text copyable>{orderData.contact.wechat}</Text></p>
              <p>邮箱：{orderData.contact.email}</p>
              <Divider />
              <Text type="secondary">转账时请备注您的手机号或邮箱</Text>
              <br />
              <Text type="secondary">订单号：{orderData.order_no}</Text>
            </div>
          ),
          okText: '我知道了',
        });
      }
    } catch (e: any) {
      message.error(e.response?.data?.detail || '创建订单失败');
    } finally {
      setPaying(null);
    }
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
    if (pkg.max_templates > 0) {
      features.push(`${pkg.max_templates}个模板`);
    } else {
      features.push('无限模板');
    }
    features.push(`${pkg.max_file_size / 1048576}MB文件大小`);
    return features;
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>选择您的套餐</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>注册即送100次免费体验</Text>
      </div>

      <Row gutter={20} justify="center">
        {packages.map((pkg) => (
          <Col key={pkg.id} span={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: pkg.is_featured
                  ? '0 8px 32px rgba(102, 126, 234, 0.25)'
                  : '0 2px 12px rgba(0,0,0,0.08)',
                border: pkg.is_featured ? '2px solid #667eea' : '1px solid #e8e8e8',
                transform: pkg.is_featured ? 'translateY(-8px)' : 'none',
                position: 'relative',
                overflow: 'visible'
              }}
              bodyStyle={{ padding: 24 }}
            >
              {pkg.is_featured && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: '4px 16px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  <CrownOutlined style={{ marginRight: 4 }} />
                  推荐
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Title level={4} style={{ margin: '8px 0' }}>{pkg.name}</Title>
                <div style={{ marginTop: 8 }}>
                  {pkg.price === 0 ? (
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>免费</Text>
                  ) : (
                    <>
                      <Text style={{ fontSize: 20, color: '#64748b' }}>¥</Text>
                      <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#667eea' }}>{pkg.price}</Text>
                      {pkg.quota > 0 && (
                        <Text type="secondary" style={{ fontSize: 14 }}> / {pkg.quota}次</Text>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                {getFeatureList(pkg).map((f, i) => (
                  <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text>{f}</Text>
                  </div>
                ))}
              </div>

              <Button
                type={pkg.is_featured ? 'primary' : 'default'}
                size="large"
                block
                loading={paying === pkg.id}
                onClick={() => handlePurchase(pkg)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: pkg.is_featured && pkg.price > 0
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : undefined,
                  border: pkg.is_featured && pkg.price > 0 ? 'none' : '1px solid #d9d9d9'
                }}
              >
                {pkg.price === 0 ? '立即领取' : '立即购买'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Payment Modal */}
      <Modal
        title="请使用微信扫码支付"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={350}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src="/assets/wechat_qr.png"
            alt="微信收款码"
            style={{ width: 250, height: 250, borderRadius: 8 }}
          />
          <div style={{ marginTop: 16 }}>
            <Text strong>{currentOrder?.package_name}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 28, color: '#667eea', fontWeight: 'bold' }}>
              ¥{currentOrder?.amount}
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">订单号: {currentOrder?.order_no}</Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">转账时备注手机号或邮箱以便核实</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">客服微信：openclaw876</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}
