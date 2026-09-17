# AGENTS.md

面向在此仓库工作的 AI 助手与协作者的说明文件。

## 项目概况

**鹈鹕骑自行车（Pelican on a Bicycle）** — 一个纯静态主题网站。

- 主题：一只鹈鹕骑自行车的虚构科普页面
- 技术栈：原生 HTML + CSS + JavaScript，**零依赖、零构建步骤**
- 插画：全部为手写内联 SVG，无外部图片资源
- 部署形态：任意静态托管，或本地直接双击 `index.html`

## 目录结构

```
网站/
├── index.html      # 单页结构：导航 / Hero / 五个内容板块 / 页脚
├── style.css       # 全部样式，含主题变量、动画关键帧、响应式
├── script.js       # 原生 JS：导航、滚动进场、数字动画、骑行控制
├── AGENTS.md       # 本文件
└── .gitignore
```

## 开发约定

### 必须遵守

1. **不引入依赖。** 不加 npm 包、不加 CDN 资源、不加构建工具。任何新功能都应能用原生能力实现。
2. **插画用内联 SVG。** 不使用位图、不引用外部图片文件。新增图形直接写进 HTML 或作为 SVG 元素渲染。
3. **颜色走 CSS 变量。** 所有颜色值必须定义在 `:root` 中，禁止在规则里硬编码色值。SVG 内部同样使用 `var(--xxx)`，以便随主题整体切换。
4. **保持单页结构。** 新内容以 `<section class="section">` 追加，导航项同步更新。
5. **响应式断点固定为 980px / 720px / 420px。** 新增组件需在这三个断点下验证。

### 主题变量

主题由 `style.css` 顶部 `:root` 定义。当前为**浅色主题**，关键变量：

| 变量 | 用途 |
| --- | --- |
| `--bg` / `--bg-alt` | 页面底色 / 交替区块底色 |
| `--ink` / `--ink-2` / `--ink-3` | 主文字 / 次要文字 / 弱化文字 |
| `--accent` / `--accent-soft` | 强调色（青绿）/ 强调底色 |
| `--pelican` / `--pelican-shade` / `--pouch` / `--orange` | 鹈鹕本体 / 阴影 / 喉囊 / 喙与腿 |
| `--bike` | 车架颜色 |
| `--sky-1` `--sky-2` `--sun` `--road-1` `--road-2` `--hill-far` | 场景配色 |

**注意：** SVG 使用 `var(--xxx)` 引用时，颜色由**该 SVG 所在文档**的 CSS 解析，因此修改变量即可全局换肤。

若要新增深色主题，在 `:root` 之后追加 `@media (prefers-color-scheme: dark)` 或 `[data-theme="dark"]` 覆盖同名变量即可，无需改动任何 SVG 结构。

## 骑行动画机制

动画采用 **CSS 关键帧 + CSS 变量** 驱动，`script.js` 只负责改变量值，不逐帧操作 DOM。

- `.r-wheel` / `.r-crank` → `@keyframes spin`，转速由元素上的 `--dur` 控制
- `.r-rig` → `@keyframes rigBob`，上下起伏周期由 `--pedal` 控制
- `.r-wing` → `@keyframes flap`，独立低频扇动，与踏频解耦
- 暂停通过 `.ride-track.is-paused` 设置 `animation-play-state: paused`
- 速度映射：`时长 = 0.8 × (60 / 踏频)`，即 60 rpm 对应 0.8 秒/圈

`script.js` 中的 `rAF` 循环仅作为老浏览器不支持 SVG CSS 动画时的兜底旋转，正常环境下不介入。

### ⚠️ 两个必须遵守的结构约束（改动画前务必读）

这两条是**真实渲染实测**踩出来的，违反任何一条都会导致动画错位：

**1. 定位与旋转必须拆到两层 `<g>`**

`@keyframes` 里的 `transform` 会**整体替换**元素上的 SVG `transform` 属性。若把 `translate` 写在同一个元素上，会被动画覆盖，元素被甩到画布原点。

