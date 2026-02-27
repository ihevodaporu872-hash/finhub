import { Layout, Typography } from 'antd';

const { Header } = Layout;

export function AppHeader() {
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
    </Header>
  );
}
