import { DataValidationService, ValidationRules } from './dataValidation';
import { GameData } from '@/types/GameData.types';

describe('DataValidationService', () => {
  
  describe('validateGameData', () => {
    it('应该通过有效的游戏数据验证', () => {
      const validData: GameData = {
        gameName: 'Test Game',
        mainKeyword: 'test game',
        longTailKeywords: 'test, game, play',
        videoLink: 'https://www.youtube.com/watch?v=test',
        internalLinks: 'https://example.com/page1, https://example.com/page2',
        competitorPages: 'https://competitor.com/game1',
        iconUrl: 'https://example.com/icon.png',
        realUrl: 'https://example.com/game'
      };

      const result = DataValidationService.validateGameData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测必填字段缺失', () => {
      const invalidData: Partial<GameData> = {
        longTailKeywords: 'test, game',
        videoLink: 'https://www.youtube.com/watch?v=test'
      };

      const result = DataValidationService.validateGameData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // gameName, mainKeyword, realUrl
      
      const errorFields = result.errors.map(error => error.field);
      expect(errorFields).toContain('gameName');
      expect(errorFields).toContain('mainKeyword');
      expect(errorFields).toContain('realUrl');
    });

    it('应该验证游戏名称长度', () => {
      const shortNameData: Partial<GameData> = {
        gameName: 'A',
        mainKeyword: 'test',
        realUrl: 'https://example.com/game'
      };

      const result = DataValidationService.validateGameData(shortNameData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.field === 'gameName' && error.type === 'length'
      )).toBe(true);
    });

    it('应该检测无效的URL格式', () => {
      const invalidUrlData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        realUrl: 'invalid-url',
        videoLink: 'not-a-url',
        iconUrl: 'bad-url'
      };

      const result = DataValidationService.validateGameData(invalidUrlData);

      expect(result.isValid).toBe(false);
      
      const urlErrors = result.errors.filter(error => error.type === 'url');
      expect(urlErrors.length).toBeGreaterThan(0);
    });

    it('应该检测特殊字符在关键词中', () => {
      const specialCharData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test<script>',
        realUrl: 'https://example.com/game'
      };

      const result = DataValidationService.validateGameData(specialCharData);

      expect(result.warnings.some(warning => 
        warning.field === 'mainKeyword' && warning.message.includes('特殊字符')
      )).toBe(true);
    });

    it('应该检测长尾关键词数量过多', () => {
      const manyKeywordsData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        longTailKeywords: Array(15).fill('keyword').join(', '),
        realUrl: 'https://example.com/game'
      };

      const result = DataValidationService.validateGameData(manyKeywordsData);

      expect(result.warnings.some(warning => 
        warning.field === 'longTailKeywords' && warning.message.includes('数量过多')
      )).toBe(true);
    });

    it('应该建议使用HTTPS协议', () => {
      const httpData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        realUrl: 'http://example.com/game',
        videoLink: 'http://youtube.com/watch?v=test'
      };

      const result = DataValidationService.validateGameData(httpData);

      const httpsWarnings = result.warnings.filter(warning => 
        warning.message.includes('HTTPS')
      );
      expect(httpsWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateBatch', () => {
    it('应该批量验证多个游戏数据', () => {
      const dataList: Partial<GameData>[] = [
        {
          gameName: 'Game 1',
          mainKeyword: 'game1',
          realUrl: 'https://example.com/game1'
        },
        {
          gameName: 'Game 2',
          // 缺少 mainKeyword
          realUrl: 'https://example.com/game2'
        },
        {
          gameName: 'Game 3',
          mainKeyword: 'game3',
          realUrl: 'invalid-url'
        }
      ];

      const results = DataValidationService.validateBatch(dataList);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(false);
    });
  });

  describe('cleanData', () => {
    it('应该清理字符串字段的空格', () => {
      const dirtyData: Partial<GameData> = {
        gameName: '  Test Game  ',
        mainKeyword: '  test   game  ',
        realUrl: '  https://example.com/game  '
      };

      const cleaned = DataValidationService.cleanData(dirtyData);

      expect(cleaned.gameName).toBe('Test Game');
      expect(cleaned.mainKeyword).toBe('test game');
      expect(cleaned.realUrl).toBe('https://example.com/game');
    });

    it('应该移除主关键词中的特殊字符', () => {
      const specialCharData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test<script>&"\'game',
        realUrl: 'https://example.com/game'
      };

      const cleaned = DataValidationService.cleanData(specialCharData);

      expect(cleaned.mainKeyword).toBe('testscriptgame');
    });

    it('应该自动添加HTTPS协议', () => {
      const noProtocolData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        realUrl: 'example.com/game',
        videoLink: 'youtube.com/watch?v=test',
        iconUrl: 'example.com/icon.png'
      };

      const cleaned = DataValidationService.cleanData(noProtocolData);

      expect(cleaned.realUrl).toBe('https://example.com/game');
      expect(cleaned.videoLink).toBe('https://youtube.com/watch?v=test');
      expect(cleaned.iconUrl).toBe('https://example.com/icon.png');
    });

    it('应该清理长尾关键词', () => {
      const messyKeywordsData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        longTailKeywords: '  keyword1  ,  , keyword2<script> , , keyword3  ',
        realUrl: 'https://example.com/game'
      };

      const cleaned = DataValidationService.cleanData(messyKeywordsData);

      expect(cleaned.longTailKeywords).toBe('keyword1, keyword2script, keyword3');
    });

    it('应该清理多URL字段', () => {
      const messyUrlsData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        internalLinks: '  example.com/page1  ,  , example.com/page2  ',
        competitorPages: 'competitor.com/game1, competitor.com/game2',
        realUrl: 'https://example.com/game'
      };

      const cleaned = DataValidationService.cleanData(messyUrlsData);

      expect(cleaned.internalLinks).toBe('https://example.com/page1, https://example.com/page2');
      expect(cleaned.competitorPages).toBe('https://competitor.com/game1, https://competitor.com/game2');
    });
  });

  describe('getRepairSuggestions', () => {
    it('应该为必填字段错误提供手动修复建议', () => {
      const invalidData: Partial<GameData> = {
        longTailKeywords: 'test'
      };

      const validation = DataValidationService.validateGameData(invalidData);
      const suggestions = DataValidationService.getRepairSuggestions(validation);

      const manualSuggestions = suggestions.filter(s => s.type === 'manual');
      expect(manualSuggestions.length).toBeGreaterThan(0);
      
      const requiredFieldSuggestions = manualSuggestions.filter(s => 
        s.message.includes('请填写')
      );
      expect(requiredFieldSuggestions.length).toBeGreaterThan(0);
    });

    it('应该为URL错误提供自动修复建议', () => {
      const invalidUrlData: Partial<GameData> = {
        gameName: 'Test Game',
        mainKeyword: 'test',
        realUrl: 'invalid-url'
      };

      const validation = DataValidationService.validateGameData(invalidUrlData);
      const suggestions = DataValidationService.getRepairSuggestions(validation);

      const autoSuggestions = suggestions.filter(s => s.type === 'auto');
      expect(autoSuggestions.length).toBeGreaterThan(0);
      
      const urlRepairSuggestions = autoSuggestions.filter(s => 
        s.message.includes('URL格式')
      );
      expect(urlRepairSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('ValidationRules', () => {
    it('应该包含正确的必填字段', () => {
      expect(ValidationRules.requiredFields).toContain('gameName');
      expect(ValidationRules.requiredFields).toContain('mainKeyword');
      expect(ValidationRules.requiredFields).toContain('realUrl');
    });

    it('应该包含字段长度限制', () => {
      expect(ValidationRules.fieldLengths.gameName.min).toBe(2);
      expect(ValidationRules.fieldLengths.gameName.max).toBe(100);
      expect(ValidationRules.fieldLengths.mainKeyword.min).toBe(2);
      expect(ValidationRules.fieldLengths.mainKeyword.max).toBe(50);
    });

    it('应该包含URL字段列表', () => {
      expect(ValidationRules.urlFields).toContain('videoLink');
      expect(ValidationRules.urlFields).toContain('iconUrl');
      expect(ValidationRules.urlFields).toContain('realUrl');
    });

    it('应该包含正确的正则表达式', () => {
      expect(ValidationRules.specialCharsRegex.test('<script>')).toBe(true);
      expect(ValidationRules.urlProtocolRegex.test('https://example.com')).toBe(true);
      expect(ValidationRules.multiSpaceRegex.test('test   game')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('应该处理空数据', () => {
      const result = DataValidationService.validateGameData({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该处理null和undefined值', () => {
      const nullData: Partial<GameData> = {
        gameName: undefined,
        mainKeyword: null as any,
        realUrl: ''
      };

      const result = DataValidationService.validateGameData(nullData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该处理极长的字符串', () => {
      const longStringData: Partial<GameData> = {
        gameName: 'A'.repeat(200),
        mainKeyword: 'test',
        realUrl: 'https://example.com/game'
      };

      const result = DataValidationService.validateGameData(longStringData);
      
      expect(result.warnings.some(warning => 
        warning.field === 'gameName' && warning.message.includes('建议控制')
      )).toBe(true);
    });

    it('应该处理特殊Unicode字符', () => {
      const unicodeData: Partial<GameData> = {
        gameName: '测试游戏🎮',
        mainKeyword: '测试关键词',
        realUrl: 'https://example.com/游戏'
      };

      const result = DataValidationService.validateGameData(unicodeData);
      
      // Unicode字符应该被接受
      expect(result.isValid).toBe(true);
    });

    it('应该处理空白字符串', () => {
      const whitespaceData: Partial<GameData> = {
        gameName: '   ',
        mainKeyword: '\t\n',
        realUrl: '  '
      };

      const result = DataValidationService.validateGameData(whitespaceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
}); 