import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DollarOutlined,
  BarChartOutlined,
  BankOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  { key: '/bdds', icon: <DollarOutlined />, label: 'БДДС' },
  { key: '/bdr', icon: <BarChartOutlined />, label: 'БДР' },
  { key: '/bbl', icon: <BankOutlined />, label: 'ББЛ' },
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: 'Администрирование',
    children: [
      { key: '/admin/users', icon: <TeamOutlined />, label: 'Пользователи' },
    ],
  },
];

interface Props {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function AppSider({ collapsed, onCollapse }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const openKeys = location.pathname.startsWith('/admin') ? ['admin'] : [];

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
        defaultOpenKeys={openKeys}
        items={menuItems}
        onClick={({ key }) => {
          if (key !== 'admin') navigate(key);
        }}
      />
    </Sider>
  );
}
