import { useState, useCallback, useEffect, useRef } from 'react';
import { UseFormOptions, UseFormReturn, FormField, ValidationRule, FormError, FormState } from './Form.types';

/**
 * 验证单个字段
 */
const validateField = (field: FormField, value: any, formData: Record<string, any>): string | undefined => {
  if (!field.validation) return undefined;

  for (const rule of field.validation) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;
      
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message;
        }
        break;
      
      case 'min':
        if (value !== undefined && value !== null && Number(value) < rule.value) {
          return rule.message;
        }
        break;
      
      case 'max':
        if (value !== undefined && value !== null && Number(value) > rule.value) {
          return rule.message;
        }
        break;
      
      case 'minLength':
        if (value && value.length < rule.value) {
          return rule.message;
        }
        break;
      
      case 'maxLength':
        if (value && value.length > rule.value) {
          return rule.message;
        }
        break;
      
      case 'pattern':
        if (value && !new RegExp(rule.value).test(value)) {
          return rule.message;
        }
        break;
      
      case 'custom':
        if (rule.validator && !rule.validator(value, formData)) {
          return rule.message;
        }
        break;
    }
  }

  return undefined;
};

/**
 * 自定义表单Hook
 */
export const useForm = (options: UseFormOptions): UseFormReturn => {
  const {
    initialValues = {},
    onSubmit,
    fields,
    validateOnChange = false,
    validateOnBlur = true,
    autoSave = false,
    autoSaveDelay = 1000,
  } = options;

  // 初始化表单值
  const getInitialValues = useCallback(() => {
    const values: Record<string, any> = { ...initialValues };
    fields.forEach(field => {
      if (!(field.name in values)) {
        switch (field.type) {
          case 'checkbox':
            values[field.name] = false;
            break;
          case 'select':
            values[field.name] = field.multiple ? [] : '';
            break;
          default:
            values[field.name] = field.value ?? '';
        }
      }
    });
    return values;
  }, [fields, initialValues]);

  const [state, setState] = useState<FormState>(() => ({
    values: getInitialValues(),
    errors: [],
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  }));

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 自动保存功能
  useEffect(() => {
    if (autoSave && state.isDirty && !state.isSubmitting) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        // 触发自动保存逻辑
        console.log('Auto-saving form data...', state.values);
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.values, state.isDirty, state.isSubmitting, autoSave, autoSaveDelay]);

  /**
   * 验证表单
   */
  const validate = useCallback((fieldName?: string): boolean => {
    const fieldsToValidate = fieldName ? fields.filter(f => f.name === fieldName) : fields;
    const newErrors: FormError[] = [];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, state.values[field.name], state.values);
      if (error) {
        newErrors.push({ field: field.name, message: error });
      }
    });

    if (fieldName) {
      // 只更新特定字段的错误
      setState(prev => ({
        ...prev,
        errors: [
          ...prev.errors.filter(e => e.field !== fieldName),
          ...newErrors,
        ],
        isValid: [...prev.errors.filter(e => e.field !== fieldName), ...newErrors].length === 0,
      }));
    } else {
      // 更新所有错误
      setState(prev => ({
        ...prev,
        errors: newErrors,
        isValid: newErrors.length === 0,
      }));
    }

    return newErrors.length === 0;
  }, [fields, state.values]);

  /**
   * 设置字段值
   */
  const setValue = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      isDirty: true,
    }));

    if (validateOnChange) {
      setTimeout(() => validate(name), 0);
    }
  }, [validateOnChange, validate]);

  /**
   * 设置字段错误
   */
  const setError = useCallback((name: string, message: string) => {
    setState(prev => ({
      ...prev,
      errors: [
        ...prev.errors.filter(e => e.field !== name),
        { field: name, message },
      ],
      isValid: false,
    }));
  }, []);

  /**
   * 清除字段错误
   */
  const clearError = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.field !== name),
      isValid: prev.errors.filter(e => e.field !== name).length === 0,
    }));
  }, []);

  /**
   * 清除所有错误
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      isValid: true,
    }));
  }, []);

  /**
   * 获取字段错误
   */
  const getFieldError = useCallback((name: string): string | undefined => {
    return state.errors.find(e => e.field === name)?.message;
  }, [state.errors]);

  /**
   * 注册字段
   */
  const register = useCallback((name: string) => {
    return {
      value: state.values[name] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        let value: any;

        if (target.type === 'checkbox') {
          value = (target as HTMLInputElement).checked;
        } else if (target.type === 'number') {
          value = target.value === '' ? '' : Number(target.value);
        } else if (target.type === 'select-multiple') {
          const select = target as HTMLSelectElement;
          value = Array.from(select.selectedOptions).map(option => option.value);
        } else {
          value = target.value;
        }

        setValue(name, value);
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setState(prev => ({
          ...prev,
          touched: { ...prev.touched, [name]: true },
        }));

        if (validateOnBlur) {
          setTimeout(() => validate(name), 0);
        }
      },
      name,
      id: name,
    };
  }, [state.values, setValue, validateOnBlur, validate]);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.isSubmitting) return;

    // 标记所有字段为已触摸
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });

    setState(prev => ({
      ...prev,
      touched: allTouched,
      isSubmitting: true,
    }));

    // 验证表单
    const isValid = validate(undefined);
    
    if (isValid) {
      try {
        await onSubmit(state.values);
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          isDirty: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
        }));
        throw error;
      }
    } else {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [state.isSubmitting, state.values, fields, validate, onSubmit]);

  /**
   * 处理表单重置
   */
  const handleReset = useCallback(() => {
    setState({
      values: getInitialValues(),
      errors: [],
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, [getInitialValues]);

  /**
   * 重置表单
   */
  const reset = useCallback((values?: Record<string, any>) => {
    const newValues = values || getInitialValues();
    setState({
      values: newValues,
      errors: [],
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, [getInitialValues]);

  return {
    ...state,
    register,
    setValue,
    setError,
    clearError,
    clearErrors,
    getFieldError,
    handleSubmit,
    handleReset,
    validate,
    reset,
  };
}; 