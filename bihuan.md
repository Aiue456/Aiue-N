# 《校园迷宫奇遇记》闭环需求文档

> 基于需求文档 [xuqiu.md](xuqiu.md) 与当前实现差异分析，编制本闭环补充需求。
> 目标：使项目从"技术原型"演进为"完整可交付产品"。

---

## 目录

1. [概述](#1-概述)
2. [核心关卡闭环](#2-核心关卡闭环)
3. [叙事系统闭环](#3-叙事系统闭环)
4. [用户系统闭环](#4-用户系统闭环)
5. [云存档闭环](#5-云存档闭环)
6. [社交功能闭环](#6-社交功能闭环)
7. [成就系统闭环](#7-成就系统闭环)
8. [音频系统闭环](#8-音频系统闭环)
9. [技术基建闭环](#9-技术基建闭环)
10. [实施优先级与工作量](#10-实施优先级与工作量)

---

## 1. 概述

### 1.1 当前状态

项目完成了技术验证和可玩原型，核心游戏循环（迷宫生成 → 移动 → 通关 → 便签）基本跑通，但距离需求文档定义的产品级别存在 **约 40-50% 功能缺口**。

### 1.2 闭环定义

"闭环"指每个功能的需求-实现-反馈链路完整，不存在"定义了但没有"或"能触发但没有反馈"的断点。

### 1.3 符号说明

| 标记 | 含义 |
| ---- | ---- |
| 🔴 阻塞级 | 用户无法完成核心体验链 |
| 🟠 重要级 | 功能残缺但可绕过 |
| 🟡 增强级 | 锦上添花，不影响核心闭环 |

---

## 2. 核心关卡闭环

### 2.1 现状

- `sampleLevels` 和 `seed.ts` 定义了 **10 关**（需求 60 关）
- 所有关卡的 `mapData.grid` 均为空数组，依赖程序即时生成迷宫
- 关卡标题/剧情文本已定义到第 10 关，第 11-60 关完全没有数据

### 2.2 需要补充

#### 🟠 2.2.1 11-60 关关卡数据（高优先级）

在以下两个文件中补充第 11-60 关的配置：

**前端** `client/src/utils/levelData.ts`

每个关卡需包含：
```typescript
{
  id: number,          // 11-60
  title: string,       // 关卡标题（如"走廊的灯光"）
  difficulty: 'easy' | 'medium' | 'hard',
  storyIntro: string,  // 剧情介绍
  mission: string,     // 任务描述
  npcNeeds: string,    // NPC 需求
  postNote: string,    // 通关便签
  noteDate: string,    // 便签日期
  values: string,      // 价值观标签
  helpedPerson: string,// 帮助的人
  action: string,      // 行为描述
  location: string,    // 地点
  stars: number,       // 最高星级
  mapData: { grid: number[][], playerStart, exitPos, npcPositions }
}
```

**后端** `server/src/levels/seed.ts`

前后端数据保持一致，后端额外存储到 MongoDB。

**建议制作策略**：按章节分配，每章约 20 关的文本量和复杂度递增。

#### 🟠 2.2.2 预置迷宫地图（中优先级）

目前全部依赖程序生成，未来应逐步为关键关卡（每章的第 1 关、BOSS 关）设计手工 Tiled 地图，存入 `mapData.grid`，提升关卡品质感。

### 2.3 验收标准

- [ ] 60 关卡全部可正常选择和进入
- [ ] 每关有独立的剧情文本和便签内容
- [ ] 难度递进曲线合理（第 1-20 关 easy，第 21-40 关 medium，第 41-60 关 hard）
- [ ] 程序生成迷宫在不同难度下有明显的大小/复杂度差异

---

## 3. 叙事系统闭环

### 3.1 现状

- `ComicScene.ts` 只有 4 段硬编码文字，无图片、无分镜动画
- NPC 对话只有单次展示，**不支持选项选择**
- 章节解锁**没有可视化提示动画**

### 3.2 需要补充

#### 🟠 3.2.1 漫画分镜系统

**需求**（来自 xuqiu.md）：
> 手绘分镜图片序列帧播放，支持淡入/平移/缩放动画

**方案**：
- 将漫画拆为多张 PNG 图片，放在 `client/public/comics/` 目录下
- 在 `ComicScene.ts` 中增加图片加载和序列播放逻辑
- 支持：淡入 fadeIn、平移 slideIn、缩放 zoomIn 三种过渡
- 每张图片下方显示对话文字
- 点击或自动切换下一帧

**数据结构**：
```typescript
interface ComicPanel {
  image: string      // 图片路径
  text: string       // 对话文字
  transition: 'fade' | 'slide' | 'zoom'
  duration: number   // 自动停留时间(ms)，0 表示点击切换
}
```

#### 🟠 3.2.2 对话选项系统

**需求**（来自 xuqiu.md）：
> 气泡对话展示 NPC 对话内容，支持选项选择

**方案**：
- 在 NPC 对话弹窗的 `showNPCDialog` 方法中增加选项按钮
- 选项定义在关卡数据中（新增 `choices` 字段）
- 选择不同选项影响：后续对话内容、星级加成、隐藏便签

**数据结构**：
```typescript
// 新增到 LevelConfig
choices?: {
  text: string           // 选项文字
  response: string       // NPC 回应
  starBonus?: number     // 额外星数
  hiddenNote?: string    // 隐藏便签
}[]
```

#### 🟡 3.2.3 章节解锁动画

在 `game.store.ts` 的 `syncChapterUnlocks` 触发时，显示全屏章节解锁提示：
- 半透明遮罩层
- 章节名称渐入动画
- 伴随音效
- 点击任意位置关闭

### 3.3 验收标准

- [ ] 游戏开头有完整的漫画分镜序列（至少 6-8 帧）
- [ ] NPC 对话支持 2-3 个选项，且选择有实际反馈
- [ ] 达到 10/30/60 关时弹出章节解锁动画
- [ ] 漫画图片缺失时优雅降级（显示文字替代）

---

## 4. 用户系统闭环

### 4.1 现状

- 注册/登录功能完整（JWT + bcrypt）
- 游客模式未显式标记，但本地存储可在无登录时工作
- 用户信息编辑页不存在
- 头像上传 API 和前端均未实现
- "记住密码"未实现

### 4.2 需要补充

#### 🟠 4.2.1 显式游客模式

- 首次访问时自动分配游客 ID（存入 localStorage）
- 游客数据使用 `isGuest: true` 标记
- 提供"升级为正式账号"入口（绑定邮箱+密码）
- 游客模式下不上传云存档，不显示排行榜

#### 🟠 4.2.2 用户信息编辑页

新建 `Profile.vue`：

| 功能 | 说明 |
|------|------|
| 修改昵称 | PUT `/api/users/me` |
| 修改头像 | 点击头像 → 上传图片 → POST `/api/users/avatar` |
| 修改密码 | 旧密码 + 新密码 → 后端新增接口 |
| 账号升级 | 游客绑定邮箱/密码 |

#### 🟡 4.2.3 头像上传

**前端**：
- 使用 Element Plus `<el-upload>` 组件
- 上传到 `POST /api/users/avatar`
- 预览裁剪

**后端**：
- 接收 multipart/form-data
- 保存到服务器本地或云存储（OSS/COS）
- 返回 URL

#### 🟡 4.2.4 记住密码

- localStorage 中保存加密后的凭据（非明文）
- 启动时自动填充登录表单
- 或者使用 Refresh Token 机制自动登录

### 4.3 验收标准

- [ ] 首次访问自动为游客模式，可正常玩游戏
- [ ] 游客可在设置页面升级为正式账号
- [ ] 用户信息页面可修改昵称
- [ ] 头像可上传并更新
- [ ] 退出后再次打开，自动填充上次登录信息

---

## 5. 云存档闭环

### 5.1 现状

- 自动上传（通关后调用 `uploadSave`）✅
- 手动同步（下拉菜单）✅
- 多设备冲突处理：总是直接覆盖 ❌
- 存档历史版本：未实现 ❌

### 5.2 需要补充

#### 🟠 5.2.1 冲突处理策略

**方案**：基于时间戳的"最后写入胜出" + 版本号

```typescript
interface SaveRequest {
  version: number       // 客户端当前版本号
  data: GameProgress    // 进度数据
  updatedAt: number     // 客户端最后修改时间
}
```

**冲突检测逻辑**（后端 `game.service.ts`）：

```
1. 客户端上传时携带 version
2. 服务端对比 version 与数据库中存储的 version
3. 若客户端 version < 服务端 version → 返回冲突标记
4. 客户端收到冲突 → 弹出"本地 vs 云端"选择框
5. 用户选择保留哪个版本
6. 确认后以新 version 覆盖
```

#### 🟠 5.2.2 存档历史版本

**后端**新增 `saveHistory` 集合：

```typescript
interface SaveHistory {
  userId: string
  version: number
  data: GameProgress
  createdAt: number
}
```

- 每次上传成功时将当前数据压入历史
- 最多保留 5 个版本，超出时删除最旧的
- 新增接口 `GET /api/save/history` 和 `GET /api/save/history/:version`

**前端**：
- 在首页下拉菜单增加"存档历史"入口
- 展示历史版本列表（时间 + 通关数 + 星数）
- 点击恢复 → 确认 → 覆盖当前存档

### 5.3 验收标准

- [ ] 同一账号在 A/B 两个浏览器分别玩，第二次保存时检测到冲突
- [ ] 冲突时弹出选择界面，可选择本地/云端
- [ ] 存档历史保留最近 5 个版本
- [ ] 可从任意历史版本恢复存档

---

## 6. 社交功能闭环

### 6.1 现状

- 排行榜：✅ 功能完整（全表查询+排序）
- 好友搜索/添加：✅
- 好友请求/接受/拒绝：✅ + 轮询通知
- 实时在线状态：❌
- 分享功能：❌

### 6.2 需要补充

#### 🟠 6.2.1 好友在线状态

**方案**：WebSocket 或简单心跳

简单方案（无 WebSocket）：
- 每次 API 请求时更新 `users.lastActiveAt`
- 好友列表中的"在线"定义为 `lastActiveAt > Date.now() - 5分钟`
- 前端每 30 秒发送一次心跳请求

**后端** `users.service.ts`：
```typescript
async function heartbeat(userId: string) {
  await this.userModel.findByIdAndUpdate(userId, { lastActiveAt: Date.now() })
}
```

**前端** `Friends.vue`：
```html
<span v-if="isOnline(f.lastActiveAt)" class="online-dot">● 在线</span>
<span v-else class="offline-text">离线</span>
```

#### 🟡 6.2.2 分享功能

**方案**：Web Share API（移动端） + 截图分享

- 通关后弹出分享按钮
- 调用 `navigator.share()` 或生成分享图
- 分享内容：关卡信息 + 星级 + 便签内容（可自定义模板）

### 6.3 验收标准

- [ ] 好友列表中能区分在线/离线
- [ ] 排行榜延迟不超过 5 秒
- [ ] 通关后可一键分享成就

---

## 7. 成就系统闭环

### 7.1 现状

- 数据库 Schema 已定义（`achievements` 集合 + `condition` 字段）
- 后端和前端**完全没有成就判定逻辑**

### 7.2 需要补充

#### 🟠 7.2.1 成就定义

在 `server/src/levels/seed.ts` 或单独的文件中定义：

```typescript
const achievements = [
  { id: 'first_win',     name: '初出茅庐',    description: '通关第1关',          icon: '🏅' },
  { id: 'all_chapter1',  name: '温暖起点',    description: '通关第一章所有关卡',  icon: '📖' },
  { id: 'all_chapter2',  name: '并肩前行',    description: '通关第二章所有关卡',  icon: '📚' },
  { id: 'all_chapter3',  name: '传承之光',    description: '通关全部60关',        icon: '🏆' },
  { id: 'star_collector',name: '追星者',      description: '累计获得100颗星',     icon: '⭐' },
  { id: 'speedrunner',   name: '疾风步',      description: '30秒内通关任意关卡',  icon: '💨' },
  { id: 'friend_maker',  name: '交个朋友',    description: '添加1位好友',         icon: '🤝' },
  { id: 'hidden_finder', name: '探索者',      description: '找到3个隐藏便签',     icon: '🔍' },
]
```

#### 🟠 7.2.2 成就判定引擎

在 `game.service.ts` 中，每次存档上传时执行判定：

```typescript
async function checkAchievements(userId: string, progress: GameProgress) {
  const unlocked = progress.achievements || []
  const newAchievements: string[] = []

  // 遍历所有成就定义，检查 condition
  if (!unlocked.includes('first_win') && progress.completedLevels.length >= 1)
    newAchievements.push('first_win')
  if (!unlocked.includes('star_collector') && totalStars(progress) >= 100)
    newAchievements.push('star_collector')
  // ... 更多成就条件

  if (newAchievements.length > 0) {
    // 更新用户的成就列表
    // 返回新解锁的成就列表，用于前端弹窗展示
  }
}
```

#### 🟡 7.2.3 成就 UI

在 `Leaderboard.vue` 或新建 `Achievements.vue` 中展示：
- 成就墙网格布局
- 已解锁：彩色图标 + 名称
- 未解锁：灰色 + 问号
- 点击查看解锁条件

### 7.3 验收标准

- [ ] 至少 8 个可解锁成就
- [ ] 达成条件时自动解锁并弹出通知
- [ ] 成就墙可查看所有成就及进度
- [ ] 成就数据同步到云端

---

## 8. 音频系统闭环

### 8.1 现状

完全缺失。需求文档中列为高/中优先级。

### 8.2 需要补充

#### 🟡 8.2.1 音频资源准备

| 类型 | 内容 | 格式 |
|------|------|------|
| BGM | 校园主题背景音乐（3 首循环） | MP3/OGG |
| 环境音 | 雨声、操场声、图书馆安静声 | MP3 |
| 音效 | 移动脚步、碰撞、通关、便签、按钮 | 短 WAV |
| 语音（可选） | NPC 对话（后期） | MP3 |

音频文件存放于 `client/public/audio/` 目录。

#### 🟡 8.2.2 Phaser 音频集成

在 `BootScene` 中预加载音频资源：

```typescript
this.load.audio('bgm_menu', 'audio/bgm_menu.mp3')
this.load.audio('sfx_step', 'audio/sfx_step.wav')
```

在场景切换时控制音频：
- `MenuScene` 启动时播放 BGM
- `GameScene` 启动时切换到关卡 BGM
- 通关时播放胜利音效
- 便签动画时播放书写音效

#### 🟡 8.2.3 音频设置

`storage.ts` 已定义了 `musicVolume` 和 `sfxVolume` 设置项。

新增音频设置界面（在首页或游戏内）：

| 控制项 | 说明 |
|--------|------|
| 背景音乐音量 | Slider 0-100% |
| 音效音量 | Slider 0-100% |
| 静音开关 | 一键静音 |

#### 🟡 8.2.4 自动播放处理

```typescript
// 首次用户交互后解锁音频上下文
document.addEventListener('pointerdown', () => {
  if (this.sound && this.sound.context?.state === 'suspended') {
    this.sound.context.resume()
  }
}, { once: true })
```

### 8.3 验收标准

- [ ] 首页有背景音乐播放
- [ ] 游戏中有操作音效反馈
- [ ] 音量设置可保存到 localStorage
- [ ] 处理了浏览器自动播放限制

---

## 9. 技术基建闭环

### 9.1 现状

- 大多数 API 调用的 `catch` 块为空
- Phaser Game 实例在路由切换时反复创建销毁
- MongoDB 不可用时服务器完全崩溃
- 无音频资源
- 无加载状态指示

### 9.2 需要补充

#### 🟠 9.2.1 错误处理统一化

**方案**：统一错误拦截器

```typescript
// server/src/common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    response.status(status).json({
      success: false,
      message: exception instanceof HttpException
        ? exception.message
        : '服务器内部错误',
      ...(process.env.NODE_ENV === 'development' && {
        stack: (exception as Error).stack,
      }),
    })
  }
}
```

**前端 axios 拦截器**（`api/index.ts`）：

```typescript
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || '网络错误，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(err)
  },
)
```

#### 🟠 9.2.2 Phaser Game 生命周期管理

**问题**：`GameContainer.vue` 每次挂载都 `new Phaser.Game()`，卸载时 `destroy()`。路由切换时（如 Home ↔ GamePlay）会频繁创建销毁。

**方案**：使用单例 + Vue Router 守卫

```typescript
// GameContainer.vue
let gameInstance: Phaser.Game | null = null

onMounted(() => {
  if (!gameInstance) {
    gameInstance = new Phaser.Game({ ... })
  } else {
    // 复用已有的 game 实例
    gameInstance.scene.start(targetScene)
  }
})
```

或者在 `main.ts` 级别初始化 Phaser 实例，各页面通过事件通信而非销毁重建。

#### 🟠 9.2.3 加载状态指示

| 场景 | 需要什么 |
|------|----------|
| 页面切换 | 顶部进度条（NProgress 或 ElLoading） |
| 关卡加载 | Phaser Scene 内的 loading spinner |
| 排行榜/好友加载 | Element Plus `v-loading` |
| 存档上传/下载 | 操作按钮显示 loading 状态 |

#### 🟡 9.2.4 无障碍基础

| 项 | 说明 |
|---|------|
| 键盘导航 | Tab 键切换所有按钮和链接 |
| 焦点样式 | 所有交互元素有可见的 focus outline |
| 颜色对比度 | 文本与背景对比度 ≥ 4.5:1 |
| 屏幕阅读器 | 关键操作添加 `aria-label` |

### 9.3 验收标准

- [ ] 所有 API 错误在前端有明确的用户提示
- [ ] 后端返回统一的 JSON 错误格式
- [ ] 页面切换有加载进度
- [ ] Phaser 游戏不因路由切换频繁创建销毁
- [ ] MongoDB 不可用时后端优雅降级（使用内存数据库）

---

## 10. 实施优先级与工作量

### 10.1 优先级矩阵

| 优先级 | 模块 | 估算工时 | 理由 |
|--------|------|----------|------|
| **P0** | 11-60 关数据填充 | 16h | 核心内容，无此游戏无法完整游玩 |
| **P0** | 错误处理统一化 | 4h | 保障基本可用性 |
| **P0** | 加载状态指示 | 3h | 用户等待体验 |
| **P1** | 成就系统 | 8h | 需求明确，影响社交闭环 |
| **P1** | 冲突处理 + 存档历史 | 6h | 云存档可靠性 |
| **P1** | 对话选项系统 | 6h | 提升叙事交互感 |
| **P1** | 在线状态 | 4h | 社交功能完整性 |
| **P2** | 显式游客模式 | 4h | 用户体验优化 |
| **P2** | 用户信息编辑页 | 4h | 个人资料闭环 |
| **P2** | 章节解锁动画 | 3h | 叙事体验增强 |
| **P2** | 漫画分镜资源 | 8h | 需美术资源配合 |
| **P3** | 音频系统 | 12h | 需音频资源配合 |
| **P3** | 头像上传 | 4h | 依赖文件存储 |
| **P3** | 分享功能 | 3h | 社交媒体传播 |
| **P3** | Phaser 生命周期优化 | 6h | 非功能需求 |
| **P3** | 无障碍 | 4h | 非功能需求 |

### 10.2 实施阶段建议

| 阶段 | 内容 | 预计总工时 |
|------|------|-----------|
| **Phase 1 — 基础闭环**（P0） | 关卡数据 + 错误处理 + 加载状态 | 23h |
| **Phase 2 — 社交与成就**（P1） | 成就 + 存档历史 + 对话选项 + 在线状态 | 24h |
| **Phase 3 — 体验增强**（P2） | 游客模式 + 编辑页 + 解锁动画 + 漫画 | 19h |
| **Phase 4 — 富媒体**（P3） | 音频 + 头像 + 分享 + 生命周期 + 无障碍 | 29h |

### 10.3 依赖关系

```
关卡数据 (P0)      → 成就系统 (P1)         # 成就需要关卡完成数据
错误处理 (P0)       → 所有后续功能          # 基础设施
对话选项 (P1)       → 关卡数据 (P0)         # 选项字段需在关卡中定义
漫画分镜 (P2)       → 独立                  # 可根据美术资源就绪情况灵活安排
音频系统 (P3)       → 独立                  # 可根据音频资源就绪情况灵活安排
Phaser 生命周期 (P3) → 独立                # 可在任意阶段优化
```

---

## 附录：文件修改对照

| 功能 | 需修改的文件 |
|------|-------------|
| 新增关卡数据 | `client/src/utils/levelData.ts`, `server/src/levels/seed.ts` |
| 漫画分镜 | `client/src/game/scenes/ComicScene.ts` + 图片资源 |
| 对话选项 | `client/src/game/scenes/GameScene.ts`(showNPCDialog), `client/src/utils/levelData.ts`(新增choices字段) |
| 章节解锁动画 | `client/src/stores/game.ts`, 新建弹窗组件 |
| 游客模式 | `client/src/stores/auth.ts`, `client/src/views/Home.vue` |
| 用户编辑页 | 新建 `Profile.vue`, `server/src/users/users.controller.ts`(新增密码修改) |
| 头像上传 | 新建组件, `server/src/users/users.controller.ts`(新增POST /avatar) |
| 存档冲突 | `server/src/game/game.service.ts`, `client/src/stores/game.ts`(uploadSave) |
| 存档历史 | 后端新增 `saveHistory` Schema + Controller, 前端新增页面 |
| 在线状态 | `server/src/users/users.service.ts`(heartbeat), `client/src/views/Friends.vue` |
| 分享功能 | `client/src/views/LevelSelect.vue` 或通关后弹窗 |
| 成就系统 | 后端新增成就判定服务 + Schema seed, 前端新增 `Achievements.vue` |
| 音频系统 | 全局各 Scene + 音频资源文件 |
| 错误处理 | 后端新增 Exception Filter, 前端修改 `api/index.ts` |
| 加载状态 | 各 Vue 页面 + Phaser Scene |
| Phaser 生命周期 | `client/src/components/GameContainer.vue` |

---

> 文档版本：V1.0
> 编制日期：2026-05-31
> 基于：xuqiu.md V1.0 + 代码审计报告
