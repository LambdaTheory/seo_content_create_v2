/**
 * 字数范围滑块组件
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WordCountSliderProps, WordCountRange, SliderHandle, DragState } from './WordCountSlider.types';

export const WordCountSlider: React.FC<WordCountSliderProps> = ({
  id,
  label,
  description,
  value,
  config,
  onChange,
  error,
  warning,
  className = '',
  showPresets = true,
  showInputs = true
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    handle: null,
    startValue: 0,
    startPosition: 0
  });

  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  // 计算位置百分比
  const getPositionPercent = useCallback((valueNum: number) => {
    const { absoluteMin, absoluteMax } = config;
    return ((valueNum - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
  }, [config]);

  // 根据位置计算值
  const getValueFromPosition = useCallback((percent: number) => {
    const { absoluteMin, absoluteMax, step } = config;
    const rawValue = absoluteMin + (percent / 100) * (absoluteMax - absoluteMin);
    return Math.round(rawValue / step) * step;
  }, [config]);

  // 更新滑块宽度
  useEffect(() => {
    const updateWidth = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 处理鼠标按下
  const handleMouseDown = useCallback((handle: SliderHandle, event: React.MouseEvent) => {
    if (config.disabled) return;

    event.preventDefault();
    
    const currentValue = handle === 'min' ? value.min : 
                        handle === 'max' ? value.max : 
                        value.target || value.min;

    setDragState({
      isDragging: true,
      handle,
      startValue: currentValue,
      startPosition: event.clientX
    });
  }, [config.disabled, value]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.handle || !sliderRef.current) return;

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragState.startPosition;
    const deltaPercent = (deltaX / sliderWidth) * 100;
    const currentPercent = getPositionPercent(dragState.startValue);
    const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent));
    const newValue = getValueFromPosition(newPercent);

    // 验证范围约束
    let updatedValue = { ...value };
    
    if (dragState.handle === 'min') {
      updatedValue.min = Math.min(newValue, value.max - config.step);
    } else if (dragState.handle === 'max') {
      updatedValue.max = Math.max(newValue, value.min + config.step);
    } else if (dragState.handle === 'target') {
      updatedValue.target = Math.max(value.min, Math.min(newValue, value.max));
    }

    onChange(updatedValue);
  }, [dragState, sliderWidth, getPositionPercent, getValueFromPosition, value, onChange, config.step]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      handle: null,
      startValue: 0,
      startPosition: 0
    });
  }, []);

  // 监听全局鼠标事件
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // 处理数值输入变化
  const handleInputChange = useCallback((field: 'min' | 'max' | 'target', inputValue: string) => {
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.max(config.absoluteMin, Math.min(config.absoluteMax, numValue));
    
    let updatedValue = { ...value };
    
    if (field === 'min') {
      updatedValue.min = Math.min(clampedValue, value.max - config.step);
    } else if (field === 'max') {
      updatedValue.max = Math.max(clampedValue, value.min + config.step);
    } else if (field === 'target') {
      updatedValue.target = Math.max(value.min, Math.min(clampedValue, value.max));
    }
    
    onChange(updatedValue);
  }, [value, onChange, config]);

  // 应用预设值
  const applyPreset = useCallback((presetValue: WordCountRange) => {
    onChange(presetValue);
  }, [onChange]);

  // 计算滑块轨道样式
  const minPercent = getPositionPercent(value.min);
  const maxPercent = getPositionPercent(value.max);
  const targetPercent = value.target ? getPositionPercent(value.target) : 0;

  return (
    <div className={`word-count-slider ${className}`}>
      {/* 标签和描述 */}
      <div className="slider-header mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}
      </div>

      {/* 数值输入框 */}
      {showInputs && (
        <div className="slider-inputs grid grid-cols-3 gap-3 mb-4">
          <div className="input-group">
            <label className="block text-xs text-gray-600 mb-1">最小值</label>
            <input
              type="number"
              value={value.min}
              onChange={(e) => handleInputChange('min', e.target.value)}
              min={config.absoluteMin}
              max={config.absoluteMax}
              step={config.step}
              disabled={config.disabled}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="input-group">
            <label className="block text-xs text-gray-600 mb-1">最大值</label>
            <input
              type="number"
              value={value.max}
              onChange={(e) => handleInputChange('max', e.target.value)}
              min={config.absoluteMin}
              max={config.absoluteMax}
              step={config.step}
              disabled={config.disabled}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {config.showTarget && (
            <div className="input-group">
              <label className="block text-xs text-gray-600 mb-1">目标值</label>
              <input
                type="number"
                value={value.target || ''}
                onChange={(e) => handleInputChange('target', e.target.value)}
                min={value.min}
                max={value.max}
                step={config.step}
                disabled={config.disabled}
                placeholder="可选"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>
      )}

      {/* 滑块容器 */}
      <div className="slider-container mb-4">
        <div
          ref={sliderRef}
          className="relative h-6 bg-gray-200 rounded-full cursor-pointer"
          style={{ minWidth: '200px' }}
        >
          {/* 滑块轨道 */}
          <div
            className="absolute h-6 bg-blue-200 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />

          {/* 最小值手柄 */}
          <div
            className={`absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-grab transform -translate-x-1/2 ${
              dragState.handle === 'min' ? 'cursor-grabbing scale-110' : ''
            } ${config.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{ left: `${minPercent}%` }}
            onMouseDown={(e) => handleMouseDown('min', e)}
            title={`最小值: ${value.min}`}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {value.min}
            </div>
          </div>

          {/* 最大值手柄 */}
          <div
            className={`absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-grab transform -translate-x-1/2 ${
              dragState.handle === 'max' ? 'cursor-grabbing scale-110' : ''
            } ${config.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{ left: `${maxPercent}%` }}
            onMouseDown={(e) => handleMouseDown('max', e)}
            title={`最大值: ${value.max}`}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {value.max}
            </div>
          </div>

          {/* 目标值手柄 */}
          {config.showTarget && value.target !== undefined && (
            <div
              className={`absolute w-4 h-4 bg-yellow-500 border-2 border-white rounded-full shadow-md cursor-grab transform -translate-x-1/2 top-1 ${
                dragState.handle === 'target' ? 'cursor-grabbing scale-110' : ''
              } ${config.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              style={{ left: `${targetPercent}%` }}
              onMouseDown={(e) => handleMouseDown('target', e)}
              title={`目标值: ${value.target}`}
            >
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {value.target}
              </div>
            </div>
          )}
        </div>

        {/* 刻度标签 */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{config.absoluteMin}</span>
          <span>{config.absoluteMax}</span>
        </div>
      </div>

      {/* 预设按钮 */}
      {showPresets && config.presets && config.presets.length > 0 && (
        <div className="preset-buttons">
          <div className="text-xs text-gray-600 mb-2">快速预设:</div>
          <div className="flex flex-wrap gap-2">
            {config.presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset.value)}
                disabled={config.disabled}
                className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 错误和警告信息 */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="mt-2 text-sm text-yellow-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {warning}
        </div>
      )}
    </div>
  );
};

export default WordCountSlider; 