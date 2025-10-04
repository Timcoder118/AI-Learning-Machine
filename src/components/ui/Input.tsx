import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 输入框组件
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${className}`}
      {...props}
    />
  );
};
