import { Layout, Button, Typography, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Header } = Layout;

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <Header style={{
      background: '#fff',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #f0f0f0',
    }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Финансовый портал
      </Typography.Title>
      <Space>
        <Typography.Text type="secondary">{user?.email}</Typography.Text>
        <Button icon={<LogoutOutlined />} onClick={signOut}>
          Выйти
        </Button>
      </Space>
    </Header>
  );
}
