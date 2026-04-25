# Game Studio: Isometric World Exploration Prototype

## 1. 总体架构 (Overall Architecture)
采用 Phaser 3 作为底部渲染和事件引擎，结合 Vite 进行现代化构建。React 负责渲染 HUD 等 UI 面层，与 Phaser 引擎通过 Event Bus 或全局状态解耦通讯。
地图系统采用强解耦设计：
- `TerrainGenerator`: 根据 Seed 计算坐标的底层地形数据资源。
- `ChunkManager`: 负责管理 Chunk 的生命周期（加载、卸载），追踪摄像机视野。
- `MapEngine`: 统筹渲染对象，缓存已生成瓦片显示对象，管理坐标转换。
- `TileResolver`: 根据周围相邻 Tile 推导具体的地形变体（Autotiling 或 Transition）。

## 2. 文件结构 (File Structure)
```
/src
  /assets             # 存放临时占位图或真实瓦片素材
  /components         # React 构件 (HUD 等)
  /game
    /core
      MapEngine.ts      # 地图引擎控制核心
      ChunkManager.ts   # Chunk 内存管理与调度
      TerrainGen.ts     # 噪声与地貌生成
      TileResolver.ts   # 瓦片边缘混合运算
    /math
      Coordinates.ts    # 坐标系换算逻辑
    /scenes
      MainScene.ts      # Phaser 主场景
    Game.ts           # Phaser 实例入口
  /styles
  App.tsx           # React UI 根，包裹 Phaser 挂载点
  main.tsx          # 启动入口
PLAN.md
```

## 3. 坐标系统 (Coordinate System)
- **World 坐标 / Tile 坐标 (`tx`, `ty`)**: 原理为网格系统的整数索引。正向从 `0,0` 到 `4095, 4095`。
- **Chunk 坐标 (`cx`, `cy`)**: `cx = Math.floor(tx / CHUNK_SIZE)`, `cy = Math.floor(ty / CHUNK_SIZE)`。CHUNK_SIZE = 32。

- **Screen 坐标 / Pixel 坐标 (`sx`, `sy`)**:  
  采用 2D Diamond Isometric 转换公式：
  `sx = (tx - ty) * (TILE_WIDTH / 2)`
  `sy = (tx + ty) * (TILE_HEIGHT / 2)`
  *(考虑渲染偏移以居中绘制)*

## 4. Chunk 渲染方案 (Chunk Rendering Strategy)
整个地图扩展为 4096x4096 瓦片。一次性预加载会导致内存与性能崩溃。
- 将地图等分为多个 32x32 的 Chunk。
- 在 `update` 循环中计算当前摄像机中心的视口，转换为影响的 `cx, cy` 范围（目前使用 3x3 Chunk 半径以兼顾性能）。
- 对新进入视野的 Chunk 触发 `loadChunk`，利用 `TerrainGenerator` 生成其地形，计算 Variant，并通过 `Phaser.GameObjects.Image` 绘制等距菱形色块。
- 对移出视野的 Chunk，触发 `unloadChunk`，销毁其对象（或回收到 Pool）以释放内存。

## 5. 地图生成方案 (Map Generation Strategy)
使用 `simplex-noise` 作为伪随机生成依据。
- 在全局给定 `seed` 下进行 Noise 采样。
- 根据海拔(Elevation)与湿度(Moisture)进行多层采样。引入了 **纬度计算 (Latitude)** 模拟类地球分布。
- 坐标 `tx + ty = 4096` 中心对角线作为**赤道 (Equator)**，两端作为**极地 (Poles)**。
- 采用 70% 比例的水域划分以契合航海探索主题。
- 地形区间划分：深海(deepWater) -> 浅海(shallowWater) -> 海岸(coast) -> 草地(grass) / 沙漠(desert) -> 森林(forest) -> 高山(mountain) -> （极地）雪地(snow)。
- 道路(road)在初期可用额外的 Noise 遮罩或基于特定点的连线生成。

## 6. Terrain Transition / Autotile 方案 (Terrain Transition)
不同类型地形交界时需要处理生硬的边缘。
- `TileResolver` 会获取由生成器给出的邻居状态 (Top, Right, Bottom, Left)。
- 利用 4 位/8 位二进制 Autotiling 掩码（Bitmask），为瓦片指定正确的拼接图切片(Index)。
- “海岸线不硬切”将在后续以具体素材拼装或特殊的变体 ID 进行平滑拼接实现（目前使用平滑的颜色过渡占位）。

