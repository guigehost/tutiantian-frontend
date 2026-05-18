import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Tabs, Row, Col, Statistic, Button, Divider, Space, Modal, message, Image } from 'antd';
import {
  CreditCardOutlined, HistoryOutlined, HomeOutlined,
  WechatOutlined, MailOutlined, CheckOutlined, CrownOutlined
} from '@ant-design/icons';
import { orderApi, packageApi, usageLogApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function MembershipPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrPreviewVisible, setQrPreviewVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 先刷新用户数据
      await fetchUser();

      const [orderRes, pkgRes, usageRes] = await Promise.all([
        orderApi.list(),
        packageApi.list(),
        usageLogApi.list()
      ]);
      setOrders(orderRes.data);
      setPackages(pkgRes.data);
      setUsageLogs(usageRes.data);
    } catch (e) {
      console.error(e);
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
          title: '购买套餐 - ' + orderData.package.name,
          content: (
            <div>
              <p>价格：<Text strong style={{ color: '#667eea', fontSize: 20 }}>¥{orderData.package.price}</Text></p>
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

  const handleDeleteOrder = async (orderNo: string) => {
    try {
      await orderApi.delete(orderNo);
      message.success('订单已删除');
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '删除失败');
    }
  };

  useEffect(() => {
    if (qrModalVisible) {
      const timer = setInterval(checkOrderStatus, 3000);
      return () => clearInterval(timer);
    }
  }, [qrModalVisible, currentOrder]);

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      'pending': { color: 'orange', text: '待支付' },
      'paid': { color: 'green', text: '已支付' },
      'cancelled': { color: 'grey', text: '已取消' },
      'refunded': { color: 'red', text: '已退款' },
    };
    const s = map[status] || { color: 'grey', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const getOriginalPrice = (quota: number) => quota * 0.2;

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '套餐', dataIndex: 'package_name', key: 'package_name' },
    { title: '金额', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'payment_status', key: 'payment_status', render: (v: string) => getStatusTag(v) },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) =>
        record.payment_status === 'pending' ? (
          <Button type="link" danger onClick={() => handleDeleteOrder(record.order_no)}>
            删除
          </Button>
        ) : null,
    },
  ];

  const getActionTag = (action: string) => {
    const map: Record<string, { color: string; text: string }> = {
      'register_bonus': { color: 'green', text: '注册赠送' },
      'purchase': { color: 'blue', text: '充值' },
      'generate': { color: 'orange', text: '任务消耗' },
      'refund': { color: 'purple', text: '退款' },
    };
    const m = map[action] || { color: 'grey', text: action };
    return <Tag color={m.color}>{m.text}</Tag>;
  };

  const usageLogColumns = [
    {
      title: '类型',
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => getActionTag(v)
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '变化',
      dataIndex: 'change_amount',
      key: 'change_amount',
      render: (v: number) => v > 0 ? <Text style={{ color: '#52c41a' }}>+{v}</Text> : <Text style={{ color: '#ff4d4f' }}>{v}</Text>
    },
    {
      title: '余额',
      key: 'balance',
      render: (_: any, record: any) => `${record.balance_before} → ${record.balance_after}`
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">剩余次数</Text>}
              value={user?.balance ?? 0}
              prefix={<CreditCardOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold', fontSize: 32 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <Text type="secondary">免费赠送: {(user?.balance ?? 0) - (user?.purchased_balance ?? 0)}</Text>
              <br />
              <Text type="secondary">已充值: {user?.purchased_balance ?? 0}</Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">历史使用</Text>}
              value={user?.total_usage ?? 0}
              suffix="次"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: 32 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">订单总数</Text>}
              value={orders.length}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold', fontSize: 32 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 限时优惠套餐 */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>限时优惠</Tag>
          <Title level={3} style={{ margin: '8px 0 4px' }}>超值套餐限时特惠</Title>
          <Text type="secondary">活动截止至 2026年6月30日 · 原价 0.2元/次</Text>
        </div>

        <Row gutter={20} justify="center">
          {packages.map((pkg) => {
            const originalPrice = getOriginalPrice(pkg.quota);
            const discount = (pkg.price / originalPrice * 10).toFixed(1);

            return (
              <Col key={pkg.id} span={7}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: pkg.is_featured
                      ? '0 8px 32px rgba(255, 77, 79, 0.25)'
                      : '0 2px 12px rgba(0,0,0,0.08)',
                    border: pkg.is_featured ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
                    transform: pkg.is_featured ? 'translateY(-8px)' : 'none',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  {pkg.is_featured && (
                    <div style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                      color: '#fff',
                      padding: '6px 20px',
                      borderRadius: 14,
                      fontSize: 13,
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.4)'
                    }}>
                      <CrownOutlined style={{ marginRight: 4 }} />
                      最划算
                    </div>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: '12px 0 8px' }}>{pkg.name}</Title>

                    {/* 原价 */}
                    <Text type="secondary" style={{ textDecoration: 'line-through', fontSize: 14 }}>
                      ¥{originalPrice.toFixed(0)}
                    </Text>

                    {/* 现价 */}
                    <div style={{ margin: '8px 0' }}>
                      <Text style={{ fontSize: 20, color: '#64748b' }}>¥</Text>
                      <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#ff4d4f' }}>{pkg.price}</Text>
                    </div>

                    {/* 折扣标签 */}
                    <Tag color="red" style={{ fontSize: 12, marginBottom: 8 }}>{discount}折</Tag>

                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                      {pkg.quota}次 · {pkg.max_templates > 0 ? `${pkg.max_templates}个模板` : '无限模板'}
                    </div>

                    <Button
                      type={pkg.is_featured ? 'primary' : 'default'}
                      size="large"
                      block
                      loading={paying === pkg.id}
                      onClick={() => handlePurchase(pkg)}
                      style={{
                        height: 44,
                        borderRadius: 10,
                        background: pkg.is_featured
                          ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                          : undefined,
                        border: pkg.is_featured ? 'none' : '1px solid #d9d9d9'
                      }}
                    >
                      立即购买
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">购买后有效期1年 · 失败不扣次 · 联系客服补充次数</Text>
        </div>
      </Card>

      {/* 订单记录 */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <Tabs
          defaultActiveKey="orders"
          items={[
            {
              key: 'orders',
              label: '订单记录',
              children: (
                <Table
                  dataSource={orders}
                  columns={orderColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'usage_logs',
              label: '使用记录',
              children: (
                <Table
                  dataSource={usageLogs}
                  columns={usageLogColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: '暂无使用记录' }}
                />
              ),
            },
            {
              key: 'usage',
              label: '使用说明',
              children: (
                <div>
                  <Title level={5}>使用规则</Title>
                  <ul>
                    <li>每次成功生成一个Word文档计为1次</li>
                    <li>预览功能不消耗次数</li>
                    <li>失败任务不扣减次数</li>
                    <li>次数有效期为购买后1年</li>
                  </ul>

                  <Divider />

                  <Title level={5}>常见问题</Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Paragraph>
                        <Text strong>Q: 次数用完怎么办？</Text><br/>
                        A: 请购买套餐补充次数
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Q: 支持退款吗？</Text><br/>
                        A: 未使用的次数支持退款，请联系客服
                      </Paragraph>
                    </Col>
                    <Col span={12}>
                      <Paragraph>
                        <Text strong>Q: 如何开发票？</Text><br/>
                        A: 请联系客服开具发票
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Q: 充值后多久到账？</Text><br/>
                        A: 转账后联系客服，24小时内开通
                      </Paragraph>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'contact',
              label: '联系客服',
              children: (
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
              ),
            },
          ]}
        />
      </Card>

      {/* 支付弹窗 */}
      <Modal
        title="请使用微信扫码支付"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={350}
      >
        <div style={{ textAlign: 'center' }}>
          <Image
            src="/assets/wechat_qr.png"
            alt="微信收款码"
            width={250}
            style={{ borderRadius: 8, cursor: 'pointer' }}
            preview={{ visible: qrPreviewVisible, onVisibleChange: setQrPreviewVisible }}
          />
          <div style={{ marginTop: 8 }}>
            <Button type="link" onClick={() => setQrPreviewVisible(true)}>点击放大</Button>
          </div>
          <div style={{ marginTop: 16 }}>
            <Text strong>{currentOrder?.package_name}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 28, color: '#ff4d4f', fontWeight: 'bold' }}>
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

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type="secondary">
          © 2026 兔填填 · Word模板填充工具 · 联系客服：openclaw876 · 邮箱：guige20231@outlook.com
        </Text>
      </div>
    </div>
  );
}
