import clsx, { ClassValue } from 'clsx';

/**
 * 类名合并工具函数
 * 结合clsx功能，用于条件性应用CSS类名
 * 
 * @param inputs - 类名输入
 * @returns 合并后的类名字符串
 * 
 * @example
 * ```ts
 * cn('base-class', {
 *   'conditional-class': condition,
 *   'another-class': anotherCondition
 * })
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * 创建具有变体的组件类名生成器
 * 用于创建具有多种变体的组件样式
 * 
 * @param config - 变体配置
 * @returns 类名生成函数
 * 
 * @example
 * ```ts
 * const buttonVariants = createVariants({
 *   base: 'inline-flex items-center justify-center',
 *   variants: {
 *     variant: {
 *       primary: 'bg-primary-600 text-white',
 *       secondary: 'bg-gray-100 text-gray-900'
 *     },
 *     size: {
 *       sm: 'px-3 py-2 text-sm',
 *       md: 'px-4 py-2 text-base'
 *     }
 *   },
 *   defaultVariants: {
 *     variant: 'primary',
 *     size: 'md'
 *   }
 * })
 * ```
 */
export function createVariants<T extends Record<string, Record<string, string>>>(config: {
  base?: string;
  variants?: T;
  defaultVariants?: Partial<{ [K in keyof T]: keyof T[K] }>;
}) {
  return function generateClassName(
    props?: Partial<{ [K in keyof T]: keyof T[K] }> & { className?: string }
  ): string {
    const { className, ...variantProps } = props || {};
    
    const classes = [config.base];
    
    if (config.variants) {
      Object.entries(config.variants).forEach(([variantKey, variantValues]) => {
        const selectedVariant = 
          (variantProps as any)[variantKey] || 
          config.defaultVariants?.[variantKey as keyof T];
        
        if (selectedVariant && variantValues[selectedVariant as string]) {
          classes.push(variantValues[selectedVariant as string]);
        }
      });
    }
    
    return cn(classes, className);
  };
} 