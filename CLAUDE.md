# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 项目概述

**TelyAI** (原 Telegram Web A) 是一个使用自定义 React-like 框架 Teact 构建的 Telegram Web 客户端。该项目赢得了 Telegram 轻量级客户端竞赛一等奖，核心功能零外部依赖。

**核心技术栈：**
- **Teact**: 自定义 React-like 框架 (`src/lib/teact/`)
- **GramJS**: 在 Web Worker 中运行的 Telegram MTProto 实现
- **全局状态管理**: 类 Redux 架构 (`src/global/`)
- **多标签支持**: 所有 actions/selectors 支持 `tabId` 参数

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         主线程 (UI)                          │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  Components │───▶│ withGlobal   │───▶│  Global State  │ │
│  │   (Teact)   │    │  (Selector)  │    │   (类Redux)    │ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
│         │                   ▲                     │          │
│         │                   │                     │          │
│         ▼                   │                     ▼          │
│  ┌─────────────┐           │            ┌────────────────┐ │
│  │   Actions   │───────────┘            │   callApi()    │ │
│  │  (getActions)│                       └────────────────┘ │
│  └─────────────┘                                │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                                            postMessage
                                                   │
┌──────────────────────────────────────────────────┼──────────┐
│                    Web Worker (GramJS)           ▼          │
│  ┌─────────────────┐    ┌─────────────────────────────┐   │
│  │  invokeRequest  │───▶│   GramJS (MTProto Client)   │   │
│  │   (API 调用)    │    │     Telegram API 通信       │   │
│  └─────────────────┘    └─────────────────────────────┘   │
│         │                              │                    │
│         │                              ▼                    │
│         ▼                    ┌──────────────────┐          │
│  ┌─────────────┐             │   Updates 处理   │          │
│  │ Api* 类型   │             │  (mtpUpdateHandler)│         │
│  │ 对象转换    │             └──────────────────┘          │
│  └─────────────┘                       │                    │
└────────────────────────────────────────┼────────────────────┘
                                         │
                                   postMessage
                                         │
┌────────────────────────────────────────▼────────────────────┐
│                        主线程                                │
│              ┌──────────────────────┐                       │
│              │  apiUpdaters 处理    │                       │
│              │  更新 Global State   │                       │
│              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/
├── api/
│   ├── gramjs/              # GramJS API 封装
│   │   ├── methods/         # API 方法实现 (fetch*, invokeRequest)
│   │   ├── apiBuilders/     # GramJS 对象 -> Api* 对象转换
│   │   └── worker/          # Web Worker 相关
│   └── types/               # Api* 类型定义
├── components/              # UI 组件
├── global/                  # 全局状态管理
│   ├── actions/            # Actions (更新状态)
│   ├── selectors/          # Selectors (读取状态)
│   ├── reducers/           # Reducers (状态转换逻辑)
│   └── types/              # 全局状态类型
├── lib/
│   ├── teact/              # Teact 框架核心
│   └── gramjs/             # GramJS 库
├── hooks/                   # 自定义 React hooks
└── util/                    # 工具函数
```

# 开发命令

## 基础命令
```bash
# 安装依赖 (需要 Node 22.6+/24+, npm 10.8+/11+)
npm i

# 开发服务器
npm run dev

# 模拟客户端开发 (端口 1235)
npm run dev:mocked
```

## 测试
```bash
npm test                    # Jest 测试
npm run test:playwright     # Playwright E2E 测试
npm run test:record         # 录制 Playwright 测试
```

## 构建
```bash
npm run build:dev           # 开发构建
npm run build:staging       # 预发布构建
npm run build:production    # 生产构建
```

## 代码质量
```bash
npm run check              # 运行 TypeScript + stylelint + eslint
npm run check:fix          # 自动修复样式和 lint 问题
```

## 本地化
```bash
npm run lang:ts            # 从本地化字符串生成 TypeScript 类型
npm run lang:initial       # 生成初始语言回退
```

## API 和代码生成
```bash
npm run gramjs:tl          # 从 api.tl 重新生成 GramJS TypeScript 定义
npm run tl:rehash          # 重新计算 TL schema 哈希
```

## 图标和资源
```bash
npm run icons:build        # 从 SVG 生成图标字体
```

## Electron
```bash
npm run electron:dev                      # Electron 开发模式 (3 个并发进程)
npm run electron:webpack                  # 编译 Electron 主进程
npm run electron:build                    # 准备渲染器 + 编译 Electron 主进程
npm run electron:package                  # 打包所有平台
npm run electron:release:production       # 构建生产版本
```

# 开发规范

## 核心原则

- **简洁为王**：只修改与当前任务直接相关的代码
- **复用优先**：添加新功能前先搜索现有的类型、函数和组件
- **不添加新库**：只使用现有依赖。如果真的需要新库，停下来解释原因
- **不写测试**：项目规范不要求为新功能编写测试

## 代码风格

- 使用**提前返回**（early returns）
- 布尔变量以**助动词开头** (如 `isOpen`, `willUpdate`, `shouldRender`)
- 函数名以**动词开头** (如 `openModal`, `closeDialog`, `handleClick`)
- 调用函数前检查必需参数，避免在函数内部检查可选参数
- 仅为复杂逻辑添加注释

### 重要规范

**❌ 禁止条件展开运算符** - TypeScript 无法检查展开字段类型：
```typescript
// ❌ 错误 - 没有类型检查
{ ...condition && { field: value } }

