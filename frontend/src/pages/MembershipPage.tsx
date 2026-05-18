import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Tabs, Row, Col, Statistic, Button } from 'antd';
import { CreditCardOutlined, HistoryOutlined, HomeOutlined } from '@ant-design/icons';
import { orderApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function MembershipPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
    fetchUser();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.list();
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '套餐', dataIndex: 'package_name', key: 'package_name' },
    { title: '金额', dataIndex: 'price', key: 'price',
      render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'payment_status', key: 'payment_status',
      render: (v: string) => getStatusTag(v) },
    { title: '时间', dataIndex: 'created_at', key: 'created_at',
      render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="剩余次数"
              value={user?.balance ?? 0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="历史使用"
              value={user?.total_usage ?? 0}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="订单总数"
              value={orders.length}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
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

                  <Title level={5} style={{ marginTop: 24 }}>常见问题</Title>
                  <ul>
                    <li><Text strong>Q: 次数用完怎么办？</Text><br/>A: 请购买套餐补充次数</li>
                    <li><Text strong>Q: 支持退款吗？</Text><br/>A: 未使用的次数支持退款，请联系客服</li>
                    <li><Text strong>Q: 企业版有什么优惠？</Text><br/>A: 企业版不限次数，适合高频率使用</li>
                  </ul>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}