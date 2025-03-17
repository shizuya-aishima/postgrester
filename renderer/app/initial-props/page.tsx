'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import List from '../../components/List';
import type { User } from '../../interfaces';
import { findAll } from '../../utils/sample-api';

export default function InitialPropsPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await findAll();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>List Example (as Function Component)</h1>
      <p>You are currently on: {pathname}</p>
      {loading ? <p>Loading...</p> : <List items={items} />}
      <p>
        <Link href='/'>Go home</Link>
      </p>
    </div>
  );
}
