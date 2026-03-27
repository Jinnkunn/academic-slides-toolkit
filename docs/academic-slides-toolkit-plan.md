# Academic Slides Toolkit 规划

## 1. 目标

把当前的 Footer Sync 插件，逐步扩展成一个面向研究者、老师、学生和技术汇报场景的学术 Slides 制作插件。

核心定位：

`在 Figma Slides 里提供一套结构化、公式友好、图表一致、适合研究汇报的制作工具。`

这意味着产品不只是“加 footer”，而是要覆盖：

- deck 结构管理
- LaTeX 公式插入与重编辑
- figure / table / theorem 等学术模块
- references / caption / section 同步
- 批量一致性维护

## 2. 用户场景

目标用户：

- 研究生做组会汇报
- 老师做课程 slides
- 研究员做 conference talk
- 工程团队做算法 / 模型 / 实验汇报

典型痛点：

- 公式难插入，改一次很麻烦
- 图表说明、caption、编号不统一
- footer / 页码 / section 信息经常需要手工维护
- 学术 slide 结构重复度高，但每次都要重新搭
- 整份 deck 缺少一致性检查

## 3. 产品方向

建议把插件升级为五个系统：

### 3.1 Deck Structure

负责整份 deck 的结构管理。

功能包括：

- footer / header 模板
- 页码格式与起始编号
- section title 同步
- 来源页同步
- deck 范围批量更新

这是当前已有能力最成熟的部分，可以作为整个产品的“底盘”。

### 3.2 Equation System

这是最值得优先投入的能力。

功能包括：

- 插入 LaTeX 行内公式
- 插入 LaTeX 块级公式
- 公式预览
- 保存公式源码并支持再次编辑
- 公式编号
- 公式引用
- 批量更新同一套样式

设计原则：

- 不做一次性贴图
- 插件插入的公式都必须可追踪、可重编辑
- 渲染结果和公式源码必须同时保存

### 3.3 Academic Components

提供标准化学术模块。

建议组件：

- title slide
- agenda
- section divider
- theorem
- lemma
- definition
- proof
- result highlight
- method pipeline
- ablation comparison
- figure + caption
- table + caption

### 3.4 Content Assets

负责学术内容资源。

建议能力：

- references 管理
- citation chip
- bibliography slide
- chart import
- image grid / subfigure layout
- caption numbering

### 3.5 Consistency Engine

负责整份 deck 的规范化。

建议能力：

- figure / table / equation 自动编号
- section 内或全局编号切换
- 样式批量统一
- 缺失 caption / 缺失来源 / 重复编号检查
- 一键刷新整份 deck

## 4. 功能优先级

### P0：必须优先做

- footer / section / 页码继续稳定
- LaTeX 公式插入
- 公式再次编辑
- 块级公式编号
- figure / table caption 组件
- 学术 deck 的 section 同步

### P1：产品明显变强

- theorem / definition / proof 组件
- references / citation
- chart import
- subfigure 布局
- deck consistency check

### P2：后续增强

- bibliography 自动生成
- appendix 结构工具
- speaker cue / time budget
- 研究型模板库

## 5. 推荐分阶段路线

### Phase 1：Equation MVP

目标：插件第一次跨出 footer 能力，具备明确学术价值。

做这些：

- 插入 LaTeX 公式
- 编辑已有公式
- display / inline 模式切换
- 公式样式预设
- 块级公式编号
- 基础引用

成功标准：

- 用户能在 Figma Slides 内完整完成“插入公式 -> 修改公式 -> 保持样式一致”

### Phase 2：Academic Blocks

目标：提升学术 slide 搭建效率。

做这些：

- theorem / definition / proof
- figure / table + caption
- section divider
- result layout
- section title 与 footer 联动

### Phase 3：Deck Management

目标：把插件从“插元素工具”升级成“整份汇报管理工具”。

做这些：

- references 管理
- 自动编号系统
- consistency check
- 批量刷新整份 deck

## 6. 数据设计建议

后续无论做公式、caption 还是 theorem，都建议统一采用“语义节点 + 可追踪元数据”的方式。

### 6.1 元数据原则

每个插件创建的对象都写入 pluginData：

- `managedByAcademicSlides`
- `nodeKind`
- `templateId`
- `sourceId`
- `version`

### 6.2 公式对象建议

每个 equation block 至少保存：

- `latex`
- `displayMode`
- `fontSize`
- `color`
- `numberingMode`
- `equationId`
- `renderEngine`

### 6.3 组件对象建议

例如 figure block：

- `componentKind=figure`
- `captionText`
- `captionNumber`
- `numberingScope`

这个抽象层很重要。后面能不能“重新编辑”和“批量刷新”，取决于今天元数据是不是设计对了。

## 7. UI 方向

### 7.1 总体判断

你的想法是对的，而且比“所有功能都塞在一页”更适合后续扩展。

推荐模式不是：

- 一个首页再跳很多完全不同风格的弹窗

而是：

- 一个稳定的 sidebar shell
- 左侧或顶部固定的功能导航
- 右侧或主体区域显示当前功能的具体操作页

也就是：

`主页像导航栏，功能页像 inspector。`

这比纯向导式或纯长页面更适合一个会不断扩展功能的插件。

### 7.2 为什么这种结构更合适

原因有四个：

1. 用户会形成稳定心智模型

用户知道插件里一直有这些主模块：

- Deck
- Equations
- Components
- Assets
- Settings

2. 功能越来越多时不会失控