// ✅ 正确 - 完整类型检查
{ field: condition ? value : undefined }
```

**✅ 内联样式使用字符串模板**：
```typescript
// ✅ 正确
style={`transform: translateX(${value}%)`}

// ❌ 错误
style={{ transform: `translateX(${value}%)` }}
style={{ '--custom-prop': value } as React.CSSProperties}
```

**✅ 字体粗细使用 CSS 变量**：
```scss
// ✅ 正确
font-weight: var(--font-weight-medium);
font-weight: var(--font-weight-bold);

// ❌ 错误
font-weight: 600;
font-weight: bold;
```

## SCSS 模块

- 类名使用 **camelCase**
- 导入为 `styles`：
  ```scss
  /* Component.module.scss */
  .myWrapper { /*...*/ }
  ```
  ```tsx
  /* Component.tsx */
  import styles from "./Component.module.scss";
  <div className={buildClassName(styles.myWrapper, "legacy-class")} />
  ```
- 使用 `buildClassName.ts` 合并多个类名
- **始终提取样式到文件** - 避免内联样式
- **如果文件已导入样式**，检查样式来源并在那里添加新样式 - 不要创建新样式文件
- 所有尺寸使用 **rem 单位**

## 本地化和文本规则

- **必须使用 `lang()` 显示所有文本** - 永远不要硬编码字符串
- `lang()` 可接受参数：`lang('Key', { param: value })`
- 在 `src/assets/localization/fallback.strings` 末尾添加新翻译

## 调试和完善

**完成解决方案后：**
1. 批判性思考 - 找出不足之处
2. 修复问题，做更多规划
3. 呈现改进后的结果

**需要深度调试时：**
1. 为操作员列出清晰的分步调试说明
2. 问题解决后删除所有临时调试代码

**无法手动修复的 lint 错误：**
建议运行 `eslint --fix <filename>`

# Telegram Web API 指南

## API 定义和类型转换流程

```
┌──────────────────────────────────────────────────────────────┐
│  api.tl (TL 语法)                                            │
│  ↓ npm run gramjs:tl                                         │
│  api.d.ts (TypeScript 类型)                                  │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  src/api/gramjs/methods/                                     │
│  ├── invokeRequest(new GramJs.Method())  [Worker 中]        │
│  ├── buildInput* (Api* → GramJS 对象)   [gramjsBuilders]   │
│  └── buildApi*   (GramJS → Api* 对象)   [apiBuilders]      │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  UI Actions                                                   │
│  callApi('methodName', params) → Api* 对象                   │
└──────────────────────────────────────────────────────────────┘
```

## 添加新 API 方法

**步骤：**

1. **确保方法名在 `api.json` 中**
2. **运行 `npm run gramjs:tl`** 生成 `api.d.ts`
3. **在 `src/api/gramjs/methods/` 中选择合适的文件**，实现方法：
   - 如果 TL 方法以 `get` 开头，命名为 `fetch*`
   - 使用解构参数对象
   - 通过 `invokeRequest` 调用 API
   - 如果 `result` 是 `undefined`，返回 `undefined` 表示错误
   - 将 GramJS 类转换为 `Api*` 对象

**转换函数命名规范：**
- `buildApi*`: GramJS 对象 → Api* 对象（apiBuilders）
- `buildInput*`: Api* 对象 → GramJS 对象（gramjsBuilders）

## 示例代码

```ts
// src/api/gramjs/methods/users.ts
export async function fetchUsers({ users }: { users: ApiUser[] }) {
  const result = await invokeRequest(new GramJs.users.GetUsers({
    id: users.map(({ id, accessHash }) => buildInputUser(id, accessHash)),
  }));

  if (!result || !result.length) {
    return undefined;
  }

  const apiUsers = result.map(buildApiUser).filter(Boolean);
  const userStatusesById = buildApiUserStatuses(result);

  return {
    users: apiUsers,
    userStatusesById,
  };
}

