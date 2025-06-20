import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 主要内容 */}
      <main className="w-full">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center mb-16">
            <div className="mb-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                AI驱动的
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  游戏内容
                </span>
                自动生成系统
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                基于DeepSeek V3 API，为游戏网站提供高质量SEO内容生成、竞品分析、数据处理和结构化输出的完整解决方案
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Link href="/workflow">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="font-semibold px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  创建工作流
                </Button>
              </Link>
              <Link href="/generate">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="font-semibold px-8 py-4 text-lg border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 w-full sm:w-auto"
                >
                  立即体验
                </Button>
              </Link>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
                <div className="text-gray-600 font-medium">核心模块</div>
              </div>
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">3阶段</div>
                <div className="text-gray-600 font-medium">AI生成架构</div>
              </div>
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-gray-600 font-medium">质量控制</div>
              </div>
            </div>
          </div>
        </section>

        {/* 功能特性 */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">核心功能特性</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">为游戏内容创作提供全方位的AI驱动解决方案</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">智能工作流</h3>
              <p className="text-gray-600 leading-relaxed">
                可视化工作流设计，支持CSV数据处理、AI内容生成、竞品分析等多种组件的灵活组合
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI内容生成</h3>
              <p className="text-gray-600 leading-relaxed">
                基于DeepSeek V3的三阶段内容生成：格式分析 → 内容创作 → 质量优化
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">结构化数据</h3>
              <p className="text-gray-600 leading-relaxed">
                自动生成Schema.org结构化数据，提升搜索引擎可见性和排名效果
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-yellow-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">竞品分析</h3>
              <p className="text-gray-600 leading-relaxed">
                自动采集竞品内容，分析关键词密度、内容结构，为优化提供数据支持
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">批量处理</h3>
              <p className="text-gray-600 leading-relaxed">
                支持大批量游戏数据处理，多级缓存优化，确保高效稳定的内容生成流程
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">质量控制</h3>
              <p className="text-gray-600 leading-relaxed">
                智能质量评估系统，关键词密度检测，内容一致性验证，确保输出内容质量
              </p>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">技术栈</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">采用现代化技术栈，确保系统稳定性和可扩展性</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <span className="px-6 py-3 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm hover:bg-blue-200 transition-colors hover:scale-105 transform duration-200">React 18</span>
              <span className="px-6 py-3 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors hover:scale-105 transform duration-200">Next.js 14</span>
              <span className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors hover:scale-105 transform duration-200">TypeScript</span>
              <span className="px-6 py-3 bg-cyan-500 text-white rounded-full font-semibold text-sm hover:bg-cyan-600 transition-colors hover:scale-105 transform duration-200">Tailwind CSS</span>
              <span className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors hover:scale-105 transform duration-200">DeepSeek V3 API</span>
              <span className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-colors hover:scale-105 transform duration-200">Papa Parse</span>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">游戏SEO内容生成工具</span>
            </div>
            <p className="text-gray-600 text-lg">&copy; 2025 基于AI技术的智能内容创作平台</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
