import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from './Form';
import { FormField } from './Form.types';

// 测试表单配置
const basicFields: FormField[] = [
  {
    name: 'username',
    label: '用户名',
    type: 'text',
    required: true,
    placeholder: '请输入用户名',
    validation: [
      { type: 'required', message: '用户名是必填项' },
      { type: 'minLength', value: 3, message: '用户名至少3个字符' },
    ],
  },
  {
    name: 'email',
    label: '邮箱',
    type: 'email',
    required: true,
    validation: [
      { type: 'required', message: '邮箱是必填项' },
      { type: 'email', message: '请输入有效的邮箱格式' },
    ],
  },
  {
    name: 'age',
    label: '年龄',
    type: 'number',
    validation: [
      { type: 'min', value: 18, message: '年龄不能小于18岁' },
      { type: 'max', value: 100, message: '年龄不能大于100岁' },
    ],
  },
];

const selectField: FormField = {
  name: 'country',
  label: '国家',
  type: 'select',
  options: [
    { value: 'cn', label: '中国' },
    { value: 'us', label: '美国' },
    { value: 'jp', label: '日本' },
  ],
};

const checkboxField: FormField = {
  name: 'agree',
  label: '同意服务条款',
  type: 'checkbox',
  required: true,
  validation: [
    { type: 'custom', message: '请同意服务条款', validator: (value) => value === true },
  ],
};

const radioField: FormField = {
  name: 'gender',
  label: '性别',
  type: 'radio',
  options: [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'other', label: '其他' },
  ],
};

const textareaField: FormField = {
  name: 'description',
  label: '描述',
  type: 'textarea',
  rows: 4,
  placeholder: '请输入描述',
  validation: [
    { type: 'maxLength', value: 200, message: '描述不能超过200个字符' },
  ],
};

