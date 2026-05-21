import { ReactNode } from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'default', children, className = '' }: AlertProps) {
  const variants = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className={`p-4 rounded-md border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}