import { Result } from 'antd';

interface IProps {
  title: string;
}

export const PagePlaceholder = ({ title }: IProps) => {
  return (
    <Result
      status="info"
      title={title}
      subTitle="Раздел находится в разработке"
    />
  );
}
