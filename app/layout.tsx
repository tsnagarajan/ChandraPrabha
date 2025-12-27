
import './globals.css';

export const metadata = {
  title: "Chandra Prabha",
  description: "Vedic Astrology Report",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#673ab7" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#EFE9D5' }}>
        {/* Navigation bar removed to clean up the interface */}
        {children}
      </body>
    </html>
  );
}