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

## 无障碍与动效

- 所有装饰性 SVG 标记 `aria-hidden="true"`；有语义的插图提供 `role="img"` + `aria-label`
- 按钮使用 `aria-pressed` 表达播放状态
- 全局遵循 `prefers-reduced-motion: reduce`，此时禁用一切动画与滚动进场

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
- [ ] 在 980px / 720px / 420px 三档宽度下无横向滚动条、无元素重叠
- [ ] 新增 SVG 图形有正确的 `viewBox`
- [ ] 键盘可操作（Tab 可达、空格可暂停）
- [ ] 开启"减弱动态效果"后页面静态可用
