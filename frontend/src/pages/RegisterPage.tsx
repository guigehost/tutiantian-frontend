import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Steps, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import client from '../api/client';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: register, 1: verify
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string; nickname: string }) => {
    setLoading(true);
    try {
      const res = await client.post('/auth/register', {
        email: values.email,
        password: values.password,
        nickname: values.nickname
      });
      setRegisteredEmail(values.email);
      setStep(1);
      message.success('注册成功，请查收验证码邮件');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (values: { code: string }) => {
    setVerifyLoading(true);
    try {
      const res = await client.post('/auth/verify-email', null, {
        params: { email: registeredEmail, code: values.code }
      });
      message.success('邮箱验证成功，已赠送100次免费使用！');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '验证失败');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 450, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/assets/logo.png" alt="兔填填" style={{ width: 80, height: 80 }} />
        </div>
        <Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
          兔填填 - 用户注册
        </Title>

        <Steps
          current={step}
          items={[
            { title: '注册', icon: <UserOutlined /> },
            { title: '验证邮箱', icon: <MailOutlined /> },
          ]}
          style={{ marginBottom: 32 }}
        />

        {step === 0 && (
          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="nickname"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="昵称"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效邮箱' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少8位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码（至少8位）"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                注册（验证后赠送100次）
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 1 && (
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>
              验证码已发送至：{registeredEmail}
            </Text>
            <Form
              name="verify"
              onFinish={onVerify}
              autoComplete="off"
            >
              <Form.Item
                name="code"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input
                  prefix={<CheckCircleOutlined />}
                  placeholder="输入6位验证码"
                  size="large"
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: 8 }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={verifyLoading}
                  block
                  size="large"
                >
                  验证邮箱
                </Button>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link" onClick={() => setStep(0)}>返回重新注册</Button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          已有账号？<a href="/login">立即登录</a>
        </div>
      </Card>
    </div>
  );
}
