# b-web · 晴光写给你

当前美术实验分支：`codex/visual-experiment`。在明亮的湖畔像素世界里横向探索，遇到林间小屋和路边信箱，打开一张风景明信片。

第二阶段使用授权明确的 Ansimuz 手绘 PNG，完成五层视差、地面/湖岸拼接、倒影、云层、花草和纸灯动画，以及重新设计的 HTML UI。没有采用 AI 图片。图片与回忆仍是实验内容；未实现登录、正式相册、祝福系统、蛋糕、数据库或后台。

**对照与回退**：访问 `/?scene=technical` 对照第一阶段 Graphics 景观。要回到包括旧 UI 在内的完整版本，可执行 `git switch --detach stage-1-technical-validation`；返回实验用 `git switch codex/visual-experiment`。基线分支 `codex/init-b-web` 保留。

设计说明、实际截图和限制见 [视觉实验报告](docs/visual-experiment.md)；素材逐项授权见 [素材来源](docs/asset-sources.md)。第一阶段记录保留在 [技术验证报告](docs/technical-validation.md)。

项目位置：`E:\go\code\birthday-web2\b-web`。与原 `birthday-web` / `a-web` 工程独立。

## 技术栈与环境

- Go 1.26+，Gin 1.12.0。
- 原生 JavaScript ES Modules，PixiJS **8.22.0**，GSAP **3.15.0**，Vite **8.3.4**。
- Node.js 22.12+；本次使用 Node 24.19.0、npm 11.17.0。
- 支持 WebGL 的现代浏览器。测试依赖 Playwright 1.64.1。
- npm 与 Go 依赖版本分别由 `package-lock.json` 和 `go.mod` / `go.sum` 固定。

## 目录

```text
b-web/
├─ assets/originals/               # 采用的第三方原始 PNG（CC0）
├─ scripts/prepare_art.py          # 可重复的改色/裁切/组合流程，非 AI
├─ cmd/server/main.go              # 入口、环境变量、优雅退出
├─ internal/httpserver/
│  ├─ router.go                    # Gin API、可选生产静态文件
│  └─ router_test.go
├─ frontend/
│  ├─ index.html                   # HTML UI 和原生 dialog
│  ├─ package.json / package-lock.json
│  ├─ vite.config.js               # /api 开发代理
│  ├─ playwright.config.js
│  ├─ public/art/                  # 19 张输出 PNG 与来源/哈希 manifest
│  ├─ src/
│  │  ├─ main.js                   # 模块编排、生命周期、更新循环
│  │  ├─ config.js                 # 世界宽度、视差速度、区域、事件坐标
│  │  ├─ styles.css
│  │  ├─ core/                     # Application、Camera、像素布局
│  │  ├─ world/                    # 美术场景、素材加载、Parallax、旧场景对照
│  │  ├─ input/                    # 滚轮、键盘、长按按钮
│  │  ├─ interaction/              # 坐标检测、事件分发
│  │  ├─ data/                     # 独立回忆占位内容
│  │  └─ ui/                       # 卡片、调试面板
│  ├─ tests/                       # 核心单元测试与真实浏览器 E2E
│  └─ dist/                        # npm run build 生成，Git 忽略
├─ docs/technical-validation.md
├─ docs/visual-experiment.md
├─ docs/asset-sources.md
├─ docs/licenses/                 # 随包许可证原文
├─ docs/screenshots/              # 第二阶段实际运行截图
├─ artifacts/                     # 实测截图、结果，Git 忽略生成物
├─ bin/                           # 本地编译产物，Git 忽略
├─ .gitignore
└─ go.mod / go.sum
```

## 开发启动（两个终端）

终端 1，独立启动 Gin：

```powershell
cd E:\go\code\birthday-web2\b-web
go mod download
go run ./cmd/server
```

终端 2，独立启动 Vite：

```powershell
cd E:\go\code\birthday-web2\b-web\frontend
npm ci
npm run dev
```

打开 <http://127.0.0.1:5173>。后端健康检查：<http://127.0.0.1:8080/api/health>。

Vite 将 `/api` 转发到 `http://127.0.0.1:8080`。前端单独启动时世界仍可探索，调试面板会显示 API 未连接。

端口被占用时，不要关闭其他项目服务。通过环境变量调整：

```powershell
# Go 终端
$env:BWEB_ADDR = '127.0.0.1:18080'
go run ./cmd/server

# Vite 终端
$env:BWEB_API_TARGET = 'http://127.0.0.1:18080'
npm run dev -- --port 5174
```

## 如何体验