describe('Form Component', () => {
  const mockSubmit = jest.fn();
  const mockReset = jest.fn();
  const mockFieldChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该渲染基本表单字段', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} />);

      expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.getByLabelText(/年龄/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
    });

    it('应该渲染必填项标记', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} />);

      const usernameLabel = screen.getByText('用户名');
      const emailLabel = screen.getByText('邮箱');
      
      expect(usernameLabel.parentElement).toHaveTextContent('*');
      expect(emailLabel.parentElement).toHaveTextContent('*');
    });

    it('应该渲染选择框字段', () => {
      render(<Form fields={[selectField]} onSubmit={mockSubmit} />);

      const select = screen.getByLabelText(/国家/);
      expect(select).toBeInTheDocument();
      expect(screen.getByText('中国')).toBeInTheDocument();
      expect(screen.getByText('美国')).toBeInTheDocument();
      expect(screen.getByText('日本')).toBeInTheDocument();
    });

    it('应该渲染复选框字段', () => {
      render(<Form fields={[checkboxField]} onSubmit={mockSubmit} />);

      const checkbox = screen.getByLabelText(/同意服务条款/);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('应该渲染单选框字段', () => {
      render(<Form fields={[radioField]} onSubmit={mockSubmit} />);

      expect(screen.getByLabelText('男')).toBeInTheDocument();
      expect(screen.getByLabelText('女')).toBeInTheDocument();
      expect(screen.getByLabelText('其他')).toBeInTheDocument();
    });

    it('应该渲染文本区域字段', () => {
      render(<Form fields={[textareaField]} onSubmit={mockSubmit} />);

      const textarea = screen.getByLabelText(/描述/);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('应该渲染重置按钮当showResetButton为true时', () => {
      render(
        <Form
          fields={basicFields}
          onSubmit={mockSubmit}
          showResetButton
          resetText="清空"
        />
      );

      expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
    });
  });

  describe('初始值测试', () => {
    it('应该设置初始值', () => {
      const initialValues = {
        username: 'john',
        email: 'john@example.com',
        age: 25,
      };

      render(
        <Form
          fields={basicFields}
          onSubmit={mockSubmit}
          initialValues={initialValues}
        />
      );

      expect(screen.getByDisplayValue('john')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    it('应该为复选框设置初始值', () => {
      const initialValues = { agree: true };

      render(
        <Form
          fields={[checkboxField]}
          onSubmit={mockSubmit}
          initialValues={initialValues}
        />
      );

      const checkbox = screen.getByLabelText(/同意服务条款/) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('表单交互测试', () => {
    it('应该更新字段值', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} />);

      const usernameInput = screen.getByLabelText(/用户名/);
      await user.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('应该处理复选框切换', async () => {
      const user = userEvent.setup();
      render(<Form fields={[checkboxField]} onSubmit={mockSubmit} />);

      const checkbox = screen.getByLabelText(/同意服务条款/) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('应该处理单选框选择', async () => {
      const user = userEvent.setup();
      render(<Form fields={[radioField]} onSubmit={mockSubmit} />);

      const maleRadio = screen.getByLabelText('男') as HTMLInputElement;
      const femaleRadio = screen.getByLabelText('女') as HTMLInputElement;

      await user.click(maleRadio);
      expect(maleRadio.checked).toBe(true);
      expect(femaleRadio.checked).toBe(false);

      await user.click(femaleRadio);
      expect(maleRadio.checked).toBe(false);
      expect(femaleRadio.checked).toBe(true);
    });

    it('应该处理选择框选择', async () => {
      const user = userEvent.setup();
      render(<Form fields={[selectField]} onSubmit={mockSubmit} />);

      const select = screen.getByLabelText(/国家/);
      await user.selectOptions(select, 'us');

      expect(select).toHaveValue('us');
    });
  });

  describe('表单验证测试', () => {
    it('应该显示必填字段错误', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} validateOnBlur />);

      const usernameInput = screen.getByLabelText(/用户名/);
      
      // 聚焦然后失焦触发验证
      await user.click(usernameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('用户名是必填项')).toBeInTheDocument();
      });
    });

    it('应该显示邮箱格式错误', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} validateOnBlur />);

      const emailInput = screen.getByLabelText(/邮箱/);
      
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('请输入有效的邮箱格式')).toBeInTheDocument();
      });
    });

    it('应该显示最小长度错误', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} validateOnBlur />);

      const usernameInput = screen.getByLabelText(/用户名/);
      
      await user.type(usernameInput, 'ab');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('用户名至少3个字符')).toBeInTheDocument();
      });
    });

    it('应该显示数字范围错误', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} validateOnBlur />);

      const ageInput = screen.getByLabelText(/年龄/);
      
      await user.type(ageInput, '15');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('年龄不能小于18岁')).toBeInTheDocument();
      });
    });

    it('应该验证自定义规则', async () => {
      const user = userEvent.setup();
      render(<Form fields={[checkboxField]} onSubmit={mockSubmit} />);

      const submitButton = screen.getByRole('button', { name: '提交' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请同意服务条款')).toBeInTheDocument();
      });
    });
  });

  describe('表单提交测试', () => {
    it('应该在验证通过时提交表单', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} />);

      // 填写有效数据
      await user.type(screen.getByLabelText(/用户名/), 'testuser');
      await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
      await user.type(screen.getByLabelText(/年龄/), '25');

      const submitButton = screen.getByRole('button', { name: '提交' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          age: 25,
        });
      });
    });

    it('应该在验证失败时不提交表单', async () => {
      const user = userEvent.setup();
      render(<Form fields={basicFields} onSubmit={mockSubmit} />);

      const submitButton = screen.getByRole('button', { name: '提交' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('用户名是必填项')).toBeInTheDocument();
        expect(screen.getByText('邮箱是必填项')).toBeInTheDocument();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('应该在提交时显示加载状态', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      
      // 模拟异步提交 - 使用Promise来控制解决时机
      const slowSubmit = jest.fn().mockImplementation(
        () => new Promise<void>(resolve => {
          resolveSubmit = resolve;
        })
      );

      render(<Form fields={basicFields} onSubmit={slowSubmit} />);

      // 填写有效数据
      await user.type(screen.getByLabelText(/用户名/), 'testuser');
      await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
      await user.type(screen.getByLabelText(/年龄/), '25');

      const submitButton = screen.getByRole('button', { name: '提交' });
      
      // 点击提交按钮
      await user.click(submitButton);

      // 等待按钮变为禁用状态
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      }, { timeout: 1000 });

      // 解决Promise以完成提交
      resolveSubmit!();
      
      // 等待按钮恢复启用状态
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('表单重置测试', () => {
    it('应该重置表单值', async () => {
      const user = userEvent.setup();
      const initialValues = { username: 'initial' };

      render(
        <Form
          fields={basicFields}
          onSubmit={mockSubmit}
          onReset={mockReset}
          initialValues={initialValues}
          showResetButton
        />
      );

      const usernameInput = screen.getByLabelText(/用户名/);
      const resetButton = screen.getByRole('button', { name: '重置' });

      // 修改值
      await user.clear(usernameInput);
      await user.type(usernameInput, 'changed');
      expect(usernameInput).toHaveValue('changed');

      // 重置
      await user.click(resetButton);
      expect(usernameInput).toHaveValue('initial');
      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('布局测试', () => {
    it('应该应用垂直布局', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} layout="vertical" />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('应该应用水平布局', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} layout="horizontal" />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-3');
    });

    it('应该应用内联布局', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} layout="inline" />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('flex', 'flex-wrap', 'items-center');
    });
  });

  describe('尺寸测试', () => {
    it('应该应用小尺寸', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} size="sm" />);
      
      const submitButton = screen.getByRole('button', { name: '提交' });
      expect(submitButton).toHaveClass('px-3', 'py-2', 'text-sm');
    });

    it('应该应用大尺寸', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} size="lg" />);
      
      const submitButton = screen.getByRole('button', { name: '提交' });
      expect(submitButton).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('字段变更回调测试', () => {
    it('应该调用字段变更回调', async () => {
      const user = userEvent.setup();
      render(
        <Form
          fields={basicFields}
          onSubmit={mockSubmit}
          onFieldChange={mockFieldChange}
        />
      );

      const usernameInput = screen.getByLabelText(/用户名/);
      await user.type(usernameInput, 'test');

      await waitFor(() => {
        expect(mockFieldChange).toHaveBeenCalled();
      });
    });
  });

  describe('禁用状态测试', () => {
    it('应该禁用整个表单', () => {
      render(<Form fields={basicFields} onSubmit={mockSubmit} disabled />);

      const submitButton = screen.getByRole('button', { name: '提交' });
      expect(submitButton).toBeDisabled();
    });
  });
}); 