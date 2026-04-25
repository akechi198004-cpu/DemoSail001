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

## 10. 每个阶段的验收标准 (Acceptance Criteria per Phase)
- **Phase 1**: 可鼠标拖拽摄像机漫游; 周围 Chunk 随着视野动态装载/卸载; 控制台不出现 OOM; HUD 数据实时反馈 FPS 与 Tile 数目；按类型绘制不同颜色或占位图的地形。
- **Phase 2**: 界面有至少 1 个船/人角色，点击非阻挡格能见其循路径点移动过去的动画，点击阻挡格弹出“不可通行”；摄像机能跟随。
- **Phase 3**: 走近特定坐标后，HUD 提示发现了某城市，原本地图上显示未探索标识切换为实际模型/图集。
- **Phase 4**: 走到城市点击能打开包含各项业务菜单的弹窗，完成前置 UI 状态流转。
- **Phase 5**: 画面完全替代为复古像素资产，海边有波纹动画，小地图可点击跳转视角。
