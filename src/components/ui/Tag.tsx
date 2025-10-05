import React from 'react';
import { clsx } from 'clsx';

interface TagProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * 标签组件
 * 用于显示分类、状态等信息，支持移除功能
 */
export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  removable = false,
  onRemove,
  className,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        removable && 'pr-2',
        className
      )}
      {...props}
    >
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
          aria-label="移除标签"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};
