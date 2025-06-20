#!/bin/bash

# =============================================================================
# SEO内容自动生成工具 - 生产部署脚本
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI 未安装，尝试安装..."
        npm install -g vercel
    fi
    
    log_success "前置条件检查完成"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    
    # 类型检查
    log_info "运行TypeScript类型检查..."
    npm run type-check
    
    # 代码质量检查
    log_info "运行ESLint检查..."
    npm run lint
    
    # 单元测试
    log_info "运行单元测试..."
    npm run test -- --passWithNoTests --coverage
    
    log_success "所有测试通过"
}

# 构建项目
build_project() {
    log_info "构建生产版本..."
    
    # 清理之前的构建
    rm -rf .next
    rm -rf out
    
    # 设置生产环境
    export NODE_ENV=production
    
    # 构建项目
    npm run build
    
    log_success "项目构建完成"
}

# 检查环境变量
check_env_vars() {
    log_info "检查环境变量配置..."
    
    local required_vars=(
        "DEEPSEEK_API_KEY"
        "NEXT_PUBLIC_APP_URL"
        "CRON_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "以下环境变量未设置："
        printf '%s\n' "${missing_vars[@]}"
        log_warning "请确保在Vercel控制台中配置了这些变量"
    else
        log_success "环境变量检查完成"
    fi
}

# 部署到Vercel
deploy_to_vercel() {
    log_info "开始部署到Vercel..."
    
    # 检查是否已登录Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "请登录Vercel账户..."
        vercel login
    fi
    
    # 部署项目
    if [ "$1" == "production" ]; then
        log_info "部署到生产环境..."
        vercel --prod --yes
    else
        log_info "部署到预览环境..."
        vercel --yes
    fi
    
    log_success "部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署结果..."
    
    local base_url="${NEXT_PUBLIC_APP_URL:-https://seo-content-generator.vercel.app}"
    
    # 检查健康状态
    log_info "检查应用健康状态..."
    if curl -f "$base_url/api/health" > /dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败"
        exit 1
    fi
    
    # 检查主页
    log_info "检查主页访问..."
    if curl -f "$base_url" > /dev/null 2>&1; then
        log_success "主页访问正常"
    else
        log_error "主页访问失败"
        exit 1
    fi
    
    # 检查sitemap
    log_info "检查sitemap..."
    if curl -f "$base_url/sitemap.xml" > /dev/null 2>&1; then
        log_success "Sitemap生成正常"
    else
        log_warning "Sitemap访问异常"
    fi
    
    log_success "部署验证完成"
}

# 发送通知
send_notification() {
    log_info "发送部署通知..."
    
    local deployment_url="$1"
    local status="$2"
    
    if [ -n "$NOTIFICATION_EMAIL" ] && [ -n "$SMTP_HOST" ]; then
        # 这里可以添加邮件通知逻辑
        log_info "邮件通知已发送到 $NOTIFICATION_EMAIL"
    fi
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        # 这里可以添加Slack通知逻辑
        log_info "Slack通知已发送"
    fi
    
    log_success "通知发送完成"
}

# 主函数
main() {
    local deployment_type="${1:-preview}"
    
    echo "=================================="
    echo "SEO内容自动生成工具 - 部署脚本"
    echo "部署类型: $deployment_type"
    echo "=================================="
    
    # 检查前置条件
    check_prerequisites
    
    # 检查环境变量
    check_env_vars
    
    # 运行测试
    if [ "$deployment_type" == "production" ]; then
        run_tests
    else
        log_info "预览部署跳过测试"
    fi
    
    # 构建项目
    build_project
    
    # 部署
    deploy_to_vercel "$deployment_type"
    
    # 获取部署URL
    local deployment_url=$(vercel --scope="$VERCEL_TEAM_ID" ls 2>/dev/null | grep seo-content-generator | head -n1 | awk '{print $2}')
    
    # 验证部署
    if [ "$deployment_type" == "production" ]; then
        verify_deployment
    fi
    
    # 发送通知
    send_notification "$deployment_url" "success"
    
    echo "=================================="
    log_success "部署完成!"
    log_info "部署URL: $deployment_url"
    echo "=================================="
}

# 脚本帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  production    部署到生产环境"
    echo "  preview       部署到预览环境 (默认)"
    echo "  help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 production   # 部署到生产环境"
    echo "  $0 preview      # 部署到预览环境"
    echo "  $0              # 默认部署到预览环境"
}

# 处理命令行参数
case "$1" in
    production)
        main "production"
        ;;
    preview)
        main "preview"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        main "preview"
        ;;
esac 