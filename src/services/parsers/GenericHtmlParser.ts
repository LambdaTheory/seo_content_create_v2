/**
 * 通用HTML解析器
 * 用于解析没有专门解析器的网站内容
 */

import { WebsiteParser, ParseConfig, ParseResult, ParsedGameContent } from "../WebContentParsingService";

export class GenericHtmlParser implements WebsiteParser {
  name = "Generic";
  domains: string[] = []; // 通用解析器不限制域名

  canParse(url: string): boolean {
    // 通用解析器可以解析任何URL
    return true;
  }

  parse(html: string, url: string, config: ParseConfig): ParseResult {
    const startTime = Date.now();
    
    try {
      // 使用DOMParser解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

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
        confidence: Math.min(qualityScore / 100, 1) * 0.8 // 通用解析器置信度略低
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown parsing error",
        parser: this.name,
        parseTime: Date.now() - startTime,
        qualityScore: 0,
        confidence: 0
      };
    }
  }

  private extractTitle(doc: Document): string {
    // 尝试多种通用选择器获取标题
    const selectors = [
      "h1",
      ".title",
      ".game-title",
      ".game-name",
      ".main-title",
      ".page-title",
      ".content-title",
      ".post-title",
      ".entry-title",
      ".header h1",
      ".header .title",
      "title"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        let titleText = element.textContent.trim();
        
        // 如果是title标签，尝试清理网站名称
        if (selector === "title") {
          titleText = this.cleanTitleFromPageTitle(titleText);
        }
        
        if (titleText.length > 0) {
          return titleText;
        }
      }
    }

    return "";
  }

  private extractDescription(doc: Document): string {
    const selectors = [
      "meta[name=\"description\"]",
      "meta[property=\"og:description\"]",
      "meta[name=\"twitter:description\"]",
      ".description",
      ".game-description",
      ".summary",
      ".excerpt",
      ".intro",
      ".about",
      ".content p",
      ".main p",
      "p"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        if (element.tagName === "META") {
          const content = element.getAttribute("content");
          if (content?.trim() && content.length > 20) {
            return content.trim();
          }
        } else if (element.textContent?.trim()) {
          const text = element.textContent.trim();
          if (text.length > 20) {
            return text;
          }
        }
      }
    }

    return "";
  }

  private extractInstructions(doc: Document): string | undefined {
    const selectors = [
      ".instructions",
      ".how-to-play",
      ".controls",
      ".game-controls",
      ".gameplay",
      ".rules",
      ".guide",
      ".tutorial"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // 查找包含常见关键词的段落
    const keywords = [
      "how to play",
      "instructions",
      "controls",
      "use arrow keys",
      "wasd",
      "mouse to",
      "click to",
      "press space",
      "use keyboard"
    ];

    const paragraphs = doc.querySelectorAll("p");
    for (const p of paragraphs) {
      const text = p.textContent?.toLowerCase() || "";
      if (keywords.some(keyword => text.includes(keyword)) && text.length > 20) {
        return p.textContent?.trim();
      }
    }

    return undefined;
  }

  private extractFeatures(doc: Document): string[] | undefined {
    const features: string[] = [];
    
    const selectors = [
      ".features li",
      ".game-features li",
      ".highlights li",
      ".specs li",
      ".feature-list li",
      ".benefits li",
      ".advantages li"
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) {
          features.push(text);
        }
      });
    }

    // 如果没有找到明确的特色列表，尝试从内容中推测
    if (features.length === 0) {
      const description = this.extractDescription(doc).toLowerCase();
      
      // 添加基于内容的特性推测
      if (description.includes("multiplayer") || description.includes("multi player")) {
        features.push("Multiplayer");
      }
      
      if (description.includes("single player")) {
        features.push("Single Player");
      }
      
      if (description.includes("3d") || description.includes("three dimensional")) {
        features.push("3D Graphics");
      }
      
      if (description.includes("online") || description.includes("browser")) {
        features.push("Browser Game");
      }
      
      if (description.includes("free") || description.includes("no cost")) {
        features.push("Free to Play");
      }
      
      if (description.includes("mobile") || description.includes("touch")) {
        features.push("Mobile Friendly");
      }
    }

    return features.length > 0 ? features : undefined;
  }

  private extractTags(doc: Document): string[] | undefined {
    const tags: string[] = [];
    
    const selectors = [
      ".tags a",
      ".tag",
      ".categories a",
      ".category",
      ".labels a",
      ".keywords a",
      ".genre a"
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 1 && text.length < 30) {
          tags.push(text);
        }
      });
    }

    // 从关键词meta标签获取
    if (tags.length === 0) {
      const keywordsMeta = doc.querySelector("meta[name=\"keywords\"]");
      if (keywordsMeta) {
        const keywords = keywordsMeta.getAttribute("content");
        if (keywords) {
          const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k.length > 1);
          tags.push(...keywordList);
        }
      }
    }

    return tags.length > 0 ? [...new Set(tags)] : undefined;
  }

  private extractCategory(doc: Document): string | undefined {
    const selectors = [
      ".category",
      ".genre",
      ".type",
      ".section",
      ".breadcrumb a",
      ".nav-category",
      ".main-category"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        const text = element.textContent.trim();
        if (text.length > 2 && text.length < 50) {
          return text;
        }
      }
    }

    // 从面包屑导航获取
    const breadcrumb = doc.querySelector(".breadcrumb, .breadcrumbs");
    if (breadcrumb) {
      const links = breadcrumb.querySelectorAll("a");
      if (links.length > 1) {
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
      "meta[property=\"og:image\"]",
      "meta[name=\"twitter:image\"]",
      ".thumbnail img",
      ".preview img",
      ".screenshot img",
      ".game-image img",
      ".featured-image img",
      ".main-image img",
      "img[alt*=\"game\"]",
      "img[alt*=\"screenshot\"]",
      ".content img"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let src: string | null = null;
        
        if (element.tagName === "META") {
          src = element.getAttribute("content");
        } else if (element.tagName === "IMG") {
          src = element.getAttribute("src") || 
                 element.getAttribute("data-src") || 
                 element.getAttribute("data-lazy-src");
        }

        if (src) {
          try {
            const imageUrl = src.startsWith("http") ? src : new URL(src, baseUrl).href;
            // 简单验证图片URL
            if (this.isValidImageUrl(imageUrl)) {
              return imageUrl;
            }
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
      ".rating",
      ".score",
      ".stars",
      ".review-score",
      ".game-rating"
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        const ratingText = element.textContent.trim();
        
        // 匹配各种评分格式
        const patterns = [
          /(\d+(?:\.\d+)?)\s*\/\s*10/i,  // x/10
          /(\d+(?:\.\d+)?)\s*\/\s*5/i,   // x/5
          /(\d+)%/,                       // x%
          /(\d+(?:\.\d+)?)\s*stars?/i,   // x stars
          /(\d+(?:\.\d+)?)/               // 纯数字
        ];

        for (const pattern of patterns) {
          const match = ratingText.match(pattern);
          if (match) {
            const rating = parseFloat(match[1]);
            
            if (pattern.source.includes("/10")) {
              return rating;
            } else if (pattern.source.includes("/5")) {
              return (rating / 5) * 10;
            } else if (pattern.source.includes("%")) {
              return rating / 10;
            } else if (pattern.source.includes("stars")) {
              return (rating / 5) * 10;
            } else if (rating >= 0 && rating <= 10) {
              return rating;
            }
          }
        }
      }
    }

    // 计算星星评分
    const filledStars = doc.querySelectorAll(".star.filled, .star.active, .fa-star");
    if (filledStars.length > 0) {
      return (filledStars.length / 5) * 10;
    }

    return undefined;
  }

  private cleanTitleFromPageTitle(title: string): string {
    // 常见的分隔符和网站名称模式
    const separators = [" - ", " | ", " :: ", "  ", "  "];
    
    for (const separator of separators) {
      if (title.includes(separator)) {
        const parts = title.split(separator);
        // 返回第一部分（通常是页面标题）
        return parts[0].trim();
      }
    }
    
    return title;
  }

  private isValidImageUrl(url: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
    const lowerUrl = url.toLowerCase();
    
    // 检查是否包含图片扩展名或图片相关参数
    return imageExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.includes("image") ||
           lowerUrl.includes("img") ||
           lowerUrl.includes("photo") ||
           lowerUrl.includes("picture");
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/[\r\n\t]/g, " ")
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, "")
      .trim();
  }

  private calculateQualityScore(content: Partial<ParsedGameContent>): number {
    let score = 0;
    
    // 标题评分 (0-20分)
    if (content.title) {
      if (content.title.length > 3) score += 8;
      if (content.title.length > 10) score += 6;
      if (content.title.length > 20) score += 6;
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
    
    // 通用解析器分数稍微保守一些
    return Math.min(score * 0.9, 100);
  }
}
