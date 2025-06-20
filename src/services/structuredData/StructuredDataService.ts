/**
 * 结构化数据生成服务
 * 负责将游戏数据转换为Schema.org格式的结构化数据
 */

import {
  SchemaGameData,
  VideoGame,
  Game,
  SoftwareApplication,
  VideoGameSeries,
  SchemaGameType,
  GamePlatform,
  ApplicationCategory,
  ApplicationSubCategory,
  ContentRating,
  GamePlayMode,
  Organization,
  Person,
  AggregateRating,
  Review,
  Offer,
  ImageObject,
  VideoObject,
  GAME_GENRE_MAPPING,
  PLATFORM_MAPPING,
  detectSchemaGameType,
  generateSchemaJsonLd,
  SCHEMA_TEMPLATES,
  VIDEO_GAME_VALIDATION_RULES,
  SchemaValidationRule,
} from './schemaOrgStandards';

/**
 * 结构化数据生成配置
 */
export interface StructuredDataConfig {
  // 基本配置
  enableValidation: boolean;
  enableOptimization: boolean;
  enableCaching: boolean;
  
  // 数据源配置
  includeReviews: boolean;
  includeOffers: boolean;
  includeMedia: boolean;
  includeDevInfo: boolean;
  
  // 输出配置
  outputFormat: 'json-ld' | 'microdata' | 'rdfa';
  compressionLevel: 'none' | 'minimal' | 'aggressive';
  
  // SEO配置
  prioritizeKeywords: boolean;
  enhanceDescriptions: boolean;
  addBreadcrumbs: boolean;
  
  // 默认值配置
  defaultPublisher?: Organization;
  defaultDeveloper?: Organization;
  defaultRatingSystem?: 'esrb' | 'pegi' | 'cero';
  defaultCurrency?: string;
  defaultLanguage?: string;
}

/**
 * 结构化数据生成结果
 */
export interface StructuredDataResult {
  success: boolean;
  data?: SchemaGameData;
  jsonLd?: string;
  microdata?: string;
  rdfa?: string;
  errors: string[];
  warnings: string[];
  validationScore: number;
  seoScore: number;
  optimizations: string[];
}

/**
 * 批量生成结果
 */
export interface BatchStructuredDataResult {
  total: number;
  successful: number;
  failed: number;
  results: Map<string, StructuredDataResult>;
  errors: string[];
  executionTime: number;
}

/**
 * 数据映射规则
 */
export interface DataMappingRule {
  sourceField: string;
  targetField: string;
  transformer?: (value: any) => any;
  validator?: (value: any) => boolean;
  required?: boolean;
  defaultValue?: any;
}

/**
 * 结构化数据生成服务类
 */
export class StructuredDataService {
  private config: StructuredDataConfig;
  private cache: Map<string, StructuredDataResult>;
  private mappingRules: Map<string, DataMappingRule[]>;

  constructor(config: Partial<StructuredDataConfig> = {}) {
    this.config = {
      enableValidation: true,
      enableOptimization: true,
      enableCaching: true,
      includeReviews: true,
      includeOffers: true,
      includeMedia: true,
      includeDevInfo: true,
      outputFormat: 'json-ld',
      compressionLevel: 'minimal',
      prioritizeKeywords: true,
      enhanceDescriptions: true,
      addBreadcrumbs: false,
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      defaultRatingSystem: 'esrb',
      ...config,
    };
    
    this.cache = new Map();
    this.mappingRules = new Map();
    this.initializeDefaultMappingRules();
  }

