<template>
  <router-view />

  <!-- Friend request notification dialog -->
  <el-dialog v-model="showRequestDialog" title="新的好友请求" width="420px" :close-on-click-modal="false" top="15vh">
    <div v-for="req in unseenRequests" :key="req.id" class="notification-item">
      <div class="notify-user">
        <el-avatar :size="40">{{ req.user?.username?.[0] }}</el-avatar>
        <div class="notify-meta">
          <div class="notify-name">{{ req.user?.username }}</div>
          <div class="notify-time">请求添加你为好友 · {{ formatTime(req.createdAt) }}</div>
        </div>
      </div>
      <div class="notify-actions">
        <el-button size="small" type="success" @click="handleNotifyRequest(req.id, 'accept')">接受</el-button>
        <el-button size="small" type="danger" @click="handleNotifyRequest(req.id, 'reject')">拒绝</el-button>
      </div>
    </div>
  </el-dialog>

  <!-- Save conflict dialog -->
  <el-dialog v-model="conflictDialogVisible" title="检测到存档冲突" width="420px" top="15vh">
    <p>云端数据与本地数据不一致，请选择保留哪个版本：</p>
    <div class="conflict-compare" v-if="game.saveConflict">
      <div class="version-card local">
        <h4>📱 本地存档</h4>
        <p>通关 {{ game.saveConflict.localData?.completedLevels?.length || 0 }} 关</p>
        <p>星数 {{ totalStars(game.saveConflict.localData?.levelStars) }}</p>
      </div>
      <div class="version-card cloud">
        <h4>☁️ 云端存档</h4>
        <p>通关 {{ game.saveConflict.cloudData?.completedLevels?.length || 0 }} 关</p>
        <p>星数 {{ totalStars(game.saveConflict.cloudData?.levelStars) }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="game.resolveConflict('local')" type="success">保留本地</el-button>
      <el-button @click="game.resolveConflict('cloud')" type="primary">使用云端</el-button>
    </template>
  </el-dialog>

  <!-- Chapter unlock dialog -->
  <el-dialog v-model="showChapterDialog" title="新章节解锁!" width="360px" :close-on-click-modal="true" simple>
    <div style="text-align: center; padding: 20px">
      <div style="font-size: 48px; margin-bottom: 16px;">📖</div>
      <h3 style="color: #5b8c5a; margin: 0;">{{ chapterName }}</h3>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const game = useGameStore()
const showRequestDialog = ref(false)
const showChapterDialog = ref(false)
const chapterName = ref('')

const chapterNames: Record<number, string> = {
  1: '第一章·初遇温暖',
  2: '第二章·并肩前行',
  3: '第三章·传承时光',
}
const unseenRequests = ref<any[]>([])
const seenIds = new Set<string>()
let pollTimer: ReturnType<typeof setInterval> | null = null

const conflictDialogVisible = computed(() => !!game.saveConflict)

auth.init()

function totalStars(levelStars: Record<number, number>) {
  return Object.values(levelStars || {}).reduce((a: number, b: number) => a + b, 0)
}

function formatTime(ts: number) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

async function pollRequests() {
  if (!auth.isLoggedIn) return
  try {
    const res = await api.get('/api/friends/requests')
    const all: any[] = res.data || []
    const fresh = all.filter(r => !seenIds.has(r.id))
    if (fresh.length > 0) {
      unseenRequests.value = fresh
      showRequestDialog.value = true
    }
    // Track all current request IDs
    all.forEach(r => seenIds.add(r.id))
  } catch {}
}

async function handleNotifyRequest(id: string, action: 'accept' | 'reject') {
  try {
    await api.put(`/api/friends/request/${id}`, { action })
    ElMessage.success(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求')
    unseenRequests.value = unseenRequests.value.filter(r => r.id !== id)
    if (unseenRequests.value.length === 0) {
      showRequestDialog.value = false
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

function startPolling() {
  stopPolling()
  pollRequests()
  pollTimer = setInterval(pollRequests, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(() => game.justUnlockedChapter, (val) => {
  if (val !== null) {
    chapterName.value = chapterNames[val] || ''
    showChapterDialog.value = true
    setTimeout(() => {
      showChapterDialog.value = false
    }, 3000)
  }
})

watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    startPolling()
  } else {
    stopPolling()
    seenIds.clear()
    unseenRequests.value = []
    showRequestDialog.value = false
  }
}, { immediate: true })

onUnmounted(() => stopPolling())
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

:root {
  --primary: #5b8c5a;
  --accent: #e8a87c;
  --bg: #f5f0e8;
  --text: #3e2723;
  --note-bg: #fef9e7;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style scoped>
.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #eee;
  gap: 12px;
}
.notification-item:last-child { border-bottom: none; }
.notify-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.notify-meta { min-width: 0; }
.notify-name { font-weight: 600; color: #3e2723; font-size: 15px; }
.notify-time { font-size: 12px; color: #999; margin-top: 2px; }
.notify-actions { display: flex; gap: 6px; flex-shrink: 0; }

.conflict-compare {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.version-card {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  border: 2px solid #eee;
}
.version-card.local { border-color: #5b8c5a; }
.version-card.cloud { border-color: #409eff; }
.version-card h4 { margin-bottom: 8px; font-size: 14px; }
.version-card p { font-size: 13px; color: #666; margin-bottom: 4px; }
</style>
