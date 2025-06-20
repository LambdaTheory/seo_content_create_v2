import { ReactNode } from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  values?: (string | number)[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  onChange?: (value: string | number | (string | number)[]) => void;
  onSearch?: (query: string) => void;
  className?: string;
  name?: string;
}

export interface SelectProps extends DropdownProps {
  showSearch?: boolean;
  loading?: boolean;
}