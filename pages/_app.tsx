import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

function MyApp({ Component, pageProps }: AppProps) {
  // クライアント側でのみ実行されるコードを確認
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {isClient && <Component {...pageProps} />}
    </ThemeProvider>
  );
}

export default MyApp; 