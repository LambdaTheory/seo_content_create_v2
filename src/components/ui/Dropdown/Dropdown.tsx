import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/classNames';
import { DropdownProps, DropdownOption, SelectProps } from './Dropdown.types';

export const Dropdown: React.FC<DropdownProps> = ({
  options = [],
  value,
  multiple = false,
  placeholder = '请选择...',
  disabled = false,
  searchable = false,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOptionSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    if (!multiple) {
      setIsOpen(false);
    }
  };

  const handleContainerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className="border rounded-md p-2 cursor-pointer"
        onClick={handleContainerClick}
      >
        <span>{placeholder}</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          {options.map((option) => (
            <div
              key={option.value}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleOptionSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Select: React.FC<SelectProps> = (props) => {
  return <Dropdown {...props} />;
}; 