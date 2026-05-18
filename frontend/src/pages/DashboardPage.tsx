import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Button, Space, Tag, Dropdown, Avatar, Alert, Modal, Input, message } from 'antd';
import {
  FileTextOutlined, TeamOutlined, ArrowUpOutlined, PlusOutlined,
  HomeOutlined, QuestionCircleOutlined, CrownOutlined, HistoryOutlined, UserOutlined, LogoutOutlined, MailOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { templateApi, taskApi } from '../api/client';
import client from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, fetchUser, logout, resendVerification } = useAuthStore();
  const [templateCount, setTemplateCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    loadStats();
  }, []);

  useEffect(() => {
    if (user && !user.email_verified && user.balance === 0) {
      setVerifyEmail(user.email);
      setVerifyModalVisible(true);
    }
  }, [user]);

  const handleResendCode = async () => {
    if (!verifyEmail) return;
    setResending(true);
    try {
      await resendVerification(verifyEmail);
      message.success('验证码已发送，请查收邮件');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '发送失败');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) {
      message.warning('请输入验证码');
      return;
    }
    try {
      await client.post('/auth/verify-email', null, {
        params: { email: verifyEmail, code: verifyCode }
      });
      message.success('验证成功！已赠送100次免费使用');
      setVerifyModalVisible(false);
      fetchUser();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '验证失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      console.error('下载失败', e);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 邮箱验证提示 */}
      {user && !user.email_verified && (
        <Alert
          type="warning"
          showIcon
          icon={<MailOutlined />}
          message="邮箱未验证"
          description={
            <span>
              验证邮箱后可获得100次免费使用。{" "}
              <Button type="link" size="small" onClick={() => { setVerifyEmail(user.email); setVerifyModalVisible(true); }}>
                去验证
              </Button>
            </span>
          }
          style={{ marginBottom: 16 }}
          closable
        />
      )}

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
                <span style={{ color: '#fff' }}>{user?.nickname || user?.email?.split('@')[0]}</span>
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">剩余次数</Text>}
              value={user?.balance ?? 0}
              prefix={<FileTextOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold' }}
            />
            <div style={{ fontSize: 12, color: '#888' }}>
              <Text type="secondary">免费: {(user?.balance ?? 0) - (user?.purchased_balance ?? 0)} | 已充值: {user?.purchased_balance ?? 0}</Text>
            </div>
            <Button type="link" onClick={() => window.location.href = '/membership'}>
              充值更多 →
            </Button>
          </Card>
        </Col>
        <Col span={6}>
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
        <Col span={6}>
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
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={<Text type="secondary">历史使用</Text>}
              value={user?.total_usage ?? 0}
              suffix="次"
              prefix={<HistoryOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
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
            onClick={() => window.location.href = '/membership'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CrownOutlined style={{ fontSize: 40, color: '#faad14' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>会员中心</Title>
                <Text type="secondary">查看订单、充值、联系客服</Text>
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

      {/* 邮箱验证弹窗 */}
      <Modal
        title="验证邮箱"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <MailOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={5}>输入邮箱验证码</Title>
          <Text type="secondary">
            我们已向 <strong>{verifyEmail}</strong> 发送了验证码
          </Text>

          <div style={{ marginTop: 24 }}>
            <Input
              placeholder="请输入6位验证码"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18 }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={handleVerify}
              style={{ width: '100%' }}
            >
              验证
            </Button>
            <Button
              type="link"
              onClick={handleResendCode}
              loading={resending}
              style={{ marginTop: 8 }}
            >
              没收到验证码？重新发送
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
