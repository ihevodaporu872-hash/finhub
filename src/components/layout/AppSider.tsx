import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DollarOutlined,
  BarChartOutlined,
  BankOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const menuItems = [
  { key: '/bdds', icon: <DollarOutlined />, label: 'БДДС' },
  { key: '/bdr', icon: <BarChartOutlined />, label: 'БДР' },
  { key: '/bbl', icon: <BankOutlined />, label: 'ББЛ' },
];

interface Props {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function AppSider({ collapsed, onCollapse }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      width={220}
      style={{ minHeight: '100vh' }}
    >
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Typography.Text strong style={{ color: '#fff', fontSize: collapsed ? 14 : 20 }}>
          {collapsed ? 'FH' : 'FinHub'}
        </Typography.Text>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
