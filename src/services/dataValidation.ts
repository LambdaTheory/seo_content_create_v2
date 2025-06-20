import { GameData, GameDataValidation, ValidationError, ValidationWarning } from '@/types/GameData.types';

/**
 * 游戏数据验证服务
 * 提供完整的数据验证、清洗和修复功能
 */
export class DataValidationService {
  
  /**
   * 验证单条游戏数据
   * @param data - 游戏数据
   * @returns 验证结果
   */
  static validateGameData(data: Partial<GameData>): GameDataValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 必填字段验证
    this.validateRequiredFields(data, errors);
    
    // 字段格式验证
    this.validateFieldFormats(data, errors, warnings);
    
    // 数据长度验证
    this.validateFieldLengths(data, warnings);
    
    // URL有效性验证
    this.validateUrls(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 批量验证游戏数据
   * @param dataList - 游戏数据列表
   * @returns 验证结果列表
   */
  static validateBatch(dataList: Partial<GameData>[]): GameDataValidation[] {
    return dataList.map(data => this.validateGameData(data));
  }

  /**
   * 验证必填字段
   * @param data - 游戏数据
   * @param errors - 错误列表
   */
  private static validateRequiredFields(data: Partial<GameData>, errors: ValidationError[]) {
    const requiredFields: (keyof GameData)[] = ['gameName', 'mainKeyword', 'realUrl'];
    
    requiredFields.forEach(field => {
      if (!data[field] || this.isEmptyString(data[field] as string)) {
        errors.push({
          field,
          message: `${this.getFieldDisplayName(field)}为必填字段`,
          type: 'required'
        });
      }
    });
  }

  /**
   * 验证字段格式
   * @param data - 游戏数据
   * @param errors - 错误列表
   * @param warnings - 警告列表
   */
  private static validateFieldFormats(
    data: Partial<GameData>, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ) {
    // 游戏名称格式验证
    if (data.gameName) {
      if (data.gameName.length < 2) {
        errors.push({
          field: 'gameName',
          message: '游戏名称至少需要2个字符',
          type: 'length'
        });
      }
      
      if (data.gameName.length > 100) {
        warnings.push({
          field: 'gameName',
          message: '游戏名称过长，建议控制在100字符以内',
          suggestion: '考虑简化游戏名称'
        });
      }
    }

    // 主关键词验证
    if (data.mainKeyword) {
      if (data.mainKeyword.length < 2) {
        errors.push({
          field: 'mainKeyword',
          message: '主关键词至少需要2个字符',
          type: 'length'
        });
      }

      // 检查是否包含特殊字符
      if (/[<>\"'&]/.test(data.mainKeyword)) {
        warnings.push({
          field: 'mainKeyword',
          message: '主关键词包含特殊字符，可能影响SEO效果',
          suggestion: '移除特殊字符：< > " \' &'
        });
      }
    }

    // 长尾关键词验证
    if (data.longTailKeywords) {
      const keywords = data.longTailKeywords.split(',').map(k => k.trim());
      
      if (keywords.length > 10) {
        warnings.push({
          field: 'longTailKeywords',
          message: '长尾关键词数量过多，建议控制在10个以内',
          suggestion: '选择最相关的关键词'
        });
      }

      // 检查空关键词
      const emptyKeywords = keywords.filter(k => !k);
      if (emptyKeywords.length > 0) {
        warnings.push({
          field: 'longTailKeywords',
          message: '存在空的关键词',
          suggestion: '移除多余的逗号分隔符'
        });
      }
    }
  }

  /**
   * 验证字段长度
   * @param data - 游戏数据
   * @param warnings - 警告列表
   */
  private static validateFieldLengths(data: Partial<GameData>, warnings: ValidationWarning[]) {
    const lengthLimits = {
      gameName: { max: 100, recommend: 50 },
      mainKeyword: { max: 50, recommend: 30 },
      longTailKeywords: { max: 500, recommend: 200 }
    };

    Object.entries(lengthLimits).forEach(([field, limits]) => {
      const value = data[field as keyof GameData] as string;
      if (value && value.length > limits.recommend) {
        warnings.push({
          field: field as keyof GameData,
          message: `${this.getFieldDisplayName(field)}建议控制在${limits.recommend}字符以内`,
          suggestion: value.length > limits.max ? '必须缩短长度' : '建议适当缩短以优化显示效果'
        });
      }
    });
  }

  /**
   * 验证URL格式
   * @param data - 游戏数据
   * @param errors - 错误列表
   * @param warnings - 警告列表
   */
  private static validateUrls(
    data: Partial<GameData>, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ) {
    const urlFields: (keyof GameData)[] = ['videoLink', 'iconUrl', 'realUrl'];
    
    urlFields.forEach(field => {
      const value = data[field] as string;
      if (value && !this.isEmptyString(value)) {
        if (!this.isValidUrl(value)) {
          errors.push({
            field,
            message: `${this.getFieldDisplayName(field)}格式不正确`,
            type: 'url'
          });
        } else {
          // 检查URL协议
          if (!value.startsWith('https://')) {
            warnings.push({
              field,
              message: `${this.getFieldDisplayName(field)}建议使用HTTPS协议`,
              suggestion: '更改为https://开头的链接'
            });
          }
        }
      }
    });

    // 验证多个URL字段（站内链接、竞品页面）
    this.validateMultipleUrls(data, 'internalLinks', errors, warnings);
    this.validateMultipleUrls(data, 'competitorPages', errors, warnings);
  }

  /**
   * 验证多个URL字段
   * @param data - 游戏数据
   * @param field - 字段名
   * @param errors - 错误列表
   * @param warnings - 警告列表
   */
  private static validateMultipleUrls(
    data: Partial<GameData>,
    field: 'internalLinks' | 'competitorPages',
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    const value = data[field];
    if (!value || this.isEmptyString(value)) return;

    const urls = value.split(',').map(url => url.trim()).filter(url => url);
    const invalidUrls: string[] = [];
    const nonHttpsUrls: string[] = [];

    urls.forEach(url => {
      if (!this.isValidUrl(url)) {
        invalidUrls.push(url);
      } else if (!url.startsWith('https://')) {
        nonHttpsUrls.push(url);
      }
    });

    if (invalidUrls.length > 0) {
      errors.push({
        field,
        message: `${this.getFieldDisplayName(field)}中包含无效URL: ${invalidUrls.join(', ')}`,
        type: 'url'
      });
    }

    if (nonHttpsUrls.length > 0) {
      warnings.push({
        field,
        message: `${this.getFieldDisplayName(field)}中的部分链接不是HTTPS`,
        suggestion: '建议将所有链接更改为HTTPS协议'
      });
    }
  }

  /**
   * 数据清洗 - 自动修复常见问题
   * @param data - 原始数据
   * @returns 清洗后的数据
   */
  static cleanData(data: Partial<GameData>): GameData {
    const cleaned = { ...data } as GameData;

    // 清理字符串字段
    this.cleanStringFields(cleaned);
    
    // 清理URL字段
    this.cleanUrlFields(cleaned);
    
    // 清理关键词字段
    this.cleanKeywordFields(cleaned);

    return cleaned;
  }

  /**
   * 清理字符串字段
   * @param data - 数据对象
   */
  private static cleanStringFields(data: Partial<GameData>) {
    const stringFields: (keyof GameData)[] = ['gameName', 'mainKeyword'];
    
    stringFields.forEach(field => {
      if (data[field]) {
        // 去除首尾空格
        data[field] = (data[field] as string).trim();
        
        // 替换多个连续空格为单个空格
        data[field] = (data[field] as string).replace(/\s+/g, ' ');
        
        // 移除特殊字符（仅针对关键词）
        if (field === 'mainKeyword') {
          data[field] = (data[field] as string).replace(/[<>\"'&]/g, '');
        }
      }
    });
  }

  /**
   * 清理URL字段
   * @param data - 数据对象
   */
  private static cleanUrlFields(data: Partial<GameData>) {
    const urlFields: (keyof GameData)[] = ['videoLink', 'iconUrl', 'realUrl'];
    
    urlFields.forEach(field => {
      if (data[field]) {
        // 去除首尾空格
        data[field] = (data[field] as string).trim();
        
        // 自动添加协议
        if (data[field] && !/^https?:\/\//.test(data[field] as string)) {
          data[field] = 'https://' + data[field];
        }
      }
    });

    // 清理多URL字段
    this.cleanMultipleUrlFields(data, 'internalLinks');
    this.cleanMultipleUrlFields(data, 'competitorPages');
  }

  /**
   * 清理多URL字段
   * @param data - 数据对象
   * @param field - 字段名
   */
  private static cleanMultipleUrlFields(
    data: Partial<GameData>, 
    field: 'internalLinks' | 'competitorPages'
  ) {
    if (!data[field]) return;

    const urls = (data[field] as string)
      .split(',')
      .map(url => url.trim())
      .filter(url => url)
      .map(url => {
        // 自动添加协议
        if (!/^https?:\/\//.test(url)) {
          return 'https://' + url;
        }
        return url;
      });

    data[field] = urls.join(', ');
  }

  /**
   * 清理关键词字段
   * @param data - 数据对象
   */
  private static cleanKeywordFields(data: Partial<GameData>) {
    if (data.longTailKeywords) {
      const keywords = data.longTailKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword)
        .map(keyword => keyword.replace(/[<>\"'&]/g, ''))
        .filter(keyword => keyword.length >= 2);

      data.longTailKeywords = keywords.join(', ');
    }
  }

  /**
   * 获取修复建议
   * @param validation - 验证结果
   * @returns 修复建议列表
   */
  static getRepairSuggestions(validation: GameDataValidation): Array<{
    type: 'auto' | 'manual';
    message: string;
    action?: () => void;
  }> {
    const suggestions: Array<{
      type: 'auto' | 'manual';
      message: string;
      action?: () => void;
    }> = [];

    validation.errors.forEach(error => {
      switch (error.type) {
        case 'required':
          suggestions.push({
            type: 'manual',
            message: `请填写${this.getFieldDisplayName(error.field)}`
          });
          break;
        case 'url':
          suggestions.push({
            type: 'auto',
            message: `自动修复${this.getFieldDisplayName(error.field)}的URL格式`
          });
          break;
        case 'length':
          suggestions.push({
            type: 'manual',
            message: `请调整${this.getFieldDisplayName(error.field)}的长度`
          });
          break;
      }
    });

    validation.warnings.forEach(warning => {
      if (warning.suggestion) {
        suggestions.push({
          type: 'manual',
          message: warning.suggestion
        });
      }
    });

    return suggestions;
  }

  /**
   * 工具方法：检查字符串是否为空
   * @param value - 字符串值
   * @returns 是否为空
   */
  private static isEmptyString(value: string): boolean {
    return !value || value.trim().length === 0;
  }

  /**
   * 工具方法：验证URL格式
   * @param url - URL字符串
   * @returns 是否有效
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // 尝试添加协议后再次验证
      try {
        new URL('https://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * 工具方法：获取字段显示名称
   * @param field - 字段名
   * @returns 显示名称
   */
  private static getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
      gameName: '游戏名称',
      mainKeyword: '主关键词',
      longTailKeywords: '长尾关键词',
      videoLink: '视频链接',
      internalLinks: '站内链接',
      competitorPages: '竞品页面',
      iconUrl: '游戏图标',
      realUrl: '游戏链接'
    };
    
    return fieldNames[field] || field;
  }
}

/**
 * 验证规则配置
 */
export const ValidationRules = {
  // 必填字段
  requiredFields: ['gameName', 'mainKeyword', 'realUrl'] as (keyof GameData)[],
  
  // 字段长度限制
  fieldLengths: {
    gameName: { min: 2, max: 100, recommend: 50 },
    mainKeyword: { min: 2, max: 50, recommend: 30 },
    longTailKeywords: { max: 500, recommend: 200 },
    videoLink: { max: 500 },
    internalLinks: { max: 1000 },
    competitorPages: { max: 1000 },
    iconUrl: { max: 500 },
    realUrl: { max: 500 }
  },
  
  // URL字段
  urlFields: ['videoLink', 'iconUrl', 'realUrl', 'internalLinks', 'competitorPages'] as (keyof GameData)[],
  
  // 多值字段（逗号分隔）
  multiValueFields: ['longTailKeywords', 'internalLinks', 'competitorPages'] as (keyof GameData)[],
  
  // 特殊字符正则
  specialCharsRegex: /[<>\"'&]/g,
  
  // URL协议正则
  urlProtocolRegex: /^https?:\/\//,
  
  // 多空格正则
  multiSpaceRegex: /\s+/g
}; 