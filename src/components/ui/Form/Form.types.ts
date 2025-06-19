export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: any;
  options?: { value: string | number; label: string; disabled?: boolean }[];
  validation?: ValidationRule[];
  helperText?: string;
  autoComplete?: string;
  rows?: number; // for textarea
  multiple?: boolean; // for select
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData?: Record<string, any>) => boolean;
}

export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: FormError[];
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onReset?: () => void;
  onFieldChange?: (name: string, value: any, formState: FormState) => void;
  className?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  submitText?: string;
  resetText?: string;
  showResetButton?: boolean;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  children?: React.ReactNode;
}

export interface UseFormOptions {
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  fields: FormField[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseFormReturn extends FormState {
  register: (name: string) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    name: string;
    id: string;
  };
  setValue: (name: string, value: any) => void;
  setError: (name: string, message: string) => void;
  clearError: (name: string) => void;
  clearErrors: () => void;
  getFieldError: (name: string) => string | undefined;
  handleSubmit: (e: React.FormEvent) => void;
  handleReset: () => void;
  validate: (fieldName?: string) => boolean;
  reset: (values?: Record<string, any>) => void;
} 