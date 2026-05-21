import React, { useEffect } from 'react';
import { Spin } from 'antd';

export default function RegisterPage() {
  useEffect(() => {
    // 重定向到 guige.host 注册页
    window.location.href = '/register';
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Spin size="large" />
    </div>
  );
}