// src/global/actions/api/users.ts
addActionHandler('loadUser', async (global, actions, { userId }) => {
  const user = selectUser(global, userId);
  if (!user) return;

  const res = await callApi('fetchUsers', { users: [user] });
  if (!res) return;

  // 更新 global state...
});
```

## 处理 Updates

- Updates 通过 `mtpUpdateHandler.ts` 接收
- 通过 `src/global/actions/apiUpdaters` 路由并合并到全局状态
- 类型定义在 `src/api/types/updates.ts`

# 组件开发指南

## 基础和导入

- 所有组件使用 JSX，通过 Teact 渲染
- **必须从 teact 库导入 React**，用于 JSX 兼容性。仅在需要 Teact 未提供的 React **类型**时才从 `'react'` 导入
- 内置 hooks 在 `src/lib/teact/teact` 中，从那里导入

## Props 和类型

分为两种类型：
- **OwnProps**: 父组件传入的数据
- **StateProps**: 由 `withGlobal` HOC 注入的数据
- 合并为 `OwnProps & StateProps` 定义组件
- 可以跳过一个或两个（如果未使用）
- **顺序规则**: 函数类型的 props 放在**最后**

## Hooks

- **useLastCallback** 是回调的首选，不会触发重新渲染且始终使用最新作用域
- 只有在真正需要记忆化渲染函数时才使用 **useCallback**
- 简单布尔切换优先使用 **useFlag()** 而不是 `useState<boolean>()`
- 查看 `hooks/` 文件夹获取更多工具

## 组件签名

**迁移旧的 `FC` 语法到新形式：**

```ts
// 旧的
const OldComp: FC<OwnProps & StateProps> = ({ ... }) => { ... }

// 新的
const NewComp = (props: OwnProps & StateProps) => { ... }
```

## 记忆化

- 用 `memo()` 包装大多数组件以避免不必要的更新
- 不要将新创建的对象或数组作为 props 传递给记忆化组件
- **例外**（无需 memo）：`ListItem`, `Button`, `MenuItem` 等

## 本地化

在组件顶部调用 `const lang = useLang()`

## 完整示例

```ts
import React, { useFlag } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import styles from './Component.module.scss';

type OwnProps = {
  id: string;
  className?: string;
  onClick?: NoneToVoidFunction;
};

type StateProps = {
  stateValue?: string;
};

// 常量在前
const MAX_ITEMS = 10

const Component = ({ id, className, stateValue, onClick }: OwnProps & StateProps) => {
  const { someAction } = getActions(); // 如果使用 actions，必须放在最前面

  const ref = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState('#FF00FF');
  const [isOpen, open, close] = useFlag();

  const lang = useLang();

  const handleClick = useLastCallback(() => {
    if (!ref.current) return;
    const el = ref.current;
    setColor(el.value);
    close();
    onClick?.();
    someAction(el.value);
  });

  return (
    <div ref={ref} className={styles.root + (className ? ` ${className}` : '')}>
      <button onClick={handleClick}>{lang('ButtonKey')}</button>
      <p>{stateValue}</p>
    </div>
  );
}

export default memo(withGlobal<OwnProps>((global, { id }): StateProps => {
    const stateValue = selectValue(global, id);
    return {
      stateValue,
    };
  })(Component);
)
```

# 全局状态管理

## 状态流程图

```
┌──────────────────┐
│   UI Component   │
│                  │
│  getActions()   │──┐
└──────────────────┘  │
                      │ 调用 action
                      ▼
┌──────────────────────────────────────┐
│        Action Handler                │
│  (global, actions, payload) => void  │
│                                      │
│  - 同步: return newGlobal            │
│  - 异步: setGlobal(newGlobal)        │
└──────────────────────────────────────┘
                      │
                      │ 更新
                      ▼
┌──────────────────────────────────────┐
│          Global State                │
│      (唯一数据源)                     │
└──────────────────────────────────────┘
                      │
                      │ withGlobal 订阅
                      ▼
┌──────────────────────────────────────┐
│         Selector                     │
│  (global, props) => StateProps       │
│  - 必须是纯函数                       │
│  - 不要创建新对象/数组                │
└──────────────────────────────────────┘
                      │
                      │ 注入 props
                      ▼