1. 向下滚动鼠标向右探索，向上滚动返回；支持触控板横向滚动。
2. 按住 `←` / `→`，或长按底部按钮。按钮也支持 Enter / Space。
3. 探索到世界 `x = 980` 的信箱附近，点击信箱或“打开这封回忆”。
4. 卡片可通过 `×`、返回按钮、Escape 或点击遮罩关闭。打开时镜头停止，世界输入被隔离。
5. 右上“观察面板”显示/隐藏 FPS、镜头左缘世界坐标、视口中心所在区域和 Gin API 状态；默认收起，添加 `?debug` 可默认打开。

美术实验宽 2048 逻辑像素，三个景观区域；第一阶段对照宽 6400。视差速度在 `src/config.js` 中调整，其他层范围为 0～1，前景必须为 1，保持事件世界坐标一致。

素材已经预处理并提交，普通开发/构建只需要 Go 和 npm。如要重新改色、裁切或组合，安装 Python 与 Pillow 后从项目根运行 `python scripts/prepare_art.py`。处理输入、输出与许可均在项目中，无需再次下载美术资源。

## 生产启动（Gin 托管构建资源）

```powershell
cd E:\go\code\birthday-web2\b-web\frontend
npm run build

cd ..
go build -o bin/b-web.exe ./cmd/server
$env:GIN_MODE = 'release'
$env:BWEB_STATIC_DIR = (Resolve-Path frontend/dist).Path
$env:BWEB_ADDR = '127.0.0.1:8080'
.\bin\b-web.exe
```

打开 <http://127.0.0.1:8080>。此时前端与 API 同源，不需要 Vite 代理；后端直接服务 `index.html` 和构建资源。程序和 `frontend/dist` 需要一起保留，静态目录也可以指定其他绝对路径。

- 未设置 `BWEB_STATIC_DIR`：仅 API 的开发模式。
- 设置目录但缺少 `index.html`：启动时明确报错。
- 未知 API 与缺失静态资源返回 404，禁止目录索引。
- 默认只监听本机。需要对外部署时，再配置监听地址、域名和 HTTPS。
- `npm run preview` 仅预览静态构建，不是生产部署方式，也没有 `/api` 代理；完整验收使用 Gin。

## 编译与测试

```powershell
# 项目根目录
go test ./...
go vet ./...
go build -o bin/b-web.exe ./cmd/server

# frontend 目录
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

美术实验的 E2E 共 9 项，会检查素材、五层视差、第一阶段对照并保存实际截图。普通生产包启动后，还可在 `frontend` 运行 `npm run test:production`；默认连接 `http://127.0.0.1:18081`，设置 `BWEB_SMOKE_URL` 可改为自己的 Gin 地址。

E2E 默认自动启动 `127.0.0.1:18080` 的 Gin 和 `5173` 的 Vite，用真实浏览器输入操作，结束后关闭自己启动的服务。端口已被使用时可能复用服务；请确认是此项目，否则改端口配置。

E2E 的世界快照仅在开发模式暴露。要测试生产托管，先生成专用验证构建：

```powershell
$env:VITE_VALIDATION = 'true'
npm run build
Remove-Item Env:VITE_VALIDATION
# 在另一个终端以 BWEB_STATIC_DIR 启动 Gin 后，运行：
$env:BWEB_E2E_URL = 'http://127.0.0.1:8080'
npm run test:e2e
Remove-Item Env:BWEB_E2E_URL
# 验证结束重新执行 npm run build，得到不暴露快照的正常生产包。
```

浏览器测试产生 `artifacts/e2e-results.json` 和景观/卡片截图。失败时附带 Playwright trace。完整验证结论与边界见 [技术验证报告](docs/technical-validation.md)。

## 扩展位置

- 在 `internal/httpserver/router.go` 的 `/api` 分组增加回忆、祝福端点及访问验证中间件。
- `Interaction` 仅发送 `type`、`contentId`、`eventId`；以后添加新的事件类型，无需让 World 依赖具体回忆内容。
- 用回忆 API 替换 `src/data/memories.js` 本地数据，继续使用 HTML UI 展示。
- 私人照片由未来受控 API 提供，不要放入公开 `frontend/public`。
- 正式像素素材使用纹理/图集替换 Graphics；保持逻辑像素、整数缩放、nearest 采样和一致投影。

官方参考：[PixiJS v8 Application](https://pixijs.com/8.x/guides/components/application)、[Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics)、[GSAP quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo()/)、[Vite 代理](https://vite.dev/config/server-options)、[Gin Quickstart](https://gin-gonic.com/en/docs/quickstart/)。