## 7. 单位移动方案 (Unit Movement Strategy)
- 定义角色的 `Tile` 坐标体系，其逻辑点完全贴合瓦片网格。
- 不同类的地形赋予 `walkable`, `sail_able` 属性。
- 船只限定深海与港口，人物走陆地。
- 采用 **A* 寻路** (`pathfinding.ts`)，预先算出移动路径集合。
- 移动通过基于时间的 Tween 插值更新角色的 World 坐标。

## 8. 地图对象方案 (Map Object Strategy)
- 创建独立的逻辑层封装城市、港口、探索点。
- 这些对象不写入 Base Terrain，而是基于独立的静态或动态数组。
- 分层渲染：其 `depth` 同样设为 `tx + ty + offset` 以兼容 Isometric 遮挡关系。
- 包含事件触发器边界，单位靠近时激活“发现”逻辑。

## 9. 阶段开发计划 (Phased Development Plan)
- ** Phase 1：地图引擎 MVP（已完成 ✓）** - 完成无限加载架构与基础地形展示。
- ** Phase 2：单位移动系统（已完成 ✓）** - 加入角色，基于 Tile 的碰撞与导航。
- ** Phase 3：地图对象与事件系统（未开始）** - 建筑、静态物体的渲染与视距发现（视野机制）。
- ** Phase 4：UI与地点交互（未开始）** - 业务逻辑前置，丰富的页面交互 HUD。
- ** Phase 5：视觉升级与小地图（未开始）** - 美术升级，特效增强，小地图模块引入。

## Phase 2 详细设计 (单位移动系统 - 已完成 ✓)

### 1. 新增文件
- `src/game/math/Pathfinding.ts`: 引入核心 A* 寻路算法，带局部搜索限制。
- `src/game/core/Passability.ts`: 专门管理基于基础地形类型 (Base Terrain Type) 的单位通行规则。
- `src/game/core/MapQueryService.ts`: 提供全局且带有 Cache 机制的地带查询，供寻路高频调用。
- `src/game/entities/Unit.ts`: 单位基类及逻辑封装。
- `src/game/core/UnitManager.ts`: 统一管理所有单位状态、选择、移动插值与渲染层级。
- `src/game/entities/UnitTypes.ts`: 各种单位类型的枚举定义。

### 2. 修改文件
- `src/game/scenes/MainScene.ts`: 接入上述模块；实现基于滑动距离控制的**拖拽与点击判定**。
- `src/components/HUD.tsx`: 增加选中状态显示以及事件通知条 (Notification)。
- `src/game/events/EventBus.ts`: 自定义全局事件注册绑定机制扩展。
- `src/game/core/TerrainGen.ts`: 加入部分环境气候设定，作为通行计算依赖。

### 3. 数据与单位生成规则
- 实现了 `findNearestPassableTile` 动态搜寻出生点。
- 通过 Lerp 实现了 Tile 与屏幕绝对像素的帧级别平滑插值跟随。

### 4. 严格通行判定体系 (Passability.ts)
- `Passability` 明确了人类与船只（`SHIP`/`HUMAN`）分别通行的地形标签边界。

### 5. A* 局部寻路优化
- 设定了最大半径（`MAX_RADIUS`）及搜寻节点上限（`MAX_EXPANDED_NODES`）防止大地图崩溃。
- 使用了八方向探索与 Octile 启发式函数 (Heuristic) 加速搜寻。

### 6. 输入操作与图层
- 相机 `pointer` 实现滑动阻尼分离。
- 单位拥有了高精度动态 `depth`，能正确站在后排与前排之间。

---

## Phase 3 详细设计 (地图对象与发现系统)

### 1. 新增与修改模块
- **`src/game/objects/MapObjectTypes.ts`**: 新增，定义 `MapObject` 接口及类型枚举（城市、港口、遗迹等）。
- **`src/game/objects/mapObjects.ts`**: 新增，提供初始化的测试数据（里斯本、遗迹等），确保坐标位于初始大洲附近。
- **`src/game/objects/MapObjectManager.ts`**: 新增，提供对象的统一检索、点击判断与交互逻辑，与加载器解耦。
- **`src/game/renderers/MapObjectRenderer.ts`**: 新增，仅负责将可视范围内（或相机附近）的地点在屏幕上画出，不包含业务逻辑，提供动态深度排序（Z-Sort）。
- **`src/game/objects/DiscoveryService.ts`**: 新增，每帧或单位每走一格后，计算与周边未发现对象的曼哈顿或欧氏距离，判断处于 `visibilityRange` 则进行解锁与弹窗提示并将 `id` 存入 `localStorage` 持久化。
- 修改 **`src/game/scenes/MainScene.ts`**: 挂载 `MapObjectManager` 及 `DiscoveryService`，处理点击拦截。
- 修改 **`src/components/HUD.tsx`**: 增加已发现地点的提醒框，并展示选中地点的详细信息弹窗与统计数据。

