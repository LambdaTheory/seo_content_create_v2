/**
 * CoolMathGames网站解析器
 * 专门用于解析CoolMathGames.com网站的游戏内容
 */

import { WebsiteParser, ParseConfig, ParseResult, ParsedGameContent } from '../WebContentParsingService';

export class CoolMathGamesParser implements WebsiteParser {
  name = 'CoolMathGames';
  domains = ['coolmathgames.com', 'www.coolmathgames.com'];

  canParse(url: string): boolean {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return this.domains.some(d => domain.includes(d));
    } catch {
      return false;
    }
  }

  parse(html: string, url: string, config: ParseConfig): ParseResult {
    const startTime = Date.now();
    
    try {
      // 使用DOMParser解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取游戏标题
      const title = this.extractTitle(doc);
      
      // 提取游戏描述
      const description = this.extractDescription(doc);
      
      // 提取玩法说明
      const instructions = this.extractInstructions(doc);
      
      // 提取特色功能
      const features = this.extractFeatures(doc);
      
      // 提取游戏标签
      const tags = this.extractTags(doc);
      
      // 提取游戏分类
      const category = this.extractCategory(doc);
      
      // 提取缩略图
      const thumbnail = this.extractThumbnail(doc, url);
      
      // 提取评分
      const rating = this.extractRating(doc);

      // 计算内容质量评分
      const qualityScore = this.calculateQualityScore({
        title,
        description,
        instructions,
        features,
        tags,
        category
      });

      const content: ParsedGameContent = {
        title: config.enableTextCleaning ? this.cleanText(title) : title,
        description: config.enableTextCleaning ? this.cleanText(description) : description,
        instructions: instructions ? (config.enableTextCleaning ? this.cleanText(instructions) : instructions) : undefined,
        features: features?.map(f => config.enableTextCleaning ? this.cleanText(f) : f),
        tags: tags?.map(t => config.enableTextCleaning ? this.cleanText(t) : t),
        category: category ? (config.enableTextCleaning ? this.cleanText(category) : category) : undefined,
        thumbnail,
        gameUrl: url,
        rating
      };

      return {
        success: true,
        content,
        parser: this.name,
        parseTime: Date.now() - startTime,
        qualityScore,
        confidence: Math.min(qualityScore / 100, 1)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        parser: this.name,
        parseTime: Date.now() - startTime,
        qualityScore: 0,
        confidence: 0
      };
    }
  }

  private extractTitle(doc: Document): string {
    // 尝试多种选择器获取标题
    const selectors = [
      'h1.game-title',
      '.game-header h1',
      'h1[data-testid="game-title"]',
      '.page-title h1',
      'h1',
      '.title',
      '.game-name',
      '[data-game-title]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 回退到页面标题
    const titleElement = doc.querySelector('title');
    return titleElement?.textContent?.replace(' - Cool Math Games', '').trim() || '';
  }

  private extractDescription(doc: Document): string {
    const selectors = [
      '.game-description',
      '.description',
      'meta[name="description"]',
      '.game-info p',
      '.intro-text',
      '.game-summary',
      '[data-game-description]',
      '.content .description'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        if (element.tagName === 'META') {
          const content = element.getAttribute('content');
          if (content?.trim()) return content.trim();
        } else if (element.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
    }

    return '';
  }

  private extractInstructions(doc: Document): string | undefined {
    const selectors = [
      '.game-instructions',
      '.how-to-play',
      '.controls',
      '.gameplay',
      '.instructions',
      '.game-controls',
      '[data-instructions]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 尝试查找包含"How to play"或"Instructions"的段落
    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.toLowerCase() || '';
      if ((text.includes('how to play') || text.includes('instructions') || text.includes('controls')) && text.length > 20) {
        return p.textContent?.trim();
      }
    }

    return undefined;
  }

  private extractFeatures(doc: Document): string[] | undefined {
    const features: string[] = [];
    
    const selectors = [
      '.features li',
      '.game-features li',
      '.highlights li',
      '.feature-list li',
      '[data-features] li'
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) features.push(text);
      });
    }

    // 如果没有找到列表项，尝试查找特色描述
    if (features.length === 0) {
      const featureSelectors = [
        '.features',
        '.game-features',
        '.highlights'
      ];

      for (const selector of featureSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          // 尝试按句号或换行符分割特色功能
          const text = element.textContent.trim();
          const splitFeatures = text.split(/[.\n]/).filter(f => f.trim().length > 3);
          if (splitFeatures.length > 0) {
            features.push(...splitFeatures.map(f => f.trim()));
            break;
          }
        }
      }
    }

    return features.length > 0 ? features : undefined;
  }

  private extractTags(doc: Document): string[] | undefined {
    const tags: string[] = [];
    
    const selectors = [
      '.tags .tag',
      '.game-tags a',
      '.categories a',
      '.tag-list .tag',
      '[data-tags] .tag',
      '.keyword-tags a'
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) tags.push(text);
      });
    }

    // 尝试从关键词meta标签获取
    if (tags.length === 0) {
      const keywordsMeta = doc.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        const keywords = keywordsMeta.getAttribute('content');
        if (keywords) {
          const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
          tags.push(...keywordList);
        }
      }
    }

    return tags.length > 0 ? [...new Set(tags)] : undefined; // 去重
  }

  private extractCategory(doc: Document): string | undefined {
    const selectors = [
      '.category',
      '.game-category',
      '.breadcrumb .category',
      '[data-category]',
      '.nav-category.active',
      '.genre'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 尝试从面包屑导航获取分类
    const breadcrumb = doc.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
    if (breadcrumb) {
      const links = breadcrumb.querySelectorAll('a');
      if (links.length > 1) {
        // 通常第二个链接是分类
        const categoryLink = links[1];
        if (categoryLink?.textContent?.trim()) {
          return categoryLink.textContent.trim();
        }
      }
    }

    return undefined;
  }

  private extractThumbnail(doc: Document, baseUrl: string): string | undefined {
    const selectors = [
      '.game-thumbnail img',
      '.game-image img',
      '.screenshot img',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.preview-image img',
      '[data-game-image] img'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let src: string | null = null;
        
        if (element.tagName === 'META') {
          src = element.getAttribute('content');
        } else if (element.tagName === 'IMG') {
          src = element.getAttribute('src') || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
        }

        if (src) {
          try {
            // 处理相对URL
            const imageUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
            return imageUrl;
          } catch {
            continue;
          }
        }
      }
    }

    return undefined;
  }

  private extractRating(doc: Document): number | undefined {
    const selectors = [
      '.rating',
      '.score',
      '.stars',
      '.game-rating',
      '[data-rating]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        const ratingText = element.textContent.trim();
        
        // 尝试匹配数字格式的评分
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          const rating = parseFloat(ratingMatch[1]);
          // 确保评分在合理范围内
          if (rating >= 0 && rating <= 10) {
            return rating;
          }
        }

        // 尝试星级评分
        const starMatch = ratingText.match(/(\d+)\s*\/\s*5\s*stars?/i);
        if (starMatch) {
          const stars = parseInt(starMatch[1]);
          return (stars / 5) * 10; // 转换为10分制
        }
      }
    }

    // 尝试从星星元素计算评分
    const starElements = doc.querySelectorAll('.star.filled, .star.active, .fa-star, .rating-star.filled');
    if (starElements.length > 0) {
      return (starElements.length / 5) * 10; // 假设满分5星，转换为10分制
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .replace(/[\r\n\t]/g, ' ') // 换行符和制表符替换为空格
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, '') // 移除非打印字符，保留中英文
      .trim();
  }

  private calculateQualityScore(content: Partial<ParsedGameContent>): number {
    let score = 0;
    
    // 标题评分 (0-20分)
    if (content.title) {
      if (content.title.length > 3) score += 10;
      if (content.title.length > 10) score += 5;
      if (content.title.length > 20) score += 5;
    }
    
    // 描述评分 (0-30分)
    if (content.description) {
      if (content.description.length > 20) score += 10;
      if (content.description.length > 50) score += 10;
      if (content.description.length > 100) score += 10;
    }
    
    // 玩法说明评分 (0-15分)
    if (content.instructions) {
      if (content.instructions.length > 10) score += 8;
      if (content.instructions.length > 50) score += 7;
    }
    
    // 特色功能评分 (0-10分)
    if (content.features && content.features.length > 0) {
      score += Math.min(content.features.length * 2, 10);
    }
    
    // 标签评分 (0-10分)
    if (content.tags && content.tags.length > 0) {
      score += Math.min(content.tags.length * 2, 10);
    }
    
    // 分类评分 (0-5分)
    if (content.category) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }
} 