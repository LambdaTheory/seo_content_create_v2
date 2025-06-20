/**
 * 标准化配置
 */
export interface NormalizationConfig {
  /** 是否移除特殊字符 */
  removeSpecialChars: boolean;
  /** 是否标准化大小写 */
  normalizeCasing: boolean;
  /** 是否标准化空格 */
  normalizeSpaces: boolean;
  /** 是否展开缩写 */
  expandAbbreviations: boolean;
  /** 是否移除停用词 */
  removeStopWords: boolean;
  /** 是否标准化数字 */
  normalizeNumbers: boolean;
  /** 自定义替换规则 */
  customReplacements?: Map<string, string>;
}

/**
 * 标准化结果
 */
export interface NormalizationResult {
  /** 原始名称 */
  original: string;
  /** 标准化后的名称 */
  normalized: string;
  /** 应用的规则 */
  appliedRules: string[];
  /** 处理步骤 */
  steps: {
    step: string;
    before: string;
    after: string;
    rule: string;
  }[];
}

/**
 * 游戏名称标准化服务
 * 功能特性：
 * - 去除特殊字符
 * - 大小写标准化
 * - 空格和连字符处理
 * - 常见缩写展开
 * - 停用词移除
 * - 数字标准化
 * - 自定义规则支持
 */
export class GameNameNormalizationService {
  private readonly DEFAULT_CONFIG: NormalizationConfig = {
    removeSpecialChars: true,
    normalizeCasing: true,
    normalizeSpaces: true,
    expandAbbreviations: true,
    removeStopWords: true,
    normalizeNumbers: true
  };

  /** 常见游戏缩写映射 */
  private readonly GAME_ABBREVIATIONS = new Map([
    // 常见游戏词汇缩写
    ['rpg', 'role playing game'],
    ['fps', 'first person shooter'],
    ['rts', 'real time strategy'],
    ['mmo', 'massively multiplayer online'],
    ['mmorpg', 'massively multiplayer online role playing game'],
    ['pvp', 'player versus player'],
    ['pve', 'player versus environment'],
    ['dlc', 'downloadable content'],
    ['ai', 'artificial intelligence'],
    ['npc', 'non player character'],
    ['ui', 'user interface'],
    ['vr', 'virtual reality'],
    ['ar', 'augmented reality'],
    
    // 数字和序号
    ['1st', 'first'],
    ['2nd', 'second'],
    ['3rd', 'third'],
    ['4th', 'fourth'],
    ['5th', 'fifth'],
    
    // 常见词汇缩写
    ['vs', 'versus'],
    ['&', 'and'],
    ['w/', 'with'],
    ['w/o', 'without'],
    ['pt', 'part'],
    ['vol', 'volume'],
    ['ch', 'chapter'],
    ['ep', 'episode'],
    ['ed', 'edition'],
    ['exp', 'expansion'],
    ['ext', 'extended'],
    ['std', 'standard'],
    ['def', 'definitive'],
    ['ult', 'ultimate'],
    ['delx', 'deluxe'],
    ['spec', 'special'],
    ['ltd', 'limited'],
    ['remix', 'remixed'],
    ['hd', 'high definition'],
    ['4k', 'four thousand'],
    
    // 游戏术语
    ['char', 'character'],
    ['chars', 'characters'],
    ['lvl', 'level'],
    ['max', 'maximum'],
    ['min', 'minimum'],
    ['dmg', 'damage'],
    ['hp', 'health points'],
    ['mp', 'magic points'],
    ['exp', 'experience'],
    ['xp', 'experience points'],
    
    // 平台缩写
    ['pc', 'personal computer'],
    ['mac', 'macintosh'],
    ['ps', 'playstation'],
    ['xbox', 'x box'],
    ['nintendo', 'nintendo'],
    ['steam', 'steam'],
    ['epic', 'epic games']
  ]);

