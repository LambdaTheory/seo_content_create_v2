# AI开发规则文档 - 游戏网站SEO内容自动生成工具

## 📋 文档概述

本文档为AI辅助开发制定的规范指南，确保开发过程规范化、代码质量统一、文档及时更新。严格按照产品设计文档和开发任务计划执行。

---

## 🎯 开发原则

### 1. 核心原则
- **严格遵循设计文档** - 所有开发必须基于docs/产品设计文档.md和docs/开发任务计划.md推进
- **代码质量优先** - 宁可慢一点，也要保证代码质量和可维护性
- **流程完整性** - 每个开发环节都要完整执行，不可跳过
- **文档同步更新** - 代码变更必须同步更新相关文档
- **进度实时同步** - 功能完成后必须立即更新docs/开发任务计划.md进度
- **任务对标执行** - 每个开发任务必须严格对照产品设计文档要求执行

### 2. 技术原则
- **组件化开发** - 所有UI组件必须可复用，遵循设计系统
- **类型安全** - 必须使用TypeScript，严格类型检查
- **性能优先** - 考虑性能优化，避免不必要的重渲染
- **无障碍友好** - 遵循WCAG标准，支持键盘导航

---

## 🚀 开发流程规范

### 1. 任务开始前准备

#### 1.1 任务理解
```markdown
☐ **首先阅读docs/产品设计文档.md确认需求背景**
☐ **对照docs/开发任务计划.md确认具体任务要求**
☐ 仔细阅读任务描述和子任务
☐ 确认任务依赖关系是否满足
☐ 理解任务的验收标准
☐ 评估任务复杂度和时间
☐ **确认任务实现方案符合产品设计要求**
```

#### 1.2 环境准备
```markdown
☐ 确认开发环境配置正确
☐ 检查相关依赖是否安装
☐ 拉取最新代码分支
☐ 创建新的feature分支
```

#### 1.3 设计确认
```markdown
☐ **参考docs/产品设计文档.md中的UI设计规范**
☐ **确认组件设计符合产品设计文档要求**
☐ **对照产品设计文档确认数据模型定义**
☐ **参考产品设计文档确认API接口设计**
☐ 确认UI设计规范要求
☐ 确认组件设计模式
☐ 确认数据模型定义
☐ 确认API接口设计
```

### 2. 开发阶段规范

#### 2.1 代码开发规范

**文件命名规范**
```typescript
// 组件文件 - PascalCase
Button.tsx
WorkflowCard.tsx
DataUploadArea.tsx

// 工具函数 - camelCase
utils/formatDate.ts
utils/validateCSV.ts
services/apiClient.ts

// 类型定义 - PascalCase + types后缀
types/Workflow.types.ts
types/GameData.types.ts
types/ApiResponse.types.ts

// 常量文件 - SCREAMING_SNAKE_CASE
constants/API_ENDPOINTS.ts
constants/UI_CONSTANTS.ts
```

**代码结构规范**
```typescript
// 组件结构模板
import React from 'react';
import { ComponentProps } from './Component.types';
import styles from './Component.module.css';

/**
 * Component功能描述
 * @param props - 组件属性
 * @returns JSX.Element
 */
export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // 1. 状态定义
  const [state, setState] = useState();
  
  // 2. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  // 3. 事件处理
  const handleEvent = useCallback(() => {
    // 事件处理逻辑
  }, []);
  
  // 4. 渲染逻辑
  return (
    <div className={styles.container}>
      {/* JSX内容 */}
    </div>
  );
};

export default Component;
```

**禁止硬编码规范**
```typescript
// ❌ 错误 - 硬编码
const buttonHeight = "48px";
const primaryColor = "#3b82f6";
const apiUrl = "https://api.deepseek.com";

// ✅ 正确 - 使用常量和配置
import { UI_CONSTANTS } from '@/constants/UI_CONSTANTS';
import { API_ENDPOINTS } from '@/constants/API_ENDPOINTS';
import { COLORS } from '@/styles/tokens';

const buttonHeight = UI_CONSTANTS.BUTTON_HEIGHT.md;
const primaryColor = COLORS.primary[500];
const apiUrl = API_ENDPOINTS.DEEPSEEK.base;
```