┌──────────────────────────────────────┐
│      Component 重新渲染               │
└──────────────────────────────────────┘
```

## 文件夹结构

- **`actions/`**: 从应用任何地方更新全局状态的 Actions
- **`selectors/`**: 读取数据的纯函数（如 `selectors/users.ts`）
- **`reducers/`**: 更新全局状态的函数
- **`types/`**: 所有 TypeScript 类型在 `src/global/types`
- **`cache.ts`**: 管理将精简版全局状态保存到 IndexedDB

## Actions

1. **推荐的**更新全局方式。在 action 内部使用 `setGlobal`，同步时直接 `return`
2. **同步 actions** 返回类型应为 `ActionReturnType`
3. **异步 actions** 返回类型应为 `Promise<void>`
4. 添加或删除 action 时，相应更新 `actions.ts`
5. `ui` 文件夹中的 actions 应该只是同步的

## 多标签支持

- Actions 和 selectors 可接受 `tabId` 参数，以便在多标签时不丢失上下文
- **`tabId` 是必需的**，如果调用可接受它的 action 或 selector
- **例外**: UI 组件可以不传 `tabId`（会自动接收）

## Selectors 和 Reducers

- 如果逻辑超过一行，在相应文件夹和文件中创建新的 selector 或 reducer
- **Selectors 必须是纯函数**：只使用输入和 global。不要分配新对象或数组，会破坏记忆化

## 数据约束

- Global 只能存储可序列化的原始类型（字符串、数字、布尔值）
- 更改 `cache.ts` 中缓存的类型时，添加迁移以避免新 selectors 出错

## 组件中使用 Global

### 访问全局状态

- **使用** `withGlobal`（类似 `mapStateToProps` 的辅助函数）拉取状态
- **避免** 实验性的 `useSelector` API
- **仅在 hooks 内部**使用 `getGlobal` 进行一次性读取（它是非响应式的）

### 性能优化

- 用 `memo` 包装 `withGlobal`，使组件仅在真实数据变化时重新渲染
- **不要**在 `withGlobal` 内返回新数组或对象；会破坏记忆化
- 如果需要过滤或映射列表，**传递 IDs 作为 props**，在 `useMemo` hook 中做重活

### 示例组件

```ts
type OwnProps = { id: string };
type StateProps = {
  someValue?: string;
  otherValue?: number;
  thirdValue: boolean;
};

const Component = ({
  id,
  someValue,
  otherValue,
  thirdValue,
}: OwnProps & StateProps) => {
  // 组件逻辑...
};

export default memo(
  withGlobal<OwnProps>((global, { id }) => {
    const { otherValue } = selectTabState(global);
    const someValue  = selectSomeValue(global, id);
    const thirdValue = Boolean(global.rawValue);

    return {
      someValue,
      otherValue,
      thirdValue,
    };
  })(Component);
);
```

# 本地化指南

## 设置和回退

- 翻译在 [Translation Platform](https://translations.telegram.org/)
- 回退文件：`src/assets/localization/fallback.strings`

## 获取字符串

```ts
const lang = useLang();

// 简单
lang('SimpleKey');

// 复数
lang('PluralKey', undefined, { pluralValue: 3 });

// 字符串替换
lang('ReplKey', { name: 'Amy' });

// JSX 节点（如链接）
lang('LinkKey', { link: <Link /> }, { withNodes: true });

// Markdown
lang('MarkdownKey', undefined, { withNodes: true, withMarkdown: true });
```

## 添加新键

1. 在 Translation Platform 搜索类似字符串以获取正确措辞
2. 添加到 `fallback.strings`
3. 如果是复数，包含 `_one` 和 `_other`
4. 运行 `npm run lang:ts`

## 命名规则

- **PascalCase**（无点号）
- 使用简短清晰的前缀表示上下文（如 `Acc` 表示可访问性）
- 名称保持在约 30 字符以下，必要时一致缩短

## API 和选项

- **基础**: `lang(key, vars?, options?) → string`
- **高级** (`withNodes`): 返回 `TeactNode[]`，可注入 JSX
- **其他选项**:
  - `withMarkdown` (简单 markdown + emojis)
  - `renderTextFilters` (自定义过滤器)
  - `specialReplacement` (替换子字符串，如图标)
- **对象语法**:
  在某些 actions 中可使用的简单形式，返回字符串
  ```ts
  actions.showNotification({ key: 'LangKey' });

  lang.with({ key: 'hello', vars: { name }, options: { withNodes: true } });
  ```

## 便捷扩展

- `lang.region(code)` → 国家名称
- `lang.conjunction(['a','b','c'])` → "a, b, and c"
- `lang.disjunction(['x','y'])` → "x or y"
- `lang.number(1234)` → 本地化格式的数字
- 标志: `lang.isRtl`, `lang.code`, `lang.rawCode`

## React 外使用

使用 `getTranslationFn()` 在非组件代码中获取相同的 `lang` 函数。不推荐，使用对象语法。