### 2. 视野与发现机制 (Discovery & Persistence)
- 每个地点对象具备 `visibilityRange` 及 `interactionRange`。
- 不做完整的全局战争迷雾 (Fog of War) 数组，只做离散目标的发现激活 (Boolean Flag)。
- `MapObjectRenderer` 处理逻辑：未发现时渲染为一个灰色的 “？”或者干脆不渲染。一旦 `isDiscovered === true`，以彩色具体图形绘制，并附带 Text 显示地点名称。
- 利用浏览器的 `localStorage` 存放 `discovered_pois` 数组，刷新页面能还原发现状态。

### 3. 地点数据结构
至少包含以下参数：
- `id`, `name`, `type`: "CITY" | "PORT" | "VILLAGE" | "RUIN" | "DISCOVERY"
- `tx`, `ty`
- `isDiscovered`: 运行时内存状态。
- `visibilityRange`: 雷达发现阈值 (如 10 瓦片)。
- `interactionRange`: 开启面板互动必须到达的贴脸距离 (如 1 瓦片)。
- `description`, `iconType`。

---

## Phase 4 框架方案 (UI与地点交互)

### 1. 新增与修改模块
- **React 生态扩展**: HUD 从单纯的参数监视器转换为响应式业务中心。新增诸如 `<CityDialog>`, `<FleetOverview>`, `<ActionMenu>` 等子组件。
- **Z-Index 遮罩管理**: 确保弹窗出现时，底层 Phaser 会阻拦点击互动并暂停部分逻辑（如果需要）。

### 2. 点击交互流 (Interaction Flow)
- 当单位移动到达某城市所在的 `(tx, ty)`，或鼠标点击某城市：
- 首先调用 `EventBus.emit('open-location-dialog', poiData)`。
- React 层渲染该地点的精美卡片（提供诸如“补给”、“招募”、“交易”、“进入酒馆”等游戏功能骨架）。
- 用户可在弹窗中发送后续纯数据层的指令。

### 3. HUD 上下文强化
- 在角色的信息面板上可以展示“疲劳度/食物”、“船只耐久”等维度的占位数据，让大地图航行有资源驱动感。

---

## Phase 5 框架方案 (视觉升级与小地图)

### 1. 核心重点
- 彻底抛弃此阶段使用的 `Graphics` (单色块 / 几何形状)。
- **Spritesheets / Texture Atlases**: 将真正的等距 2.5D 像素素材引入。所有单位替换为多帧动画 (Idle, Walk, Sail)。
- **变体拼接 (Autotiling Visuals)**: TileResolver 不再仅仅改变颜色，而是严格计算海陆交界的 16 个方向图块并渲染波浪边缘。

### 2. 渲染特效 (VFX & Shaders)
- 增加云影缓慢滑过 (Cloud Shadow overlays)。
- 增加水面动态波纹（可通过 Sprite sheet 动画，或者轻量级的 WebGL Shader 介入）。

### 3. 小地图机制 (Minimap Component)
- 新增独立的 `<Minimap>` 界面，可以通过 Canvas 对全局 4096x4096 地形数据采样生成一张微缩的雷达图。
- 标记红点/绿点表示发现的城市与自身的部队。
- 支持点击小地图极速跳转 `Camera.scrollX/Y`。

---

## 10. 每个阶段的验收标准 (Acceptance Criteria per Phase)
- **Phase 1**: 可鼠标拖拽摄像机漫游; 周围 Chunk 随着视野动态装载/卸载; 控制台不出现 OOM; HUD 数据实时反馈 FPS 与 Tile 数目；按类型绘制不同颜色或占位图的地形。
- **Phase 2 (已完成 ✓)**: 能够正确刷出船和人各自一艘/一人并分离管理; 区分真实点击和拖放; 提供寻路并限制步数防止内存枯竭; 动态改变单位Z轴和显示正确提示信息。
- **Phase 3 (对象发现)**:
  - 地图上能够渲染出城市、港口、遗迹等预设点（固定在 2048 中央区块附近）。
  - 没有走近时不会暴露对象位置（可不显示或显示黑屋）。
  - 单位移动到对象范围内触发 `EventBus`，HUD 出现“发现了 XXX”。
  - 发现后，对象展示为不同颜色图标，名字上浮展示。
  - 点击对象能在 HUD 或者居中 UI 中看到其详情描述。
  - F5 刷新依然保留探索状态 (localStorage 读取成功)。
- **Phase 4**: 走到城市点击能打开包含各项业务菜单的弹窗，完成前置 UI 状态流转体验。
- **Phase 5**: 画面完全替代为等距 2D 像素地形与精灵素材，具备生机（如海边波纹、动态阴影）。小地图可点。
