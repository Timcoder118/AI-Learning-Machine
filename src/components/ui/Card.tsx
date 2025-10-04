import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 卡片组件
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
