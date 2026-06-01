<template>
  <div class="home-page">
    <div class="home-content">
      <h1 class="title">校园迷宫奇遇记</h1>
      <p class="subtitle">—— 老槐树下的温暖记忆 ——</p>
      <div class="tree-icon">🌳</div>
      <div class="buttons">
        <el-button type="success" size="large" @click="startGame">开始游戏</el-button>
        <el-button type="warning" size="large" @click="goLevels">选择关卡</el-button>
        <el-button type="info" size="large" @click="goRouter('/notebook')">好人好事笔记本</el-button>
      </div>
      <div class="bottom-nav">
        <el-button text @click="goRouter('/achievements')">成就</el-button>
        <el-button text @click="goRouter('/leaderboard')">排行榜</el-button>
        <el-button text @click="goRouter('/friends')">好友</el-button>
        <el-button v-if="!auth.isLoggedIn" text @click="goRouter('/login')">登录</el-button>
        <el-dropdown v-else @command="handleUserCmd">
          <el-button text>{{ auth.user?.username }}</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="save">上传存档</el-dropdown-item>
              <el-dropdown-item command="load">下载存档</el-dropdown-item>
              <el-dropdown-item command="history">存档历史</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="stats" v-if="game.completedCount > 0">
        <span>已通关: {{ game.completedCount }} 关</span>
        <span>总星数: {{ game.totalStars }}</span>
      </div>
    </div>
    <GameContainer v-if="showMenuScene" scene="MenuScene" @navigate="handleNavigate" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import GameContainer from '@/components/GameContainer.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'
import { initAudio, sfxClick } from '@/utils/sfx'

const router = useRouter()
const auth = useAuthStore()
const game = useGameStore()
const showMenuScene = ref(false)

onMounted(() => {
  auth.init()
  game.init()
  document.addEventListener('pointerdown', () => initAudio(), { once: true })
})

function startGame() {
  sfxClick()
  const nextLevel = game.progress.completedLevels.length + 1
  router.push(`/play/${Math.min(nextLevel, 60)}`)
}

function goLevels() {
  sfxClick()
  router.push('/levels')
}

function goRouter(path: string) {
  sfxClick()
  router.push(path)
}

function handleNavigate(e: CustomEvent) {
  router.push(e.detail)
}

async function handleUserCmd(cmd: string) {
  if (cmd === 'profile') {
    goRouter('/profile')
  } else if (cmd === 'logout') {
    auth.logout()
    router.go(0)
  } else if (cmd === 'save') {
    game.uploadSave()
  } else if (cmd === 'load') {
    game.downloadSave()
  } else if (cmd === 'history') {
    try {
      const res = await api.get('/api/save/history')
      const data: any[] = res.data?.data || []
      if (data.length === 0) {
        ElMessage.info('暂无历史存档')
        return
      }
      const items = data.map(h =>
        `V${h.version} — ${new Date(h.createdAt).toLocaleString('zh-CN')} — ${h.completedLevels}关 ⭐${h.totalStars}`
      ).join('\n')
      ElMessageBox.prompt('点击版本号可恢复：\n' + items, '存档历史', {
        inputPlaceholder: '输入要恢复的版本号',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入数字版本号',
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
      }).then(async ({ value }) => {
        if (!value) return
        try {
          await api.post(`/api/save/restore/${value}`)
          ElMessage.success('存档已恢复，请重新下载存档')
          await game.downloadSave()
        } catch (e: any) {
          ElMessage.error(e.response?.data?.message || '恢复失败')
        }
      }).catch(() => {})
    } catch {
      ElMessage.error('获取历史存档失败')
    }
  }
}
</script>

<style scoped>
.home-page {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: linear-gradient(180deg, #87ceeb 0%, #f5f0e8 60%);
}
.home-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 6vh;
  pointer-events: none;
}
.home-content > * {
  pointer-events: auto;
}
.title {
  font-size: 2.4em;
  color: #3e2723;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 8px;
}
.subtitle {
  font-size: 1.1em;
  color: #5b8c5a;
  margin-bottom: 16px;
}
.tree-icon {
  font-size: 80px;
  margin-bottom: 24px;
}
.buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 260px;
}
.buttons .el-button {
  width: 100%;
  font-size: 18px;
  height: 48px;
}
.bottom-nav {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}
.stats {
  margin-top: 16px;
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #8b7355;
}
</style>
