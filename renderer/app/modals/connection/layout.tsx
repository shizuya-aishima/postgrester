import '@/app/globals.css';

export default function ConnectionModalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ja'>
      <body>
        <div className='modal-container'>{children}</div>
      </body>
    </html>
  );
}
