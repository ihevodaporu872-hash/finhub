import { Result } from 'antd';

interface Props {
  title: string;
}

export function PagePlaceholder({ title }: Props) {
  return (
    <Result
      status="info"
      title={title}
      subTitle="Раздел находится в разработке"
    />
  );
}
