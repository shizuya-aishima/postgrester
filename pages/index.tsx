import Head from 'next/head';
import SqlClientApp from '../components/SqlClientApp';

export default function Home() {
  return (
    <>
      <Head>
        <title>SQL Client</title>
        <meta name="description" content="PostgreSQL、MySQL、Oracleに対応したSQLクライアント" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SqlClientApp />
    </>
  );
} 