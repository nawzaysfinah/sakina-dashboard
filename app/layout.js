import './globals.css';

export const metadata = {
  title: 'Sakina · Baby Dashboard',
  description: 'Sleep, feed and diaper patterns',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
