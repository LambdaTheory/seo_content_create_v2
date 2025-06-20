/**
 * 网站地图生成API
 * 动态生成sitemap.xml文件
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // 获取当前时间作为lastmod
    const now = new Date().toISOString();
    
    // 静态页面列表
    const staticPages = [
      {
        url: '',
        changefreq: 'daily',
        priority: '1.0',
        lastmod: now
      },
      {
        url: '/workflow',
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: now
      },
      {
        url: '/upload',
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: now
      },
      {
        url: '/generate',
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: now
      },
      {
        url: '/results',
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: now
      },
      {
        url: '/api-docs',
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: now
      }
    ];

    // 生成XML内容
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Sitemap generation failed:', error);
    
    return NextResponse.json({
      error: 'Failed to generate sitemap',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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