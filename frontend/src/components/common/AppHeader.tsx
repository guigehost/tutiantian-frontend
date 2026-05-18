import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
        Word模板填充平台
      </div>
      <div>
        {user && (
          <>
            <span style={{ color: '#fff', marginRight: 16 }}>
              欢迎, {user.nickname || user.email}
            </span>
            <Button type="primary" danger onClick={handleLogout}>
              退出
            </Button>
          </>
        )}
      </div>
    </Header>
  );
}
