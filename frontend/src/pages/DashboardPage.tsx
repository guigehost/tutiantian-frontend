import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Button, Space, Tag, Dropdown, Avatar, Alert, message } from 'antd';
import {
  FileTextOutlined, TeamOutlined, ArrowUpOutlined, PlusOutlined,
  QuestionCircleOutlined, UserOutlined, LogoutOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { templateApi, taskApi } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, tuPoints, fetchUser, logout, refreshPoints } = useAuthStore();
  const [templateCount, setTemplateCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    loadStats();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: 'email',
      label: user?.email,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const loadStats = async () => {
    try {
      const templates = await templateApi.list();
      setTemplateCount(templates.data?.length || 0);

      const tasks = await taskApi.list();
      const taskList = tasks.data?.slice(0, 5) || [];
      setRecentTasks(taskList);

      // 计算本月使用次数
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTasks = taskList.filter((t: any) => {
        if (t.status !== 'completed') return false;
        const taskDate = new Date(t.created_at);
        return taskDate >= monthStart;
      });
      const monthCount = monthTasks.reduce((sum: number, t: any) => sum + (t.completed || 0), 0);
      setMonthlyUsage(monthCount);
    } catch (e) {
      console.error('加载统计数据失败', e);
    }
  };

  const handleDownload = async (taskId: string) => {
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

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 32px',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/assets/logo.png" alt="兔填填" style={{ width: 56, height: 56 }} />
          <div style={{ color: '#fff' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>兔填填</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Word模板填充工具</Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            style={{ borderRadius: 8 }}
          >
            <Link to="/create" style={{ color: '#fff' }}>创建任务</Link>
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" style={{ color: '#fff', height: 'auto', padding: '4px 8px' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <span style={{ color: '#fff' }}>{user?.name || user?.email?.split('@')[0]}</span>
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">我的兔点</Text>}
              value={tuPoints ?? 0}
              prefix={<FileTextOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold' }}
            />
            <Button type="link" onClick={() => window.location.href = '/user?tab=recharge'}>
              去充值 →
            </Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">我的模板</Text>}
              value={templateCount}
              prefix={<TeamOutlined style={{ color: '#764ba2' }} />}
              valueStyle={{ color: '#764ba2', fontWeight: 'bold' }}
            />
            <Button type="link" onClick={() => window.location.href = '/templates'}>
              管理模板 →
            </Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">本月使用</Text>}
              value={monthlyUsage}
              suffix="次"
              prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card
            hoverable
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => window.location.href = '/templates'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>模板管理</Title>
                <Text type="secondary">上传和管理Word模板</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => window.location.href = '/datasources'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <TeamOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>数据源管理</Title>
                <Text type="secondary">上传和管理Excel数据</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => window.location.href = '/create'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <PlusOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>创建任务</Title>
                <Text type="secondary">配置映射并生成文档</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Actions */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            hoverable
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => window.location.href = '/user?tab=recharge'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>充值兔点</Title>
                <Text type="secondary">使用兔点充值来继续使用</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            hoverable
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => window.location.href = '/help'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <QuestionCircleOutlined style={{ fontSize: 40, color: '#722ed1' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>使用帮助</Title>
                <Text type="secondary">查看教程、常见问题</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Tasks */}
      <Card
        title="最近任务"
        bordered={false}
        style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      >
        <Table
          dataSource={recentTasks}
          columns={[
            {
              title: '任务ID',
              dataIndex: 'task_id',
              render: (v: string) => v ? `#${v}` : '-'
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v: string) => {
                const map: Record<string, { color: string; text: string }> = {
                  pending: { color: 'orange', text: '等待中' },
                  processing: { color: 'blue', text: '处理中' },
                  completed: { color: 'green', text: '已完成' },
                  failed: { color: 'red', text: '失败' },
                };
                const s = map[v] || { color: 'grey', text: v };
                return <Tag color={s.color}>{s.text}</Tag>;
              }
            },
            {
              title: '生成数量',
              dataIndex: 'completed',
              render: (v: number) => v || 0
            },
            {
              title: '时间',
              dataIndex: 'created_at',
              render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-'
            },
            {
              title: '操作',
              key: 'action',
              render: (_: any, record: any) =>
                record.status === 'completed' ? (
                  <Button
                    type="link"
                    onClick={() => handleDownload(record.task_id)}
                  >
                    下载结果
                  </Button>
                ) : null,
            },
          ]}
          rowKey="task_id"
          locale={{ emptyText: '暂无任务记录' }}
          pagination={false}
        />
      </Card>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Text type="secondary">
          © 2026 兔填填 · Word模板填充工具 · 联系客服：openclaw876 · 邮箱：guige20231@outlook.com
        </Text>
      </div>
    </div>
  );
}
