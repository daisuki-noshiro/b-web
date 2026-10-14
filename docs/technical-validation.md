# b-web 第一阶段技术验证报告

验证日期：2026-10-15（Asia/Shanghai）。项目：`E:\go\code\birthday-web2\b-web`。

## 结论

**PixiJS v8 + GSAP 适合实现生日主题的连续横向交互网站。** 本次已实际实现、编译并用真实 Chromium 验证：连续世界、多层视差、横向镜头、环境循环动画和 Canvas / HTML 卡片交互可共同工作。Go / Gin 可独立服务 API，也可直接托管 Vite 生产构建。

这是针对本原型的结论。Graphics 占位景观和单个事件尚不能证明正式照片、大型图集及全部移动设备上的最终性能。

## 范围与工程组织

原工程保留，未修改 `E:\go\code\birthday-web` 或 `a-web`。`birthday-web2` 原为空，在其中创建独立的 `b-web`。

| 职责 | 实现位置 | 说明 |
| --- | --- | --- |
| Go 服务入口 | `cmd/server/main.go` | 地址、静态目录、超时与退出 |
| HTTP / API | `internal/httpserver/router.go` | Gin 健康检查、生产资源 |
| Application | `frontend/src/core/application.js` | v8 异步初始化、ResizeObserver、像素策略 |
| Camera | `frontend/src/core/camera.js` | 唯一镜头状态、目标、GSAP、边界 |
| World | `frontend/src/world/world.js` | 占位景观、环境动画、信箱显示对象 |
| Parallax | `frontend/src/world/parallax.js` | 图层投影、可见块剔除 |
| Input | `frontend/src/input/input.js` | 滚轮、方向键、长按与键盘按钮 |
| Interaction | `frontend/src/interaction/interaction.js` | 附近事件检测、分发与阻止穿透 |
| HTML UI | `frontend/src/ui/` | 原生模态 dialog、调试区 |
| 事件 / 内容 | `config.js` / `data/memories.js` | 世界坐标与具体卡片内容分离 |

采用 Go 1.26.3、Gin 1.12.0、Node 24.19.0、PixiJS 8.22.0、GSAP 3.15.0、Vite 8.3.4、Playwright 1.64.1。没有采用框架、TypeScript、游戏引擎或数据库。

## 关键实现与验证

### 场景与像素策略

- `new Application()` 后 `await app.init(...)`，使用 `app.canvas` 和 v8 Graphics 的 `rect(...).fill(...)`。
- 1 个世界单位等于 1 个逻辑像素，世界宽 6400。镜头表示视口左缘，区域按视口中心确定。
- 整数倍率 `clamp(floor(CSS 高度 / 360), 1, 4)`。逻辑画布尺寸向上取整，CSS 整数放大，超出不足一个逻辑像素的部分由容器裁切，完整填满窗口。
- `resolution: 1`、`antialias: false`、`roundPixels: true`、纹理默认 `nearest`、CSS `image-rendering`。本阶段主动限制像素密度，没有按 DPR 无限增加 GPU 像素。
- ResizeObserver 同步重建占位景观、调整镜头范围并更新 HTML 提示；不在每帧重建 Graphics。

### 四层视差与边界

| 层 | 速度 | 内容 |
| --- | ---: | --- |
| 天空 | 0.08 | 视口底色、像素太阳、连续云层 |
| 山脉 | 0.22 | 两条阶梯山形 |
| 树林 | 0.55 | 前后两排树冠 |
| 前景 | 1.00 | 草地、小路、树木、栅栏、信箱与灯 |

参数集中于 `config.js`；前三层可在 0～1 调整，前景固定 1，保持世界物件与镜头坐标一致。图层水平偏移为 `-round(camera.renderX × speed)`。天空底色填满视口，景观覆盖世界并留一块余量；慢速图层的覆盖宽度足够，世界两端没有明显空白或断裂。

景观按 512 单位分块，只渲染进入视口附近的静态块。没有把 6400 宽的完整世界缓存成一张巨大纹理。