**环境变量规范**
```typescript
// ❌ 错误 - 直接使用字符串
const apiKey = "sk-xxx";

// ✅ 正确 - 使用环境变量
const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error('DEEPSEEK_API_KEY is required');
}
```

#### 2.2 组件开发规范

**按钮组件示例**
```typescript
// Button.types.ts
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Button.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    // ... 其他变体
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        {
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-wait': loading,
        }
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### 3. 测试阶段规范

#### 3.1 单元测试要求
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('应该渲染正确的文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击我</Button>);
    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('禁用状态应该阻止点击', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>点击我</Button>);
    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### 3.2 集成测试要求
```typescript
// WorkflowManagement.test.tsx
describe('工作流管理集成测试', () => {
  it('应该完成创建工作流的完整流程', async () => {
    // 1. 渲染组件
    render(<WorkflowManagement />);
    
    // 2. 点击创建按钮
    fireEvent.click(screen.getByText('新建工作流'));
    
    // 3. 填写表单
    fireEvent.change(screen.getByLabelText('工作流名称'), {
      target: { value: '测试工作流' }
    });
    
    // 4. 提交表单
    fireEvent.click(screen.getByText('保存'));
    
    // 5. 验证结果
    await waitFor(() => {
      expect(screen.getByText('工作流创建成功')).toBeInTheDocument();
    });
  });
});
```

### 4. 文档更新规范

#### 4.1 代码注释规范
```typescript
/**
 * CSV文件上传和解析组件
 * 
 * 功能特性：
 * - 支持拖拽上传
 * - 自动检测文件编码
 * - 实时数据验证
 * - 错误标记和提示
 * 
 * @example
 * ```tsx
 * <CSVUploader
 *   onUpload={handleUpload}
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   allowedTypes={['.csv']}
 * />
 * ```
 */
export const CSVUploader: React.FC<CSVUploaderProps> = ({ ... }) => {
  // 组件实现
};

/**
 * 验证CSV数据格式
 * @param data - CSV解析后的数据
 * @param schema - 验证schema
 * @returns 验证结果和错误信息
 */
export const validateCSVData = (
  data: any[],
  schema: ValidationSchema
): ValidationResult => {
  // 验证逻辑
};
```

#### 4.2 README更新规范
每个模块完成后必须更新README.md：

```markdown
## 最近更新

### v1.1.0 - 2025-01-XX
- ✅ 完成CSV上传组件开发
- ✅ 新增数据验证功能
- ✅ 优化上传体验和错误提示
- 🔧 修复大文件上传内存泄露问题

### 新增组件
- `CSVUploader` - CSV文件上传组件
- `DataValidator` - 数据验证工具
- `ProgressIndicator` - 进度指示器

### API变更
- 新增 `POST /api/upload/csv` 接口
- 新增 `ValidationSchema` 类型定义
```

### 5. Git提交规范

#### 5.1 分支命名规范
```bash
# 功能开发
feature/workflow-management
feature/csv-upload
feature/ui-components

# 问题修复
fix/upload-memory-leak
fix/validation-error

# 文档更新
docs/api-documentation
docs/component-guides
```

#### 5.2 提交信息规范
```bash
# 格式：type(scope): description
# 类型：feat, fix, docs, style, refactor, test, chore

# 功能开发
feat(workflow): 添加工作流CRUD功能
feat(ui): 实现Button组件系统
feat(upload): 完成CSV上传和验证

# 问题修复
fix(upload): 修复大文件上传内存泄露
fix(validation): 修复必填字段验证逻辑

# 文档更新
docs(api): 更新API接口文档
docs(component): 添加Button组件使用说明

