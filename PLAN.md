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
- ** Phase 2：单位移动系统** - 加入角色，基于 Tile 的碰撞与导航。
- ** Phase 3：地图对象系统** - 建筑、静态物体的渲染与视距发现。
- ** Phase 4：地点交互界面** - 业务逻辑前置，丰富的页面交互 HUD。
- ** Phase 5：复古像素风优化** - 美术升级，特效增强，小地图模块引入。

## Phase 2 详细设计 (单位移动系统)

### 1. 新增文件
- `src/game/math/Pathfinding.ts`: 引入核心 A* 寻路算法，带局部搜索限制。
- `src/game/core/Passability.ts`: 专门管理基于基础地形类型 (Base Terrain Type) 的单位通行规则。
- `src/game/core/MapQueryService.ts` (或包含 TerrainCache 功能): 提供全局且带有 Cache 机制的地带查询，供寻路高频调用。
- `src/game/entities/Unit.ts`: 单位基类及逻辑封装。
- `src/game/core/UnitManager.ts`: 统一管理所有单位状态、选择、移动插值与渲染层级。
- `src/game/core/PathRenderer.ts`: 控制 A* 计算出路径的高亮展示在独立图层 (Overlay Layer)。

### 2. 修改文件
- `src/game/scenes/MainScene.ts`: 接入上述模块；实现基于滑动阈值的**拖拽与点击判定**（防止误触移动）；通过相机 `scrollX` 与 `zoom` 正确映射点击。
- `src/components/HUD.tsx`: 增加系统通知区域以展示中文提醒（如“目标太远”、“无法到达目标地点”）。
- `src/game/events/EventBus.ts`: 注册 `show-notification` 及单位选定关联事件。
- `src/game/core/TerrainGen.ts`: 明确基础地形（如 `COAST`/`BEACH`）的通行侧重点，不与后续视觉的岸边处理混淆。

### 3. 数据与单位生成规则
- 单位的实例化不得使用写死的静态位置。调用 **`findNearestPassableTile(unitType, targetTx, targetTy)`** 在安全点生成船只或人类。
- 单位拥有 `[tx, ty]` 逻辑坐标和 `[pixelX, pixelY]` 实际渲染坐标以作平滑逐像素移动 (Lerp interpolation)。

### 4. 严格通行判定体系 (Passability.ts)
- **绝对划分**：基础地形定义决定通行，渲染用 Visual Variant 仅仅修饰边缘。
- 封装核心接口：`canUnitEnter(unitType, baseTerrainType)`, `isWaterTerrain()`, `isLandTerrain()`。
- `BEACH` 作为基础陆地，人可通行，船不可通行。

### 5. A* 局部寻路优化 (Local Pathfinding bounds & Caching)
- 避免 2048x2048 级乃至 4096x4096 全局死锁：
  - **最大搜索距离限制 (Radius Limit)**: 设为 80 或 128 Tiles 以内。
  - **展开节点数限制 (Max Evaluation Limit)**: 顶限控制为 3000 次操作。
  - **异常捕获与文案**：一旦触发这两种界限或目的地遇阻，在 HUD 抛出 "目标太远，请选择附近地点" 或 "无法到达目标地点"。
- **Terrain Query Cache**: A* 会超高频触发计算公式，需依靠 `MapQueryService/Cache` 缓解计算压力，不要重复走 Noise 流程取同一瓦片的值。

### 6. 输入操作的“拖拽 vs 点击”分离
- 维护 `isDragging` 标量，在 `pointerup` 检查释放时的 `pointer` `x,y` 和 `dragStartX, dragStartY` 产生的欧氏距离。
- 若距离超过拖曳容差（如 `distance > 5`），则吞噬点击行为；如果 `distance <= 5`，判定为真实点击，执行寻路。
- 保证 `screenToTile` 计算将 `camera.scroll`, `zoom`, 和 `Tiled Isometric map origin` 严格关联算准。

### 7. 图层隔离与动态深度 (Dynamic Depth Sorting)
- **解耦渲染依赖**: 单位、选中框(Selector UI)、高亮路径必须从地形 `ChunkManager.gameObjects` 中分离，被绑定到独立的 Global Overlay Layer 或 Unit Layer。
- **动态深度 (Depth)**: 单位处于持续移动的渲染过程中必须拥有比整数 `tx + ty` 更高的排序精度（例如可以由实际落点的 Y 屏幕坐标 `offset / screenY` 补正，或者插值的 `realWorldTx + realWorldTy` 处理排序），保证移动经过山丘时不发生诡异地前排透视错误。

## 10. 每个阶段的验收标准 (Acceptance Criteria per Phase)
- **Phase 1**: 可鼠标拖拽摄像机漫游; 周围 Chunk 随着视野动态装载/卸载; 控制台不出现 OOM; HUD 数据实时反馈 FPS 与 Tile 数目；按类型绘制不同颜色或占位图的地形。
- **Phase 2 (单位移动)**: 
  - 能够正确刷出船和人各自一艘/一人，且出生点一定正确可用。
  - 区分点击和拖放判定。
  - 选中并下发移动指令后能算出路径并动态走过去；受限为局部寻路策略发挥成效。
  - 对于超出距离的请求通过通知提示“目标太远，请选择附近地点”，遇死胡同提示“无法到达目标地点”。
  - 所有的寻路图示与单位实体不随着 Chunk 消失而被销毁。
  - 移动中依然享有正确的 Z-Sorting (重叠顺序不崩坏)。
- **Phase 3**: 走近特定坐标后，HUD 提示发现了某城市，原本地图上显示未探索标识切换为实际模型/图集。
- **Phase 4**: 走到城市点击能打开包含各项业务菜单的弹窗，完成前置 UI 状态流转。
- **Phase 5**: 画面完全替代为复古像素资产，海边有波纹动画，小地图可点击跳转视角。