### 镜头与输入

- 滚轮纵向和触控板横向输入均可探索；处理 `deltaMode`，限制单次极大增量，并保留 Ctrl + 滚轮缩放。
- 方向键由按键集合记录，按帧乘时间增量；底部按钮支持鼠标 / 触控长按与键盘激活。
- `GSAP quickTo` 重用一个 Tween，在 0.42 秒内平滑收敛到最新目标。没有为每个输入创建排队动画。
- 目标限制在 `[0, worldWidth - viewportWidth]`；窗口变大时立即裁定有效范围。
- `x` 保留连续动画精度，`renderX` 是实际渲染的整数位置。前景、HTML 提示和调试坐标均使用同一 `renderX`。
- 失焦、隐藏页面和打开卡片会清理按键并停止镜头；后台停止 Pixi ticker。支持系统“减少动态效果”偏好，仍能完整探索。

### 环境动画

云朵以每秒约 2～4 逻辑像素漂移，在视口外循环；灯光由叠加正弦波调整 alpha；少量草簇通过 skew 轻微摆动。都只改变位置 / 变换 / alpha，没有逐帧创建对象、重建几何或复杂粒子系统。

### 信箱与回忆卡片

- 唯一事件位于固定 `x = 980`，接近并进入可见范围时显示提示。
- Canvas 信箱的 `pointertap` 和 HTML 提示都进入同一个 Interaction 分发路径。
- 事件只携带 `type`、`contentId`、`eventId`。World 不依赖卡片文案，后续可扩展其他事件类型。
- 卡片提供本地占位图片、标题、日期和描述，通过原生 `dialog.showModal()` 打开。
- 背景变为 inert，输入模块同时阻断镜头操作并停止当前 Tween；关闭按钮、返回按钮、Escape 与遮罩点击可退出。
- 关闭时同步恢复提示后再恢复焦点。边缘处提示保持在屏幕内，指示角仍指向信箱；Resize 后按实际世界投影更新位置。

### 后端与资源

`GET /api/health` 返回：

```json
{"status":"ok","service":"b-web"}
```

开发：Vite `/api` 代理至 Gin；前端以 fetch 发起健康检查并显示连接状态，5 秒超时。API 不可用时场景仍工作，刷新页面会重新检测。

生产：显式设置 `BWEB_STATIC_DIR`，Gin 服务构建后的 HTML / JS / CSS / 图片，与 API 同源；没有依赖 Vite 开发服务器。不存在的 API 和资源返回 404，资源目录不提供列表，也不通过 HTML 回退掩盖错误。带 hash 的 `/assets/` 文件使用长期缓存，入口使用 `no-cache`。

为回忆 API、祝福 API、访问验证中间件预留 `/api` 分组。私人照片控制尚未实现，未来必须通过受控端点提供。

## 执行结果与证据

| 检查 | 结果 |
| --- | --- |
| `go test ./...` | 通过；健康检查、生产资源、缓存、HEAD、缺失目录、API 404、路径边界 |
| `go vet ./...` | 通过 |
| `go build -o bin/b-web.exe ./cmd/server` | 通过，生成可运行服务 |
| `npm test` | 5 / 5 通过；镜头、Tween 复用、像素覆盖、视差剔除、事件分发 |
| `npm run build` | 通过；存在下述 Pixi 分包体积提示 |
| Chromium 开发路径 E2E | 7 / 7 通过，Gin 18080 + Vite 5173 |
| Chromium 生产托管 E2E | 7 / 7 通过，Gin 18081 直接服务验证构建 |
| 普通生产包浏览器冒烟检查 | 通过；API、滚轮、提示、卡片开关、测试快照入口不存在，零控制台错误 |
| 应用内浏览器 | 实际打开生产页面，检查窄屏显示与探索 |

浏览器用例通过真实滚轮、按键、按钮和 Canvas 点击操作，验证快照为只读，未直接设置镜头坐标代替交互。专用生产验证包通过 `VITE_VALIDATION=true` 提供快照；交付的正常生产包不暴露该入口。

