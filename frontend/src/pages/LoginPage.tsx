import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24
    }}>
      <div style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <img src="/assets/logo.png" alt="兔填填" style={{ width: 60, height: 60, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} />
      </div>

      <Card
        style={{
          width: 400,
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none'
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: '16px 0 4px', color: '#1e293b', letterSpacing: '-0.02em' }}>
            兔填填
          </Title>
          <Text type="secondary" style={{ fontSize: 14, color: '#64748b' }}>
            Word模板填充工具
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="邮箱"
              style={{
                borderRadius: 12,
                height: 52,
                border: '1px solid #e2e8f0',
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="密码"
              style={{
                borderRadius: 12,
                height: 52,
                border: '1px solid #e2e8f0',
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 52,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0', borderColor: '#e2e8f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>或者</Text>
        </Divider>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>还没有账号？</Text>
          <a
            href="/register"
            style={{
              color: '#667eea',
              fontWeight: 600,
              marginLeft: 8,
              fontSize: 14
            }}
          >
            立即注册
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/help"
            style={{ color: '#94a3b8', fontSize: 13 }}
          >
            遇到问题？查看使用帮助
          </a>
        </div>
      </Card>

      <div style={{
        position: 'absolute',
        bottom: 24,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12
      }}>
        © 2026 兔填填 · 联系客服：openclaw876
      </div>
    </div>
  );
}