# 样式调整
style(button): 调整按钮悬停效果
style(layout): 优化响应式布局

# 代码重构
refactor(utils): 重构CSV解析工具函数
refactor(hooks): 优化状态管理逻辑

# 测试相关
test(button): 添加Button组件单元测试
test(workflow): 完善工作流集成测试
```

### 6. 完整开发循环

#### 6.1 单个任务完整流程
```bash
# 1. 创建功能分支
git checkout -b feature/csv-upload

# 2. 开发功能
# - **时刻参考docs/产品设计文档.md确保实现正确**
# - **对照docs/开发任务计划.md检查任务完成度**
# - 编写代码
# - 遵循规范
# - 避免硬编码

# 3. 编写测试
npm run test:unit
npm run test:integration

# 4. 代码检查
npm run lint
npm run type-check
npm run format

# 5. 更新文档
# - 更新README.md
# - 更新API文档
# - 添加组件文档
# - **立即更新开发任务计划.md标记完成状态**

# 6. 提交代码
git add .
git commit -m "feat(upload): 完成CSV上传和验证功能"

# 7. 推送分支
git push origin feature/csv-upload

# 8. 创建PR
# - 填写PR描述
# - 关联相关Issue
# - 请求代码审查

# 9. 合并主分支
git checkout main
git pull origin main
git merge feature/csv-upload
git push origin main

# 10. 更新项目文档
# - **必须立即更新docs/开发任务计划.md进度**
# - 更新开发进度
# - 标记任务完成
# - **自动检查下一个待开发任务并直接开始开发**
```

---

## 📁 项目结构规范

### 1. 目录结构
```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── forms/          # 表单组件
│   ├── layout/         # 布局组件
│   └── index.ts
├── pages/              # 页面组件
│   ├── workflow/
│   ├── upload/
│   ├── generate/
│   └── results/
├── hooks/              # 自定义Hook
├── services/           # API服务
├── utils/              # 工具函数
├── types/              # 类型定义
├── constants/          # 常量配置
├── styles/             # 样式文件
│   ├── globals.css
│   ├── tokens.css      # 设计token
│   └── components.css
└── __tests__/          # 测试文件
```

### 2. 导入导出规范
```typescript
// ✅ 正确 - 使用绝对路径
import { Button } from '@/components/ui/Button';
import { validateCSV } from '@/utils/validation';
import { API_ENDPOINTS } from '@/constants/api';

// ✅ 正确 - 统一导出
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// ❌ 错误 - 相对路径过长
import { Button } from '../../../components/ui/Button';
```

---

## 🔍 质量检查清单

### 1. 代码质量检查
```markdown
☐ **实现内容完全符合docs/产品设计文档.md要求**
☐ **功能实现对标docs/开发任务计划.md描述**
☐ 没有硬编码的字符串、数字、颜色
☐ 使用了正确的TypeScript类型
☐ 遵循了组件设计规范
☐ 实现了错误处理
☐ 添加了必要的注释
☐ 通过了ESLint检查
☐ 通过了Prettier格式化
```

### 2. 功能完整性检查
```markdown
☐ **严格按照docs/产品设计文档.md实现了所有功能**
☐ **完成了docs/开发任务计划.md中的所有子任务**
☐ 实现了设计文档中的所有要求
☐ 处理了所有边界情况
☐ 实现了加载和错误状态
☐ 支持键盘导航
☐ 适配了移动端
☐ 通过了可访问性检查
```

### 3. 测试覆盖率检查
```markdown
☐ 单元测试覆盖率 > 80%
☐ 集成测试覆盖主要流程
☐ 测试了错误场景
☐ 测试了边界条件
☐ 测试了用户交互
```

### 4. 文档更新检查
```markdown
☐ **已立即更新docs/开发任务计划.md进度（必检项）**
☐ 更新了README.md
☐ 更新了API文档
☐ 添加了组件使用示例
☐ 更新了开发进度
☐ 标记了任务完成状态
☐ 检查了依赖任务状态是否需要更新
```

---

## 🚨 特殊情况处理

### 1. 遇到设计文档不明确
```markdown
1. 停止开发，不要猜测
2. **重新仔细阅读docs/产品设计文档.md寻找答案**
3. **检查docs/开发任务计划.md是否有相关说明**
4. 详细记录疑问点
5. 参考现有的设计模式
6. 与团队确认后继续
7. **更新相关设计文档确保信息完整**
```

### 2. 遇到技术难题
```markdown
1. 仔细分析问题原因
2. 查找相关技术文档
3. 尝试多种解决方案
4. 记录解决过程
5. 更新技术文档
6. 分享给团队
```

### 3. 发现已有代码问题
```markdown
1. 立即停止使用有问题的代码
2. 评估影响范围
3. 创建修复计划
4. 优先修复关键问题
5. 更新相关测试
6. 通知相关开发者
```

---

## 📊 进度跟踪规范

### 1. 任务状态更新
```markdown
每完成一个子任务，必须立即更新docs/开发任务计划.md：

