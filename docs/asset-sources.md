# 第二阶段美术素材来源与授权

整理日期：2026-10-15。场景中的第三方图像全部来自 Luis Zuno（Ansimuz）发布的手绘像素素材。未使用 AI 生成图像，也未提取《王国：两位君主》或《火山的女儿》的游戏素材。

下载来源为作者在 OpenGameArt 发布的 ZIP 链接，已实际下载、解压并阅读包内许可文本。公开项目中只保留采用的 PNG 与许可证，不包含下载包的游戏示例代码、音乐、角色或敌人。

## 采用的素材

### Magical Road Pixel Art Environment

- **作者**：Luis Zuno / Ansimuz。
- **原始页面**：[作者 itch.io](https://ansimuz.itch.io/magical-road-pixel-art-environment)、[OpenGameArt](https://opengameart.org/content/magical-road-pixel-art-environment)。
- **实际下载**：[magical_road_files.zip](https://opengameart.org/sites/default/files/magical_road_files.zip)。
- **许可证**：OpenGameArt 标明 CC0 1.0；包内许可允许个人/商业使用、修改、重新分发，不要求署名。
- **原始文件**：`assets/originals/magical-road/back.png`、`middle.png`、`tileset.png`。
- **实际使用**：`frontend/public/art/sky.png`、`forest.png`、`meadow.png`、`path.png`、`bank.png`；另外参与 `memory-landscape.png` 组合。
- **修改**：替换天空/草地色板；提取云形后重新安排疏密；裁切中景森林、花草地面、土路与可平铺岸边。保持 nearest 像素采样。
- **署名**：非强制；网页常驻 `ART BY ANSIMUZ · CC0` 与作者链接。
- **许可证副本**：[magical-road.txt](licenses/magical-road.txt)。

### SunnyLand - Forest

- **作者**：Luis Zuno / Ansimuz。
- **原始页面**：[OpenGameArt](https://opengameart.org/content/sunnyland-forest)。
- **实际下载**：[sunny-land-forest-files.zip](https://opengameart.org/sites/default/files/sunny-land-forest-files.zip)。
- **许可证**：OpenGameArt 标明 CC0 1.0；包内文字将美术列为 public domain，允许个人/商业使用。
- **原始文件**：`assets/originals/sunnyland-forest/house.png`、`plant.png`、`mushroom-red.png`、`rock.png`。
- **实际使用**：`frontend/public/art/` 中同名 PNG；`house.png` 还参与明信片组合。
- **修改**：降低土木颜色的饱和度、提亮暗部，屋顶植被调整为暖绿。没有修改屋体或植被的像素轮廓。
- **署名**：非强制，已在网站统一署名。
- **许可证副本**：[sunnyland-forest.txt](licenses/sunnyland-forest.txt)。许可文件提及的音乐没有采用。

### SunnyLand Expansion Pack: Trees

- **作者**：Luis Zuno / Ansimuz。
- **原始页面**：[OpenGameArt](https://opengameart.org/content/sunnyland-expansion-pack-trees)。
- **实际下载**：[sunnyland_trees_expansion_files.zip](https://opengameart.org/sites/default/files/sunnyland_trees_expansion_files.zip)。
- **许可证**：OpenGameArt 标明 CC0 1.0；包内许可明确允许个人/商业使用、修改和重新分发。
- **原始文件**：`assets/originals/sunnyland-trees/tree.png`、`pine.png`。
- **实际使用**：`frontend/public/art/tree.png`、`pine.png`；前者也参与明信片组合。
- **修改**：树冠统一为暖绿渐阶，原紫色树干改为铜棕渐阶。近处树木采用整数 2 倍、较远树木 1 倍显示，不改变轮廓；未采用棕榈树。
- **署名**：非强制，已在网站统一署名。
- **许可证副本**：[sunnyland-trees.txt](licenses/sunnyland-trees.txt)。

### SunnyLand Woods

- **作者**：Luis Zuno / Ansimuz。
- **原始页面**：[作者 itch.io](https://ansimuz.itch.io/sunnyland-woods)、[OpenGameArt](https://opengameart.org/content/sunnyland-woods)。
- **实际下载**：[sunny-land-woods-files.zip](https://opengameart.org/sites/default/files/sunny-land-woods-files.zip)。
- **许可证**：两站均标明 CC0 1.0，作者明确允许使用和修改；包内美术许可为 public domain。
- **原始文件**：`assets/originals/sunnyland-woods/bg-mountains.png`、`bg-clouds.png`。
- **实际使用**：`frontend/public/art/mountains.png`、`clouds.png`；山脉也参与明信片组合。
- **修改**：蓝色山岩改为低对比鼠尾草色；云层裁切、只提取亮云形、移除背景并暖色化，独立缓慢移动。
- **署名**：非强制，已在网站统一署名。
- **许可证副本**：[sunnyland-woods.txt](licenses/sunnyland-woods.txt)。未使用包内音乐、演示引擎、角色和敌人。

## 原创点缀与复合图片

`sun.png`、`water.png`、`mailbox.png`、`flowers.png`、`lantern.png` 为本项目原创的少量像素点缀，由 `scripts/prepare_art.py` 中显式坐标、有限色板与确定性代码绘制。它们不是第三方素材，也不是 AI 生成图片。主体树木、山岩、林地、地面、小屋、岩石和植被均使用上述真实美术 PNG。

`memory-landscape.png` 为已授权素材改色版本与原创点缀组合的风景明信片，沿用第三方部分的 CC0 授权。没有私人照片。

`frontend/public/art/manifest.json` 完整列出 19 张输出图片的来源、处理方法、像素尺寸和 SHA-256，以及 11 张原始 PNG 的 SHA-256。离线执行 `python scripts/prepare_art.py`（需要 Pillow）可重建全部输出；前后端日常启动不依赖 Python。

## 参考与未采用资源

- [Kingdom Two Crowns 官方页面](https://store.steampowered.com/app/701160/Kingdom_Two_Crowns/)：参考景深、岸边剪影与倒影组织方式，没有下载或使用游戏图片作为场景素材。
- [Volcano Princess 官方页面](https://store.steampowered.com/app/1669980/Volcano_Princess/)：参考暖色、自然景物与纸质 UI 的情绪；没有使用其游戏图像。
- [Parallax Forest / Ansimuz](https://ansimuz.itch.io/parallax-forest)：有完整分层，但调性偏浓密，本次没有采用。页面一处写不要求署名、元数据列 CC BY 4.0；未将其作为本项目 CC0 素材。
- [Grassy Mountains / vnitti](https://vnitti.itch.io/grassy-mountains-parallax-background)：背景质量良好，但需要另查包内使用细则且视觉语言与本次森林不同；未下载、未采用。
- [Forest of Illusion / Ansimuz](https://ansimuz.itch.io/sunnyland-forest-of-illusion)：本次未采用。页面扩展包标价 **至少 US$1**（查询于 2026-10-15），适合以后研究完整森林过渡；没有购买或取得付费扩展包。

CC0 的规范文本：[Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。采用素材的依据是作者原始发布页面及随包许可证；不依据搜索摘要或第三方转载猜测授权。
