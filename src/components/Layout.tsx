import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        backgroundColor: 'var(--hcl-ink)', 
        color: 'var(--hcl-white)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            backgroundColor: 'var(--hcl-purple)', 
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>H</div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--hcl-white)' }}>
            Resource Fulfillment Analytics
          </h1>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