  /**
   * 初始化默认数据映射规则
   */
  private initializeDefaultMappingRules(): void {
    // VideoGame映射规则
    this.mappingRules.set('VideoGame', [
      {
        sourceField: 'title',
        targetField: 'name',
        required: true,
        transformer: (value: string) => value?.trim(),
      },
      {
        sourceField: 'description',
        targetField: 'description',
        transformer: (value: string) => this.enhanceDescription(value),
      },
      {
        sourceField: 'genre',
        targetField: 'genre',
        transformer: (value: string | string[]) => this.mapGenres(value),
      },
      {
        sourceField: 'platform',
        targetField: 'gamePlatform',
        transformer: (value: string | string[]) => this.mapPlatforms(value),
      },
      {
        sourceField: 'rating',
        targetField: 'aggregateRating',
        transformer: (value: any) => this.createAggregateRating(value),
      },
      {
        sourceField: 'price',
        targetField: 'offers',
        transformer: (value: number) => this.createOffer(value),
      },
      {
        sourceField: 'releaseDate',
        targetField: 'datePublished',
        transformer: (value: string) => this.formatDate(value),
      },
      {
        sourceField: 'developer',
        targetField: 'developer',
        transformer: (value: string) => this.createOrganization(value),
      },
      {
        sourceField: 'publisher',
        targetField: 'publisher',
        transformer: (value: string) => this.createOrganization(value),
      },
      {
        sourceField: 'imageUrl',
        targetField: 'image',
        transformer: (value: string | string[]) => this.createImageObjects(value),
      },
      {
        sourceField: 'trailerUrl',
        targetField: 'trailer',
        transformer: (value: string) => this.createVideoObject(value),
      },
    ]);
  }