```html
<!-- 正确：职责分离 -->
<g transform="translate(150,244)">          <!-- 外层：绝对定位 -->
  <g class="r-wheel" id="wheelRear">...</g>  <!-- 内层：只旋转 -->
</g>
```

**2. 图形包围盒一律从 `(0,0)` 起算，不出现负坐标**

`transform-box: fill-box` 配合 `transform-origin: center` 时，若 `getBBox()` 返回负坐标（如 `x=-46,y=-46`），浏览器会把原点解析到错误位置（实测偏移 `(-21,+14)`，导致偏心公转）。

```html
<!-- 正确：cx=cy=r，包围盒从 (0,0) 开始 -->
<circle cx="46" cy="46" r="46"/>

<!-- 错误：包围盒为 x=-46,y=-46，transform-origin:center 会失准 -->
<circle r="46"/>
```

同时**不要用 CSS `translate` 属性给 SVG 元素做定位**——它与 `transform-box` 的交互同样不可靠。

## 无障碍与动效

- 所有装饰性 SVG 标记 `aria-hidden="true"`；有语义的插图提供 `role="img"` + `aria-label`
- 按钮使用 `aria-pressed` 表达播放状态
- 全局遵循 `prefers-reduced-motion: reduce`，此时禁用一切动画与滚动进场

## 验证方法

**静态检查不够，必须做真实渲染验证。** 本项目第一版仅做了语法与结构检查，结果遗漏了 5 个真实缺陷（车轮偏心公转、鹈鹕悬空 29.8px、翅膀形态错误等）。

本机可用方案：**无头 Edge + CDP**（`agent-browser` 不支持 Windows）。
可用浏览器：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`

```bash
# 1. 起静态服务（必须后台运行）
node .workbuddy-ai/probe-server.js "E:/aicode/网站" 8098

# 2. 综合测量（布局 / 动画 / 交互 / 多视口溢出 / 截图）
node .workbuddy-ai/cdp-probe.js "http://127.0.0.1:8098/index.html" ".workbuddy-ai/report.txt"

# 3. 滚动复测（IntersectionObserver 进场 / 数字滚动 / 进度条）
node .workbuddy-ai/cdp-scroll.js

# 4. 坐标校验（元素在 SVG 用户坐标系中的真实位置）
node .workbuddy-ai/cdp-final.js

# 5. 通用截图
node .workbuddy-ai/shot.js "<url>" "<out.png>" [width] [height]
```

**判定动画是否真的在运行**：连续多次采样比对，不要单次采样。若采样间隔恰好是动画周期的整数倍，会读到不变的矩阵而误判为静止。

**判定旋转轴是否正确**：用 `getScreenCTM()`（返回真实变换矩阵），不要用 `getBoundingClientRect()`（返回旋转后的包围盒，会误导）。


## 本地预览

```bash
# 方式一：直接打开
start index.html          # Windows

# 方式二：起一个静态服务器（推荐，避免 file:// 的部分限制）
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 内容说明

页面所有统计数据（速度、功率、容量、物种评级）均为**虚构创作**，不具任何科学参考价值。新增内容请保持同样的调侃式科普语气，不要在页面上呈现为真实科学结论。

## 修改后的自检清单

- [ ] 未引入任何外部依赖
- [ ] 颜色全部走 CSS 变量
- [ ] **定位与旋转拆到了两层 `<g>`**（见上文结构约束）
- [ ] **图形包围盒无负坐标**，未用 CSS `translate` 给 SVG 定位
- [ ] 在 320 / 375 / 420 / 480 / 720 / 768 / 980 / 1200 / 1440 px 下横向溢出均为 0
- [ ] 新增 SVG 图形有正确的 `viewBox`
- [ ] 键盘可操作（Tab 可达、空格可暂停）
- [ ] 开启"减弱动态效果"后页面静态可用
- [ ] **做过真实渲染验证**（无头 Edge + CDP），而非仅语法检查
- [ ] 报告结论时区分"实测数据"与"推测"