覆盖以下行为：

1. Canvas 与资源加载、真实 API 健康检查和环境动画变化。
2. 连续滚轮收敛、方向键反向、四层投影公式。
3. 大量滚轮到达左右边界后仍可反向控制。
4. 提示 / Canvas 点击打开卡片；图片加载、模态输入隔离、Escape、关闭后焦点及移动恢复。
5. 390×844、667×375、1920×1080 Resize，提示投影与画布覆盖；手机卡片布局和边缘提示完整。
6. 注入 HTTP 503 后明确显示 API 错误，镜头继续可用。
7. 调试区隐藏 / 显示、减少动态效果模式和可访问按钮。

正常路径没有观测到未捕获 JavaScript 异常、控制台 error、失败请求或缺失资源。503 是专门用例主动注入的预期错误。修复了首轮发现的焦点恢复问题及 Graphics 子节点警告；调整了响应式测试的鼠标位置。

本机常见截图 / 快照约 50～60 FPS；启动及软件 WebGL 暖机时也出现约 33 FPS 的短样本。自动化使用 SwiftShader 软件渲染，这些是近似观测值，不是设备性能保证。连续操作过程中未观察到动画堆积或明显卡顿；正式照片加入后需要重新测量。

证据位于项目根 `artifacts/`：`world-desktop.png`、`world-end.png`、`world-mobile.png`、`memory-card.png`、`memory-mobile.png`、`world-final.png`。最终 `e2e-development.json` 为 7 项通过 / 0 失败（19.8 秒），`e2e-production.json` 为 7 项通过 / 0 失败（15.5 秒）。生成证据与构建文件已加入 Git 忽略。

## 发现的问题与技术风险

- PixiJS 主分包约 **512.15 KB**，gzip **145.66 KB**，超过 Vite 默认 500 KB 提示。构建和加载成功；后续正式资源加入时，再做启动包预算、按需模块与图集加载评估。
- 整数倍率切换会改变可见世界范围，而非拉伸整个世界；这是像素清晰度策略。正式美术需要确定统一基准分辨率、地平线比例和移动端构图。
- 当前 Graphics 景观仅占位，正式像素纹理的图集尺寸、nearest 采样、显存和加载时序还需验证。
- 测试覆盖 Chromium 与应用内浏览器；没有验证 Safari、Firefox、iOS 真机、低端 Android 或长时间运行 / GPU 上下文丢失恢复。
- 手机上已有可用长按按钮，尚未实现手势拖动。API 连接状态在初始化时检测，没有后台轮询。
- 当前唯一事件使用横向世界坐标，纵向位置随地面布局调整。正式事件密度和多事件提示优先级仍需设计。
- 私人照片访问控制和正式内容 API 只预留位置，本原型不能承载私人照片生产发布。

## 下一阶段优先项

1. 确定像素基准尺寸、色板与四层素材规格，先替换一小段景观，验证图集和加载流程。
2. 在 iOS Safari 与低端 Android 上实测渲染、整数缩放、长按 / 手势输入和卡片可用性。
3. 定义回忆数据结构、事件布局与加载接口，再让少量真实内容贯通 Gin、事件系统和 HTML 卡片。
4. 在加入私人照片前落实访问验证、受控图片端点与缓存策略。

暂不进入祝福、蛋糕、复杂游戏机制或后台开发。启动和复现命令见根目录 README。

## 官方资料

- [PixiJS v8 Application](https://pixijs.com/8.x/guides/components/application)：异步初始化及渲染选项。
- [PixiJS v8 Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics)：v8 绘制 API 与显示对象规则。
- [PixiJS Textures](https://pixijs.com/8.x/guides/components/textures)：纹理来源与采样策略。
- [GSAP quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo()/)：连续重定向同一个 Tween。
- [Vite Server Options](https://vite.dev/config/server-options)：开发代理。
- [Gin Quickstart](https://gin-gonic.com/en/docs/quickstart/)：服务与依赖初始化。