  /**
   * 生成单个游戏的结构化数据
   */
  public async generateStructuredData(
    gameData: any,
    gameId?: string,
    schemaType?: SchemaGameType
  ): Promise<StructuredDataResult> {
    const startTime = Date.now();
    const cacheKey = gameId || JSON.stringify(gameData);
    
    // 检查缓存
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 1. 检测Schema类型
      const detectedType = schemaType || detectSchemaGameType(gameData);
      
      // 2. 数据映射和转换
      const mappedData = await this.mapGameData(gameData, detectedType);
      
      // 3. 数据验证
      const validationResult = this.config.enableValidation 
        ? this.validateSchemaData(mappedData)
        : { isValid: true, errors: [], warnings: [], score: 100 };
      
      // 4. 数据优化
      const optimizedData = this.config.enableOptimization
        ? this.optimizeSchemaData(mappedData)
        : mappedData;
      
      // 5. 生成输出格式
      const outputs = await this.generateOutputFormats(optimizedData);
      
      // 6. SEO评分
      const seoScore = this.calculateSeoScore(optimizedData);
      
      const result: StructuredDataResult = {
        success: true,
        data: optimizedData,
        ...outputs,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        validationScore: validationResult.score,
        seoScore,
        optimizations: this.getOptimizationSuggestions(optimizedData),
      };

      // 缓存结果
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        validationScore: 0,
        seoScore: 0,
        optimizations: [],
      };
    }
  }

  /**
   * 批量生成结构化数据
   */
  public async generateBatchStructuredData(
    gamesData: any[],
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
      schemaType?: SchemaGameType;
    } = {}
  ): Promise<BatchStructuredDataResult> {
    const startTime = Date.now();
    const { concurrency = 5, onProgress, schemaType } = options;
    const results = new Map<string, StructuredDataResult>();
    const errors: string[] = [];
    
    // 分批处理
    for (let i = 0; i < gamesData.length; i += concurrency) {
      const batch = gamesData.slice(i, i + concurrency);
      const batchPromises = batch.map((gameData, index) => 
        this.generateStructuredData(
          gameData,
          gameData.id || `game_${i + index}`,
          schemaType
        ).catch(error => ({
          success: false,
          errors: [error.message || 'Generation failed'],
          warnings: [],
          validationScore: 0,
          seoScore: 0,
          optimizations: [],
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // 收集结果
      batchResults.forEach((result, index) => {
        const gameId = batch[index].id || `game_${i + index}`;
        results.set(gameId, result);
        
        if (!result.success) {
          errors.push(`Game ${gameId}: ${result.errors.join(', ')}`);
        }
      });
      
      // 进度回调
      if (onProgress) {
        onProgress(Math.min(i + concurrency, gamesData.length), gamesData.length);
      }
    }

    const successful = Array.from(results.values()).filter(r => r.success).length;
    const failed = results.size - successful;
    const executionTime = Date.now() - startTime;

    return {
      total: gamesData.length,
      successful,
      failed,
      results,
      errors,
      executionTime,
    };
  }

  /**
   * 映射游戏数据到Schema.org格式
   */
  private async mapGameData(gameData: any, schemaType: SchemaGameType): Promise<SchemaGameData> {
    const rules = this.mappingRules.get(schemaType) || this.mappingRules.get('VideoGame')!;
    const template = this.getSchemaTemplate(schemaType);
    const mappedData: any = { ...template };

    // 应用映射规则
    for (const rule of rules) {
      const sourceValue = this.getNestedValue(gameData, rule.sourceField);
      
      if (sourceValue !== undefined) {
        const transformedValue = rule.transformer 
          ? rule.transformer(sourceValue)
          : sourceValue;
        
        if (rule.validator ? rule.validator(transformedValue) : true) {
          this.setNestedValue(mappedData, rule.targetField, transformedValue);
        }
      } else if (rule.required && rule.defaultValue !== undefined) {
        this.setNestedValue(mappedData, rule.targetField, rule.defaultValue);
      }
    }

    // 添加Schema类型特定的属性
    mappedData['@type'] = schemaType;
    
    // 添加应用类别
    if (!mappedData.applicationCategory) {
      mappedData.applicationCategory = ApplicationCategory.GameApplication;
    }

    return mappedData;
  }

  /**
   * 验证Schema数据
   */
  private validateSchemaData(data: SchemaGameData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // 使用验证规则
    for (const rule of VIDEO_GAME_VALIDATION_RULES) {
      const value = this.getNestedValue(data, rule.field);
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required field '${rule.field}' is missing`);
        score -= 10;
        continue;
      }
      
      if (value !== undefined && value !== null) {
        // 类型检查
        if (!this.validateFieldType(value, rule.type)) {
          errors.push(`Field '${rule.field}' has invalid type. Expected ${rule.type}`);
          score -= 5;
        }
        
        // 长度检查
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          warnings.push(`Field '${rule.field}' is shorter than recommended minimum (${rule.minLength})`);
          score -= 2;
        }
        
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          warnings.push(`Field '${rule.field}' exceeds maximum length (${rule.maxLength})`);
          score -= 1;
        }
        
        // 枚举值检查
        if (rule.enumValues && !rule.enumValues.includes(value)) {
          warnings.push(`Field '${rule.field}' value '${value}' is not in recommended values`);
          score -= 1;
        }
        
        // 自定义验证
        if (rule.customValidator && !rule.customValidator(value)) {
          errors.push(`Field '${rule.field}' failed custom validation`);
          score -= 5;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  /**
   * 优化Schema数据
   */
  private optimizeSchemaData(data: SchemaGameData): SchemaGameData {
    const optimized = { ...data };

    // 优化描述
    if (this.config.enhanceDescriptions && optimized.description) {
      optimized.description = this.enhanceDescription(optimized.description);
    }

    // 优化关键词
    if (this.config.prioritizeKeywords) {
      optimized.keywords = this.extractAndOptimizeKeywords(optimized);
    }

    // 压缩数据
    if (this.config.compressionLevel !== 'none') {
      return this.compressSchemaData(optimized);
    }

    return optimized;
  }

  /**
   * 生成输出格式
   */
  private async generateOutputFormats(data: SchemaGameData): Promise<{
    jsonLd?: string;
    microdata?: string;
    rdfa?: string;
  }> {
    const outputs: any = {};

    if (this.config.outputFormat === 'json-ld' || this.config.outputFormat === 'json-ld') {
      outputs.jsonLd = generateSchemaJsonLd(data);
    }

    if (this.config.outputFormat === 'microdata') {
      outputs.microdata = this.generateMicrodata(data);
    }

    if (this.config.outputFormat === 'rdfa') {
      outputs.rdfa = this.generateRdfa(data);
    }

    return outputs;
  }

  /**
   * 计算SEO评分
   */
  private calculateSeoScore(data: SchemaGameData): number {
    let score = 0;
    const maxScore = 100;

    // 基础信息 (30分)
    if (data.name && data.name.length >= 10) score += 10;
    if (data.description && data.description.length >= 100) score += 10;
    if (data.image) score += 5;
    if (data.url) score += 5;

    // 游戏特定信息 (25分)
    if (data.genre) score += 5;
    if (data.gamePlatform) score += 5;
    if (data.datePublished) score += 5;
    if (data.developer || data.publisher) score += 5;
    if (data.contentRating) score += 5;

    // 评分和评论 (20分)
    if (data.aggregateRating) {
      score += 10;
      if ((data.aggregateRating as AggregateRating).reviewCount && 
          (data.aggregateRating as AggregateRating).reviewCount! > 0) {
        score += 5;
      }
    }
    if (data.review && Array.isArray(data.review) && data.review.length > 0) {
      score += 5;
    }

    // 商业信息 (15分)
    if (data.offers) score += 10;
    if (data.isAccessibleForFree !== undefined) score += 5;

    // 媒体内容 (10分)
    if (data.trailer) score += 5;
    if (data.screenshot) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * 获取优化建议
   */
  private getOptimizationSuggestions(data: SchemaGameData): string[] {
    const suggestions: string[] = [];

    if (!data.description || data.description.length < 100) {
      suggestions.push('添加更详细的游戏描述(建议100字符以上)');
    }

    if (!data.aggregateRating) {
      suggestions.push('添加用户评分数据以提高搜索可见性');
    }

    if (!data.image) {
      suggestions.push('添加游戏封面图片');
    }

    if (!data.trailer && !data.screenshot) {
      suggestions.push('添加游戏预告片或截图');
    }

    if (!data.genre) {
      suggestions.push('指定游戏类型/风格');
    }

    if (!data.gamePlatform) {
      suggestions.push('指定支持的游戏平台');
    }

    if (!data.offers) {
      suggestions.push('添加价格信息');
    }

    if (!data.developer && !data.publisher) {
      suggestions.push('添加开发商或发行商信息');
    }

    if (!data.datePublished) {
      suggestions.push('添加发布日期');
    }

    if (!data.contentRating) {
      suggestions.push('添加内容评级(ESRB/PEGI等)');
    }

    return suggestions;
  }

  // 工具方法
  private getSchemaTemplate(schemaType: SchemaGameType): any {
    switch (schemaType) {
      case SchemaGameType.VideoGame:
        return { ...SCHEMA_TEMPLATES.basicVideoGame };
      case SchemaGameType.Game:
        return { ...SCHEMA_TEMPLATES.basicGame };
      case SchemaGameType.SoftwareApplication:
        return { ...SCHEMA_TEMPLATES.basicSoftwareApplication };
      default:
        return { ...SCHEMA_TEMPLATES.basicVideoGame };
    }
  }

  private mapGenres(value: string | string[]): string | string[] {
    const genres = Array.isArray(value) ? value : [value];
    return genres.map(genre => {
      const mapped = GAME_GENRE_MAPPING[genre];
      return mapped ? mapped[0] : genre;
    });
  }

  private mapPlatforms(value: string | string[]): string | string[] {
    const platforms = Array.isArray(value) ? value : [value];
    return platforms.map(platform => {
      const mapped = PLATFORM_MAPPING[platform];
      return mapped || platform;
    });
  }

  private createAggregateRating(value: any): AggregateRating | undefined {
    if (typeof value === 'number') {
      return {
        '@type': 'AggregateRating',
        ratingValue: value,
        bestRating: 5,
        ratingCount: 1,
      };
    }
    
    if (typeof value === 'object' && value.rating) {
      return {
        '@type': 'AggregateRating',
        ratingValue: value.rating,
        ratingCount: value.count || 1,
        reviewCount: value.reviewCount || 0,
        bestRating: value.maxRating || 5,
      };
    }
    
    return undefined;
  }

  private createOffer(price: number): Offer {
    return {
      '@type': 'Offer',
      price: price,
      priceCurrency: this.config.defaultCurrency || 'USD',
      availability: 'https://schema.org/InStock',
    };
  }

  private createOrganization(name: string): Organization {
    return {
      '@type': 'Organization',
      name: name,
    };
  }

  private createImageObjects(value: string | string[]): string | ImageObject | (string | ImageObject)[] {
    if (typeof value === 'string') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(url => ({
        '@type': 'ImageObject' as const,
        url: url,
      }));
    }
    
    return value;
  }

  private createVideoObject(url: string): VideoObject {
    return {
      '@type': 'VideoObject',
      name: 'Game Trailer',
      contentUrl: url,
    };
  }

  private formatDate(value: string): string {
    try {
      return new Date(value).toISOString().split('T')[0];
    } catch {
      return value;
    }
  }

  private enhanceDescription(description: string): string {
    if (!this.config.enhanceDescriptions) return description;
    
    // 添加SEO友好的增强
    let enhanced = description.trim();
    
    // 确保描述长度适当
    if (enhanced.length < 100) {
      enhanced += ' 这是一款优质的游戏，提供丰富的游戏体验和精彩的内容。';
    }
    
    return enhanced;
  }

  private extractAndOptimizeKeywords(data: SchemaGameData): string[] {
    const keywords = new Set<string>();
    
    // 从游戏名称提取
    if (data.name) {
      data.name.split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word.toLowerCase());
      });
    }
    
    // 从类型提取
    if (data.genre) {
      const genres = Array.isArray(data.genre) ? data.genre : [data.genre];
      genres.forEach(genre => keywords.add(genre.toLowerCase()));
    }
    
    // 从平台提取
    if (data.gamePlatform) {
      const platforms = Array.isArray(data.gamePlatform) ? data.gamePlatform : [data.gamePlatform];
      platforms.forEach(platform => keywords.add(platform.toLowerCase()));
    }
    
    return Array.from(keywords).slice(0, 10); // 限制关键词数量
  }

  private compressSchemaData(data: SchemaGameData): SchemaGameData {
    const compressed = { ...data };
    
    if (this.config.compressionLevel === 'aggressive') {
      // 移除空值和不必要的属性
      Object.keys(compressed).forEach(key => {
        const value = (compressed as any)[key];
        if (value === undefined || value === null || value === '') {
          delete (compressed as any)[key];
        }
      });
    }
    
    return compressed;
  }

  private generateMicrodata(data: SchemaGameData): string {
    // 简化的Microdata生成
    return `<div itemscope itemtype="https://schema.org/${data['@type']}">
      <span itemprop="name">${data.name}</span>
      ${data.description ? `<span itemprop="description">${data.description}</span>` : ''}
    </div>`;
  }

  private generateRdfa(data: SchemaGameData): string {
    // 简化的RDFa生成
    return `<div typeof="schema:${data['@type']}">
      <span property="schema:name">${data.name}</span>
      ${data.description ? `<span property="schema:description">${data.description}</span>` : ''}
    </div>`;
  }

  private validateFieldType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'url':
        return typeof value === 'string' && /^https?:\/\//.test(value);
      case 'date':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return true;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<StructuredDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 如果禁用缓存，清除现有缓存
    if (!this.config.enableCaching) {
      this.clearCache();
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): StructuredDataConfig {
    return { ...this.config };
  }
} 