如果继续堆在单页里，等加上公式、引用、figure、table、theorem 后，界面会迅速膨胀。

3. 更像 Figma 原生 sidebar

Figma 的侧栏体验本质是：

- 全局导航稳定
- 当前上下文清晰
- 操作面板聚焦

4. 更适合未来加入“选中对象后显示相关编辑器”

比如选中了公式，就直接切到 Equation Inspector。

## 8. 推荐页面层级

建议采用两层结构：

- 第一层：稳定导航
- 第二层：模块内具体页面

### 8.1 一级导航

建议首页固定显示这些入口：

1. `Deck`
   负责模板、footer、页码、section、同步

2. `Equations`
   负责插入和管理 LaTeX 公式

3. `Components`
   负责 theorem、definition、figure、table、section divider 等

4. `Assets`
   负责 references、citations、charts、captions

5. `Settings`
   负责语言与未来偏好设置

这层应该永远固定存在，像 Figma sidebar 的主导航。

### 8.2 二级页面

每个一级模块内，再有自己的操作页。

#### Deck

- Overview
- Template
- Content Sources
- Sync

#### Equations

- Insert Equation
- Equation Library
- Selected Equation
- Numbering

#### Components

- Quick Insert
- Figure
- Table
- Theorem
- Section Divider

#### Assets

- References
- Citation Insert
- Charts
- Captions

#### Settings

- Language
- Defaults
- Advanced

## 9. 推荐界面结构

建议插件打开后是一个固定 shell：

```text
+----------------------------------+
| Academic Slides Toolkit          |
| Search / current deck context    |
+----------------------------------+
| Deck        |                    |
| Equations   |  Current panel     |
| Components  |  content           |
| Assets      |                    |
| Settings    |                    |
+----------------------------------+
```

如果插件宽度有限，也可以做成“顶部导航 + 内容区”而不是左右分栏：

```text
+----------------------------------+
| Academic Slides Toolkit          |
| Deck | Equations | Components... |
+----------------------------------+
| Current panel content            |
|                                  |
|                                  |
+----------------------------------+
```

### 建议优先采用

`顶部稳定导航 + 主体内容区`

原因：

- 你们现在插件宽度只有 360，左侧再切一列会太挤
- 顶部 tab 更适合 Figma 小宽度插件
- 二级内容还能保留 sidebar 感

## 10. 每个模块打开后的样子

### 10.1 Deck

顶部显示当前模板状态卡片。

下面分组显示：

- 当前模板
- 页码设置
- 内容来源
- 同步操作

这部分保留你们现在已经做好的能力。

### 10.2 Equations

默认进入 `Insert Equation` 页面。

建议页面结构：

- 输入框
- 实时预览
- display / inline 切换
- 样式设置
- 插入按钮

如果当前选中的是插件公式，则切换成：

- 当前公式源码
- 更新按钮
- 编号设置
- 删除按钮

### 10.3 Components

更适合做成“组件目录 + 快速插入”。

首屏就列出：

- Figure + Caption
- Table + Caption
- Theorem
- Definition
- Proof
- Section Divider

点某个组件后再进入该组件的参数页。

### 10.4 Assets

更像资源管理器。

可以分成：

- References
- Citations
- Charts

### 10.5 Settings

先做 language，后面再扩。

## 11. 建议的交互原则

### 11.1 首页不是说明页，而是导航页

不要把首页做成很长的引导文案。

首页应该更像：

- 模块导航
- 当前 deck 状态
- 最近使用功能

### 11.2 具体操作进入模块页

例如：

- 点 `Equations` 才显示公式编辑器
- 点 `Components` 才显示 theorem / figure 插入器

这样主页不会越来越臃肿。

### 11.3 上下文感知

如果选中了某种插件对象，导航可以高亮推荐功能。

例如：

- 选中公式 -> 自动切到 `Equations / Selected Equation`
- 选中 footer -> 自动切到 `Deck / Template`
- 选中 figure block -> 自动切到 `Components / Figure`

### 11.4 操作页尽量单任务

每个页面只做一件事，不要把“插入、编辑、全局设置、批量刷新”都塞在一个面板里。

## 12. 具体导航方案建议

建议最终做成这种层级：

### Shell

- Brand / deck context
- 一级导航
- 当前模块内容区

### Deck 模块

- Deck Home
- Template
- Sources
- Sync

### Equations 模块

- Equation Home
- Insert
- Selected
- Numbering

### Components 模块

- Component Home
- Figure
- Table
- Theorem
- Section Divider

### Assets 模块

- Assets Home
- References
- Citations
- Charts

### Settings 模块

- General
- Language
- Defaults

## 13. MVP 信息架构建议

如果下一阶段只做最小可行版本，我建议页面只先做这 5 个一级模块：

- Deck
- Equations
- Components
- Assets
- Settings

然后只有这几个二级页面真正落地：

- Deck / Home
- Deck / Sync
- Equations / Insert
- Equations / Selected
- Components / Quick Insert
- Settings / Language

这样规模刚好，不会一开始就把 UI 系统做得太重。

## 14. 结论

推荐结论：

1. 保留当前 sidebar 方向
2. 不再继续把所有功能都堆在一个长页面里
3. 改成“稳定导航 + 模块页内容区”
4. 第一个新增大模块优先做 `Equations`
5. 先做 `Equation MVP + 新导航结构`，再扩展 Components 和 Assets

一句话总结：

`插件主页应该像 Figma 的导航骨架，具体功能应该像 inspector 面板。`

