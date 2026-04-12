'use client';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: '🪐 Jathakam', path: '/Jathakam' },
    { label: '❤ Vivaha Porutham', path: '/Vivaha' },
  ];

  return (
    <div style={{
      backgroundColor: '#2c1810',
      padding: '12px 20px',
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#d4a843', fontWeight: 'bold', fontSize: '15px', marginRight: '16px' }}>
        Chandra Prabha
      </span>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          style={{
            color: pathname === item.path ? '#d4a843' : '#f5f1e3',
            background: pathname === item.path ? 'rgba(255,255,255,0.1)' : 'none',
            border: pathname === item.path ? '1px solid #d4a843' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            padding: '6px 16px',
            borderRadius: '4px',
            transition: 'all 0.2s',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
