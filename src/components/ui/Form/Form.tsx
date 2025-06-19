import React from 'react';
import { FormProps, FormField } from './Form.types';
import { useForm } from './useForm';
import { Button } from '../Button';
import { Input } from '../Input';
import { cn } from '@/utils/classNames';

/**
 * FormField组件 - 渲染单个表单字段
 */
const FormFieldComponent: React.FC<{
  field: FormField;
  value: any;
  error?: string;
  touched?: boolean;
  register: any;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal' | 'inline';
}> = ({ field, value, error, touched, register, size = 'md', layout = 'vertical' }) => {
  const fieldProps = register(field.name);
  const hasError = touched && error;

  const inputClasses = cn(
    'w-full',
    {
      'h-8 text-sm': size === 'sm',
      'h-10 text-base': size === 'md',
      'h-12 text-lg': size === 'lg',
    }
  );

  const labelClasses = cn(
    'block font-medium text-gray-700',
    {
      'text-sm': size === 'sm',
      'text-base': size === 'md',
      'text-lg': size === 'lg',
      'mb-1': layout === 'vertical',
      'mr-2 min-w-[120px]': layout === 'horizontal',
      'mr-2': layout === 'inline',
    }
  );

  const containerClasses = cn(
    {
      'space-y-1': layout === 'vertical',
      'flex items-center': layout === 'horizontal' || layout === 'inline',
      'mb-4': layout === 'vertical' || layout === 'horizontal',
      'mr-4': layout === 'inline',
    }
  );

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'tel':
      case 'url':
        return (
          <Input
            {...fieldProps}
            type={field.type}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            autoComplete={field.autoComplete}
            className={inputClasses}
            error={hasError}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...fieldProps}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            rows={field.rows || 4}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'placeholder:text-gray-400',
              'transition-colors duration-200',
              {
                'border-red-300 focus:ring-red-500 focus:border-red-500': hasError,
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'text-lg': size === 'lg',
              }
            )}
          />
        );

      case 'select':
        return (
          <select
            {...fieldProps}
            disabled={field.disabled}
            required={field.required}
            multiple={field.multiple}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              {
                'border-red-300 focus:ring-red-500 focus:border-red-500': hasError,
                'h-8 text-sm': size === 'sm',
                'h-10 text-base': size === 'md',
                'h-12 text-lg': size === 'lg',
              }
            )}
          >
            {!field.required && !field.multiple && (
              <option value="">选择一个选项</option>
            )}
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              {...fieldProps}
              type="checkbox"
              checked={value}
              disabled={field.disabled}
              className={cn(
                'rounded border-gray-300 text-primary-600',
                'focus:ring-2 focus:ring-primary-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                {
                  'h-3 w-3': size === 'sm',
                  'h-4 w-4': size === 'md',
                  'h-5 w-5': size === 'lg',
                }
              )}
            />
            <span className={cn('ml-2', labelClasses)}>{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={fieldProps.onChange}
                  onBlur={fieldProps.onBlur}
                  disabled={field.disabled || option.disabled}
                  className={cn(
                    'border-gray-300 text-primary-600',
                    'focus:ring-2 focus:ring-primary-500',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    {
                      'h-3 w-3': size === 'sm',
                      'h-4 w-4': size === 'md',
                      'h-5 w-5': size === 'lg',
                    }
                  )}
                />
                <span className="ml-2 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className={containerClasses}>
        {renderField()}
        {hasError && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
        {field.helperText && !hasError && (
          <p className="text-sm text-gray-500 mt-1">{field.helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <label htmlFor={field.name} className={labelClasses}>
        {field.label}
        {field.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="flex-1">
        {renderField()}
        {hasError && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
        {field.helperText && !hasError && (
          <p className="text-sm text-gray-500 mt-1">{field.helperText}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Form组件 - 动态表单生成器
 * 
 * 功能特性：
 * - 基于配置动态生成表单字段
 * - 内置表单验证和错误处理
 * - 支持多种布局模式
 * - 自动保存功能
 * - 完整的无障碍支持
 * 
 * @example
 * ```tsx
 * const fields = [
 *   {
 *     name: 'email',
 *     label: '邮箱',
 *     type: 'email',
 *     required: true,
 *     validation: [
 *       { type: 'required', message: '请输入邮箱' },
 *       { type: 'email', message: '请输入有效的邮箱格式' }
 *     ]
 *   }
 * ];
 * 
 * <Form
 *   fields={fields}
 *   onSubmit={handleSubmit}
 *   layout="vertical"
 * />
 * ```
 */
export const Form: React.FC<FormProps> = ({
  fields,
  initialValues,
  onSubmit,
  onReset,
  onFieldChange,
  className,
  autoSave = false,
  autoSaveDelay = 1000,
  submitText = '提交',
  resetText = '重置',
  showResetButton = false,
  disabled = false,
  layout = 'vertical',
  size = 'md',
  validateOnChange = false,
  validateOnBlur = true,
  children,
  ...props
}) => {
  const form = useForm({
    fields,
    initialValues,
    onSubmit,
    validateOnChange,
    validateOnBlur,
    autoSave,
    autoSaveDelay,
  });

  const {
    values,
    errors,
    touched,
    isSubmitting,
    register,
    handleSubmit,
    handleReset,
    getFieldError,
  } = form;

  // 字段变更回调
  React.useEffect(() => {
    if (onFieldChange) {
      const changedFields = Object.keys(values);
      changedFields.forEach(fieldName => {
        onFieldChange(fieldName, values[fieldName], form);
      });
    }
  }, [values, onFieldChange, form]);

  const formClasses = cn(
    'w-full',
    {
      'space-y-4': layout === 'vertical',
      'space-y-3': layout === 'horizontal',
      'flex flex-wrap items-center': layout === 'inline',
    },
    className
  );

  return (
    <form onSubmit={handleSubmit} className={formClasses} role="form" {...props}>
      {fields.map((field) => (
        <FormFieldComponent
          key={field.name}
          field={field}
          value={values[field.name]}
          error={getFieldError(field.name)}
          touched={touched[field.name]}
          register={register}
          size={size}
          layout={layout}
        />
      ))}

      {children}

      <div className={cn(
        'flex gap-3',
        {
          'pt-4': layout === 'vertical' || layout === 'horizontal',
          'ml-auto': layout === 'inline',
        }
      )}>
        <Button
          type="submit"
          variant="primary"
          size={size}
          loading={isSubmitting}
          disabled={disabled || isSubmitting}
        >
          {submitText}
        </Button>
        
        {showResetButton && (
          <Button
            type="button"
            variant="secondary"
            size={size}
            disabled={disabled || isSubmitting}
            onClick={() => {
              handleReset();
              onReset?.();
            }}
          >
            {resetText}
          </Button>
        )}
      </div>
    </form>
  );
};

export default Form; 