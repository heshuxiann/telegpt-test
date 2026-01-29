# CreditLimitModal 使用指南

## 功能说明

`CreditLimitModal` 是一个提示用户积分已用完的弹窗组件。当用户的积分余额不足时，会显示此弹窗引导用户升级套餐。

**支持动态配置 title 和 message 内容**，可用于不同场景（翻译、语法检查、总结等）。

## 使用方法

### 1. 基本使用（使用默认文案）

```typescript
import { getActions } from '../global';

// 在你的组件或函数中
const { openCreditLimitModal } = getActions();

// 使用默认文案
// Title: "Translation failed"
// Message: "You've reached your credit limit. Please upgrade your plan."
openCreditLimitModal();
```

### 2. 自定义 title 和 message

```typescript
import { getActions } from '../global';

const { openCreditLimitModal } = getActions();

// 自定义翻译场景
openCreditLimitModal({
  title: 'Translation failed',
  message: "You've reached your credit limit. Please upgrade your plan.",
});

// 自定义语法检查场景
openCreditLimitModal({
  title: 'Grammar check failed',
  message: "You've used up all your credits. Upgrade to continue.",
});

// 自定义总结场景
openCreditLimitModal({
  title: 'Summary failed',
  message: "Your credit balance is insufficient. Please upgrade your plan to continue.",
});
```

### 3. 完整示例 - 在翻译功能中使用

```typescript
import { getActions } from '../global';

const translateText = async (text: string) => {
  const { openCreditLimitModal } = getActions();

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    const result = await response.json();

    // 检测积分不足的错误
    if (result.code === 102 || result.code === 103) {
      // 打开积分用完提示弹窗，自定义文案
      openCreditLimitModal({
        title: 'Translation failed',
        message: "You've reached your credit limit. Please upgrade your plan.",
      });
      return;
    }

    return result.data;
  } catch (error) {
    console.error('Translation error:', error);
  }
};
```

### 4. 在聊天助手中使用

```typescript
// 在 useAgentChat 的 onError 回调中
useAgentChat({
  onError: (error) => {
    try {
      const data = JSON.parse(error.message);

      // 检测积分用完 (code 102 或 103)
      if (data.code === 102 || data.code === 103) {
        // 打开积分用完提示弹窗，自定义文案
        getActions().openCreditLimitModal({
          title: 'AI Chat failed',
          message: "Your credits have run out. Upgrade to continue chatting.",
        });
      }
    } catch (e) {
      // 处理其他错误
    }
  },
});
```

## 弹窗交互

### 用户点击 "Cancel"
- 关闭弹窗
- 不进行任何操作

### 用户点击 "Upgrade"
- 关闭当前弹窗
- 自动打开 `PayPackageModal`（支付套餐选择弹窗）
- 用户可以选择合适的套餐进行升级

## API 说明

### openCreditLimitModal
打开积分用完提示弹窗

```typescript
getActions().openCreditLimitModal({
  title?: string;      // 弹窗标题，默认: "Translation failed"
  message?: string;    // 提示消息，默认: "You've reached your credit limit. Please upgrade your plan."
  tabId?: number;      // 可选的 tab ID
})
```

**参数说明：**
- `title` (可选): 弹窗标题，如果不传则使用默认值 "Translation failed"
- `message` (可选): 提示消息，如果不传则使用默认值
- `tabId` (可选): 多标签场景下的 tab ID

### closeCreditLimitModal
关闭积分用完提示弹窗

```typescript
getActions().closeCreditLimitModal({ tabId?: number })
```

## 常见使用场景

### 场景 1: 翻译功能
```typescript
openCreditLimitModal({
  title: 'Translation failed',
  message: "You've reached your credit limit. Please upgrade your plan.",
});
```

### 场景 2: 语法检查
```typescript
openCreditLimitModal({
  title: 'Grammar check unavailable',
  message: "You've used all your credits. Upgrade to unlock more.",
});
```

### 场景 3: AI 总结
```typescript
openCreditLimitModal({
  title: 'Summary generation failed',
  message: "Insufficient credits. Please upgrade to continue.",
});
```

### 场景 4: 图片分析
```typescript
openCreditLimitModal({
  title: 'Image analysis failed',
  message: "Your credit balance is too low. Upgrade to analyze more images.",
});
```

## 错误码参考

常见的积分不足错误码：
- `102`: 积分余额不足
- `103`: 超出使用限制
- `402`: Payment Required (HTTP状态码)

## 样式自定义

样式文件位于：`src/components/modals/membership/CreditLimitModal.module.scss`

可自定义的元素：
- `.modal` - 弹窗容器
- `.icon` - 警告图标
- `.title` - 标题
- `.message` - 提示消息
- `.cancelButton` - 取消按钮
- `.upgradeButton` - 升级按钮