  /** 游戏停用词 */
  private readonly GAME_STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'game', 'games', 'play', 'player', 'online', 'free', 'new', 'best', 'top', 'super',
    'classic', 'original', 'official', 'full', 'complete', 'ultimate', 'final', 'special',
    'edition', 'version', 'remake', 'remaster', 'remastered', 'enhanced', 'improved',
    'collection', 'series', 'saga', 'trilogy', 'pack', 'bundle'
  ]);

  /** 特殊字符正则表达式 */
  private readonly SPECIAL_CHARS_REGEX = /[^\w\s\-]/g;
  
  /** 多空格正则表达式 */
  private readonly MULTI_SPACE_REGEX = /\s+/g;
  
  /** 数字序列正则表达式 */
  private readonly NUMBER_SEQUENCE_REGEX = /\b\d+\b/g;

  /**
   * 标准化游戏名称
   * @param gameName - 原始游戏名称
   * @param config - 标准化配置
   * @returns NormalizationResult
   */
  public normalize(gameName: string, config?: Partial<NormalizationConfig>): NormalizationResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const steps: NormalizationResult['steps'] = [];
    const appliedRules: string[] = [];
    
    let current = gameName.trim();
    const original = current;

    // 1. 移除特殊字符
    if (finalConfig.removeSpecialChars) {
      const before = current;
      current = this.removeSpecialCharacters(current);
      if (before !== current) {
        steps.push({
          step: '移除特殊字符',
          before,
          after: current,
          rule: 'removeSpecialChars'
        });
        appliedRules.push('removeSpecialChars');
      }
    }

    // 2. 标准化大小写
    if (finalConfig.normalizeCasing) {
      const before = current;
      current = this.normalizeCasing(current);
      if (before !== current) {
        steps.push({
          step: '标准化大小写',
          before,
          after: current,
          rule: 'normalizeCasing'
        });
        appliedRules.push('normalizeCasing');
      }
    }

    // 3. 标准化空格和连字符
    if (finalConfig.normalizeSpaces) {
      const before = current;
      current = this.normalizeSpaces(current);
      if (before !== current) {
        steps.push({
          step: '标准化空格',
          before,
          after: current,
          rule: 'normalizeSpaces'
        });
        appliedRules.push('normalizeSpaces');
      }
    }

    // 4. 展开缩写
    if (finalConfig.expandAbbreviations) {
      const before = current;
      current = this.expandAbbreviations(current, finalConfig.customReplacements);
      if (before !== current) {
        steps.push({
          step: '展开缩写',
          before,
          after: current,
          rule: 'expandAbbreviations'
        });
        appliedRules.push('expandAbbreviations');
      }
    }

    // 5. 移除停用词
    if (finalConfig.removeStopWords) {
      const before = current;
      current = this.removeStopWords(current);
      if (before !== current) {
        steps.push({
          step: '移除停用词',
          before,
          after: current,
          rule: 'removeStopWords'
        });
        appliedRules.push('removeStopWords');
      }
    }

    // 6. 标准化数字
    if (finalConfig.normalizeNumbers) {
      const before = current;
      current = this.normalizeNumbers(current);
      if (before !== current) {
        steps.push({
          step: '标准化数字',
          before,
          after: current,
          rule: 'normalizeNumbers'
        });
        appliedRules.push('normalizeNumbers');
      }
    }

    // 最终清理
    current = current.trim().replace(this.MULTI_SPACE_REGEX, ' ');

    return {
      original,
      normalized: current,
      appliedRules,
      steps
    };
  }

  /**
   * 批量标准化游戏名称
   * @param gameNames - 游戏名称列表
   * @param config - 标准化配置
   * @returns NormalizationResult[]
   */
  public batchNormalize(gameNames: string[], config?: Partial<NormalizationConfig>): NormalizationResult[] {
    return gameNames.map(name => this.normalize(name, config));
  }

  /**
   * 移除特殊字符
   * @param text - 文本
   * @returns 处理后的文本
   */
  private removeSpecialCharacters(text: string): string {
    return text
      .replace(this.SPECIAL_CHARS_REGEX, ' ') // 将特殊字符替换为空格
      .replace(/[\-_]+/g, ' ') // 将连字符和下划线替换为空格
      .replace(this.MULTI_SPACE_REGEX, ' ') // 合并多个空格
      .trim();
  }

  /**
   * 标准化大小写
   * @param text - 文本
   * @returns 处理后的文本
   */
  private normalizeCasing(text: string): string {
    return text
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase()); // 首字母大写
  }

  /**
   * 标准化空格和连字符
   * @param text - 文本
   * @returns 处理后的文本
   */
  private normalizeSpaces(text: string): string {
    return text
      .replace(/[\-_]+/g, ' ') // 连字符转空格
      .replace(this.MULTI_SPACE_REGEX, ' ') // 合并多空格
      .trim();
  }

  /**
   * 展开缩写
   * @param text - 文本
   * @param customReplacements - 自定义替换规则
   * @returns 处理后的文本
   */
  private expandAbbreviations(text: string, customReplacements?: Map<string, string>): string {
    let result = text.toLowerCase();
    
    // 应用内置缩写展开
    for (const [abbr, expansion] of this.GAME_ABBREVIATIONS) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      result = result.replace(regex, expansion);
    }
    
    // 应用自定义替换规则
    if (customReplacements) {
      for (const [pattern, replacement] of customReplacements) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        result = result.replace(regex, replacement);
      }
    }
    
    return result;
  }

  /**
   * 移除停用词
   * @param text - 文本
   * @returns 处理后的文本
   */
  private removeStopWords(text: string): string {
    const words = text.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => !this.GAME_STOP_WORDS.has(word));
    
    // 确保至少保留一个词
    if (filteredWords.length === 0) {
      return words[0] || text;
    }
    
    return filteredWords.join(' ');
  }

  /**
   * 标准化数字
   * @param text - 文本
   * @returns 处理后的文本
   */
  private normalizeNumbers(text: string): string {
    return text.replace(this.NUMBER_SEQUENCE_REGEX, (match) => {
      const num = parseInt(match, 10);
      
      // 将常见数字转换为文字
      const numberWords: { [key: number]: string } = {
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine',
        10: 'ten'
      };
      
      return numberWords[num] || match;
    });
  }

  /**
   * 创建标准化词典
   * @param gameNames - 游戏名称列表
   * @param config - 标准化配置
   * @returns Map<string, string> 原始名称到标准化名称的映射
   */
  public createNormalizationDictionary(
    gameNames: string[], 
    config?: Partial<NormalizationConfig>
  ): Map<string, string> {
    const dictionary = new Map<string, string>();
    
    for (const name of gameNames) {
      const result = this.normalize(name, config);
      dictionary.set(name, result.normalized);
    }
    
    return dictionary;
  }

  /**
   * 查找相似的标准化名称
   * @param targetName - 目标名称
   * @param candidateNames - 候选名称列表
   * @param config - 标准化配置
   * @returns 标准化后相同的名称列表
   */
  public findSimilarNormalizedNames(
    targetName: string, 
    candidateNames: string[], 
    config?: Partial<NormalizationConfig>
  ): string[] {
    const targetNormalized = this.normalize(targetName, config).normalized;
    const matches: string[] = [];
    
    for (const candidate of candidateNames) {
      const candidateNormalized = this.normalize(candidate, config).normalized;
      if (targetNormalized === candidateNormalized) {
        matches.push(candidate);
      }
    }
    
    return matches;
  }

  /**
   * 获取默认配置
   * @returns NormalizationConfig
   */
  public getDefaultConfig(): NormalizationConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * 验证配置
   * @param config - 配置对象
   * @returns 是否有效
   */
  public validateConfig(config: Partial<NormalizationConfig>): boolean {
    try {
      // 基本类型检查
      if (config.removeSpecialChars !== undefined && typeof config.removeSpecialChars !== 'boolean') {
        return false;
      }
      if (config.normalizeCasing !== undefined && typeof config.normalizeCasing !== 'boolean') {
        return false;
      }
      if (config.normalizeSpaces !== undefined && typeof config.normalizeSpaces !== 'boolean') {
        return false;
      }
      if (config.expandAbbreviations !== undefined && typeof config.expandAbbreviations !== 'boolean') {
        return false;
      }
      if (config.removeStopWords !== undefined && typeof config.removeStopWords !== 'boolean') {
        return false;
      }
      if (config.normalizeNumbers !== undefined && typeof config.normalizeNumbers !== 'boolean') {
        return false;
      }
      
      // 自定义替换规则检查
      if (config.customReplacements !== undefined) {
        if (!(config.customReplacements instanceof Map)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取内置缩写词典
   * @returns Map<string, string>
   */
  public getBuiltinAbbreviations(): Map<string, string> {
    return new Map(this.GAME_ABBREVIATIONS);
  }

  /**
   * 获取内置停用词
   * @returns Set<string>
   */
  public getBuiltinStopWords(): Set<string> {
    return new Set(this.GAME_STOP_WORDS);
  }

  /**
   * 添加自定义缩写
   * @param abbreviation - 缩写
   * @param expansion - 展开形式
   */
  public addCustomAbbreviation(abbreviation: string, expansion: string): void {
    this.GAME_ABBREVIATIONS.set(abbreviation.toLowerCase(), expansion.toLowerCase());
  }

  /**
   * 添加自定义停用词
   * @param stopWord - 停用词
   */
  public addCustomStopWord(stopWord: string): void {
    this.GAME_STOP_WORDS.add(stopWord.toLowerCase());
  }

  /**
   * 移除自定义缩写
   * @param abbreviation - 缩写
   */
  public removeCustomAbbreviation(abbreviation: string): void {
    this.GAME_ABBREVIATIONS.delete(abbreviation.toLowerCase());
  }

  /**
   * 移除自定义停用词
   * @param stopWord - 停用词
   */
  public removeCustomStopWord(stopWord: string): void {
    this.GAME_STOP_WORDS.delete(stopWord.toLowerCase());
  }
}

// 导出单例实例
export const gameNameNormalizationService = new GameNameNormalizationService(); 