**更新时机要求：**
- ✅ 功能开发完成后立即更新（不可延后）
- ✅ 代码提交前必须完成状态更新
- ✅ 每日工作结束前检查更新完整性

**自动化开发流程：**
- 🔄 **每次任务完成并更新进度后，自动检查docs/开发任务计划.md中的下一个待开发任务**
- 🔄 **直接开始下一个未完成的任务开发，无需等待确认**
- 🔄 **严格按照任务依赖关系和优先级顺序执行**
- 🔄 **确保每个任务都符合产品设计文档要求后再进入下一个**

**更新格式标准：**
- [ ] **3.1.1** 建立设计代码库(Design Tokens) ✅ 已完成 2025-01-XX
  - [x] 定义色彩系统(主色调、辅助色、中性色)
  - [x] 定义字体系统(字体族、大小、字重)
  - [x] 定义间距系统(8px基准网格)
  - [x] 定义阴影系统(4级阴影层次)
```

### 2. 文档同步更新
```markdown
每完成一个模块，必须按顺序更新：
1. **docs/开发任务计划.md - 立即标记完成状态（优先级最高）**
2. README.md - 添加新功能说明
3. CHANGELOG.md - 记录变更内容
4. 组件文档 - 添加使用示例

**严格要求：**
- 📌 任务完成后30分钟内必须更新开发任务计划.md
- 📌 更新格式必须包含完成时间和状态标记
- 📌 子任务全部完成时需要更新父任务状态
- 📌 如有依赖任务，需要检查并更新依赖状态
- 📌 **更新进度时需确认实现完全符合产品设计文档要求**
- 📌 **每个里程碑完成后需对比产品设计文档进行完整性检查**
```

### 3. GitHub同步要求
```markdown
每日工作结束前必须：
1. 提交当日所有代码变更
2. 推送到远程仓库
3. 更新相关文档
4. 同步开发进度
```

---

## 🎯 成功标准

一个任务被认为完成，必须满足：

1. ✅ **功能完整** - 严格按照docs/产品设计文档.md实现所有要求
2. ✅ **任务对标** - 完全符合docs/开发任务计划.md中的任务描述
3. ✅ **代码质量** - 通过所有质量检查
4. ✅ **测试覆盖** - 单元测试和集成测试完整
5. ✅ **文档更新** - 所有相关文档已更新
6. ✅ **代码提交** - 代码已推送到GitHub
7. ✅ **进度同步** - docs/开发任务计划.md状态已及时更新（核心要求）
8. ✅ **持续开发** - 自动检查并开始下一个待开发任务（无需等待确认）

**记住：不完整的任务比完整的任务更危险，宁可慢一些，也要保证质量！**
**自动化开发：完成一个任务后立即开始下一个，保持开发的连续性和高效性！** 