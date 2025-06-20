/**
 * TwoPlayerGames网站解析器
 * 专门用于解析TwoPlayerGames.org网站的游戏内容
 */

import { WebsiteParser, ParseConfig, ParseResult, ParsedGameContent } from '../WebContentParsingService';

export class TwoPlayerGamesParser implements WebsiteParser {
  name = 'TwoPlayerGames';
  domains = ['2playergames.org', 'www.2playergames.org', 'twoplayergames.org', 'www.twoplayergames.org'];

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
    // TwoPlayerGames特定的选择器
    const selectors = [
      '.game-title h1',
      '.game-title',
      '.game-name',
      'h1.title',
      '.page-title h1',
      '.content-title h1',
      'h1',
      '.title',
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
    return titleElement?.textContent?.replace(/\s*-\s*2 Player Games/i, '').trim() || '';
  }

  private extractDescription(doc: Document): string {
    const selectors = [
      '.game-description',
      '.description',
      'meta[name="description"]',
      '.game-info',
      '.game-summary',
      '.intro-text',
      '.content-description',
      '[data-game-description]',
      '.game-about'
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

    // 尝试从第一个段落获取描述
    const firstParagraph = doc.querySelector('.content p, .game-content p, p');
    if (firstParagraph?.textContent?.trim() && firstParagraph.textContent.length > 30) {
      return firstParagraph.textContent.trim();
    }

    return '';
  }

  private extractInstructions(doc: Document): string | undefined {
    const selectors = [
      '.game-instructions',
      '.instructions',
      '.how-to-play',
      '.controls',
      '.game-controls',
      '.player-controls',
      '.gameplay-instructions',
      '[data-instructions]',
      '.control-info'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 查找包含控制说明的段落
    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.toLowerCase() || '';
      if ((text.includes('player 1') || text.includes('player 2') || text.includes('controls') || text.includes('use arrow keys') || text.includes('wasd')) && text.length > 20) {
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
      '.feature-list li',
      '.highlights li',
      '.specs li',
      '[data-features] li'
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) features.push(text);
      });
    }

    // 如果没有找到列表项，尝试从描述中提取特色
    if (features.length === 0) {
      // 添加双人游戏特有的特性
      const description = this.extractDescription(doc).toLowerCase();
      
      if (description.includes('two player') || description.includes('2 player') || description.includes('multiplayer')) {
        features.push('Two Player Game');
      }
      
      if (description.includes('single player') || description.includes('1 player')) {
        features.push('Single Player Mode');
      }
      
      if (description.includes('keyboard') || description.includes('arrow keys') || description.includes('wasd')) {
        features.push('Keyboard Controls');
      }
      
      if (description.includes('online') || description.includes('browser')) {
        features.push('Browser Based');
      }
      
      if (description.includes('action') || description.includes('fighting')) {
        features.push('Action Game');
      }
      
      if (description.includes('puzzle') || description.includes('strategy')) {
        features.push('Strategy Game');
      }
    }

    return features.length > 0 ? features : undefined;
  }

  private extractTags(doc: Document): string[] | undefined {
    const tags: string[] = [];
    
    const selectors = [
      '.game-tags .tag',
      '.tags a',
      '.categories a',
      '.tag-list .tag',
      '.keyword-tags a',
      '[data-tags] .tag',
      '.game-categories a'
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) tags.push(text);
      });
    }

    // 从关键词meta标签获取
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

    // 添加双人游戏相关的默认标签
    if (tags.length === 0) {
      tags.push('2 Player', 'Multiplayer', 'Browser Game');
    }

    return tags.length > 0 ? [...new Set(tags)] : undefined;
  }

  private extractCategory(doc: Document): string | undefined {
    const selectors = [
      '.game-category',
      '.category',
      '.breadcrumb .category',
      '[data-category]',
      '.genre',
      '.game-genre',
      '.nav-category.active'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 从面包屑导航获取分类
    const breadcrumb = doc.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
    if (breadcrumb) {
      const links = breadcrumb.querySelectorAll('a');
      if (links.length > 1) {
        const categoryLink = links[1];
        if (categoryLink?.textContent?.trim()) {
          return categoryLink.textContent.trim();
        }
      }
    }

    // 默认分类
    return '2 Player Games';
  }

  private extractThumbnail(doc: Document, baseUrl: string): string | undefined {
    const selectors = [
      '.game-thumbnail img',
      '.game-image img',
      '.game-screenshot img',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.preview-image img',
      '.game-preview img',
      '[data-game-image] img',
      '.game-icon img'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let src: string | null = null;
        
        if (element.tagName === 'META') {
          src = element.getAttribute('content');
        } else if (element.tagName === 'IMG') {
          src = element.getAttribute('src') || 
                 element.getAttribute('data-src') || 
                 element.getAttribute('data-lazy-src') ||
                 element.getAttribute('data-original');
        }

        if (src) {
          try {
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
      '.game-rating',
      '.game-score',
      '[data-rating]',
      '.stars',
      '.user-rating'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        const ratingText = element.textContent.trim();
        
        // 匹配数字格式评分
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          const rating = parseFloat(ratingMatch[1]);
          if (rating >= 0 && rating <= 10) {
            return rating;
          }
          // 如果是5分制，转换为10分制
          if (rating >= 0 && rating <= 5) {
            return rating * 2;
          }
          // 如果是100分制，转换为10分制
          if (rating >= 0 && rating <= 100) {
            return rating / 10;
          }
        }

        // 星级评分
        const starMatch = ratingText.match(/(\d+)\s*\/\s*5/i);
        if (starMatch) {
          const stars = parseInt(starMatch[1]);
          return (stars / 5) * 10;
        }

        // 百分比评分
        const percentMatch = ratingText.match(/(\d+)%/);
        if (percentMatch) {
          const percent = parseInt(percentMatch[1]);
          return percent / 10;
        }
      }
    }

    // 计算星星评分
    const filledStars = doc.querySelectorAll('.star.filled, .star.active, .fa-star, .rating-star.filled');
    if (filledStars.length > 0) {
      return (filledStars.length / 5) * 10;
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, '')
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