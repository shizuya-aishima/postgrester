import type { Metadata } from 'next';
import ListDetail from '../../../components/ListDetail';
import type { User } from '../../../interfaces';
import { findAll, findData } from '../../../utils/sample-api';

type Props = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const item = await findData(params.id);
    return {
      title: `${item.name} | Next.js + TypeScript Example`,
    };
  } catch (err) {
    return {
      title: 'Error | Next.js + TypeScript + Electron Example',
    };
  }
}

export async function generateStaticParams() {
  const items: User[] = await findAll();
  return items.map((item) => ({
    id: item.id.toString(),
  }));
}

export default async function DetailPage({ params }: Props) {
  try {
    const item = await findData(params.id);
    return <>{item && <ListDetail item={item} />}</>;
  } catch (err) {
    return (
      <p>
        <span style={{ color: 'red' }}>Error:</span> {err.message}
      </p>
    );
  }
}
