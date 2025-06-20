/**
 * Robots.txt生成API
 * 动态生成robots.txt文件
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 生产环境和开发环境的robots.txt内容
    const robotsContent = isProduction ? 
      // 生产环境：允许搜索引擎爬取
      `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/

# 特定搜索引擎优化
User-agent: Googlebot
Allow: /
Disallow: /api/
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Disallow: /api/
Crawl-delay: 1

# 阻止恶意爬虫
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# 网站地图
Sitemap: ${baseUrl}/sitemap.xml

# 主机信息
Host: ${baseUrl.replace(/^https?:\/\//, '')}
` : 
      // 开发/预览环境：阻止所有爬虫
      `User-agent: *
Disallow: /

# 这是开发环境，不允许搜索引擎索引
# 如需测试爬虫行为，请在生产环境进行
`;

    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // 24小时缓存
      },
    });

  } catch (error) {
    console.error('Robots.txt generation failed:', error);
    
    // 返回基础的robots.txt作为后备
    const fallbackRobots = `User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
`;

    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}

// 只允许GET请求
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 