import React from 'react';

export const Card = ({ children, style, className }: { children: React.ReactNode, style?: React.CSSProperties, className?: string }) => (
  <div className={className} style={{
    backgroundColor: 'var(--hcl-white)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--hcl-neutral-200)',
    padding: '24px',
    ...style
  }}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', onClick, disabled }: { children: React.ReactNode, variant?: 'primary' | 'secondary' | 'outline', onClick?: () => void, disabled?: boolean }) => {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.2s',
  };
  
  let variantStyle: React.CSSProperties = {};
  if (variant === 'primary') {
    variantStyle = {
      backgroundColor: 'var(--hcl-purple)',
      color: 'var(--hcl-white)',
    };
  } else if (variant === 'secondary') {
    variantStyle = {
      backgroundColor: 'var(--hcl-purple-tint-10)',
      color: 'var(--hcl-purple)',
    };
  } else if (variant === 'outline') {
    variantStyle = {
      backgroundColor: 'transparent',
      border: '1px solid var(--hcl-neutral-300)',
      color: 'var(--hcl-ink)',
    };
  }
  
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variantStyle }}>
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'default' }) => {
  const styles: Record<string, React.CSSProperties> = {
    success: { backgroundColor: 'var(--hcl-success-bg)', color: 'var(--hcl-success-text)' },
    warning: { backgroundColor: 'var(--hcl-warning-bg)', color: 'var(--hcl-warning-text)' },
    error: { backgroundColor: 'var(--hcl-error-bg)', color: 'var(--hcl-error-text)' },
    default: { backgroundColor: 'var(--hcl-neutral-100)', color: 'var(--hcl-neutral-400)' },
  };
  
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...styles[variant]
    }}>
      {children}
    </span>
  );
}
