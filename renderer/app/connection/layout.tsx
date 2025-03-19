import '@/app/globals.css';

export default function ConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='connection-layout'>{children}</div>;
}
