import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Button } from 'antd';
import { FileTextOutlined, TeamOutlined, ArrowUpOutlined, PlusOutlined, CreditCardOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';

const { Title } = Typography;

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>工作台</Title>
        <div>
          <span style={{ marginRight: 16 }}>
            欢迎, {user?.nickname || user?.email}
          </span>
          <Button type="primary" icon={<PlusOutlined />}>
            <Link to="/create" style={{ color: '#fff' }}>创建任务</Link>
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="剩余次数"
              value={user?.balance ?? 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="我的模板"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月使用"
              value={0}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="较上月"
              value={0}
              prefix={<ArrowUpOutlined />}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card hoverable>
            <Card.Meta
              title="模板管理"
              description="上传和管理Word模板"
              avatar={<FileTextOutlined style={{ fontSize: 32 }} />}
            />
            <Link to="/templates" style={{ display: 'block', marginTop: 8 }}>进入 →</Link>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Card.Meta
              title="数据源管理"
              description="上传和管理Excel数据"
              avatar={<TeamOutlined style={{ fontSize: 32 }} />}
            />
            <Link to="/datasources" style={{ display: 'block', marginTop: 8 }}>进入 →</Link>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Card.Meta
              title="创建任务"
              description="配置映射并生成文档"
              avatar={<PlusOutlined style={{ fontSize: 32 }} />}
            />
            <Link to="/create" style={{ display: 'block', marginTop: 8 }}>进入 →</Link>
          </Card>
        </Col>
      </Row>

      <Card title="最近使用" style={{ marginTop: 24 }}>
        <Table
          dataSource={[]}
          columns={[
            { title: '任务名称', dataIndex: 'name' },
            { title: '模板', dataIndex: 'template' },
            { title: '生成数量', dataIndex: 'count' },
            { title: '时间', dataIndex: 'created_at' },
          ]}
          locale={{ emptyText: '暂无使用记录' }}
        />
      </Card>
    </div>
  );
}
