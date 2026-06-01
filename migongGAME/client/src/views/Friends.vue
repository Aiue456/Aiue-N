<template>
  <div class="friends-page">
    <div class="header">
      <el-button text @click="$router.push('/')">← 返回首页</el-button>
      <h2>好友</h2>
      <el-badge v-if="requests.length" :value="requests.length" class="req-badge" />
    </div>

    <div class="content" v-if="auth.isLoggedIn">
      <!-- Search -->
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="搜索用户名添加好友" @keyup.enter="searchUsers" clearable>
          <template #append><el-button @click="searchUsers" :icon="Search">搜索</el-button></template>
        </el-input>
      </div>
      <div v-if="searchResults.length" class="search-results">
        <div v-for="u in searchResults" :key="u._id" class="user-item">
          <div class="user-info">
            <el-avatar :size="32">{{ u.username?.[0] }}</el-avatar>
            <span class="user-name">{{ u.username }}</span>
          </div>
          <el-button size="small" type="success" @click="sendRequest(u._id)">添加好友</el-button>
        </div>
      </div>

      <!-- Incoming friend requests -->
      <div v-if="requests.length" class="section requests-section">
        <div class="section-title">
          <span>好友请求</span>
          <el-tag size="small" type="warning" round>{{ requests.length }}</el-tag>
        </div>
        <div v-for="r in requests" :key="r.id" class="request-card">
          <div class="req-user">
            <el-avatar :size="40">{{ r.user?.username?.[0] }}</el-avatar>
            <div class="req-meta">
              <div class="req-name">{{ r.user?.username }}</div>
              <div class="req-time">{{ formatTime(r.createdAt) }} 请求添加你为好友</div>
            </div>
          </div>
          <div class="req-actions">
            <el-button size="small" type="success" @click="handleRequest(r.id, 'accept')">接受</el-button>
            <el-button size="small" type="danger" plain @click="handleRequest(r.id, 'reject')">拒绝</el-button>
          </div>
        </div>
      </div>

      <!-- Friend list -->
      <div v-if="friends.length" class="section">
        <div class="section-title">
          <span>我的好友</span>
          <el-tag size="small" round>{{ friends.length }}</el-tag>
        </div>
        <div v-for="f in friends" :key="f.id" class="friend-card">
          <el-avatar :size="44">{{ f.username?.[0] }}</el-avatar>
          <div class="friend-info">
            <div class="friend-name">{{ f.username }}</div>
            <div class="friend-stats">通关 {{ f.completedLevels }} 关 · ⭐ {{ f.totalStars }}</div>
          </div>
          <span v-if="isOnline(f.lastActiveAt)" class="online-status online">● 在线</span>
          <span v-else class="online-status offline">离线</span>
          <el-button size="small" type="danger" plain @click="deleteFriend(f.id)">删除</el-button>
        </div>
      </div>

      <div v-if="!friends.length && !requests.length && !searchResults.length" class="empty">
        <p>还没有好友，搜索用户名添加吧</p>
      </div>
    </div>

    <div v-else class="empty" style="margin-top:80px;">
      <p>请先<el-button text type="primary" @click="$router.push('/login')">登录</el-button>后使用好友功能</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const friends = ref<any[]>([])
const requests = ref<any[]>([])

// Track lastActiveAt in friends data
function isOnline(lastActiveAt: number | undefined): boolean {
  return !!lastActiveAt && (Date.now() - lastActiveAt < 300000)
}

// Heartbeat polling
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(async () => {
    try {
      await api.post('/api/users/heartbeat')
    } catch {}
  }, 30000)
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
}

onMounted(() => {
  if (auth.isLoggedIn) {
    loadFriends()
    loadRequests()
    startHeartbeat()
  }
})

onUnmounted(() => {
  stopHeartbeat()
})

function formatTime(ts: number) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

async function loadFriends() {
  try {
    const res = await api.get('/api/friends')
    friends.value = res.data || []
  } catch {}
}

async function loadRequests() {
  try {
    const res = await api.get('/api/friends/requests')
    requests.value = res.data || []
  } catch {}
}

async function searchUsers() {
  if (!searchKeyword.value.trim()) return
  try {
    const res = await api.get('/api/friends/search', { params: { keyword: searchKeyword.value } })
    searchResults.value = res.data || []
  } catch {}
}

async function sendRequest(friendId: string) {
  try {
    await api.post('/api/friends/request', { friendId })
    ElMessage.success('好友请求已发送')
    searchResults.value = []
    searchKeyword.value = ''
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '发送失败')
  }
}

async function handleRequest(id: string, action: 'accept' | 'reject') {
  try {
    await api.put(`/api/friends/request/${id}`, { action })
    ElMessage.success(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求')
    loadRequests()
    loadFriends()
  } catch {}
}

async function deleteFriend(friendId: string) {
  try {
    await api.delete(`/api/friends/${friendId}`)
    ElMessage.success('已删除好友')
    loadFriends()
  } catch {}
}
</script>

<style scoped>
.friends-page {
  width: 100vw; height: 100vh; overflow-y: auto; padding: 20px;
  background: linear-gradient(180deg, #87ceeb 0%, #f5f0e8 40%);
}
.header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
  max-width: 600px; margin-left: auto; margin-right: auto;
}
.header h2 { color: #3e2723; margin: 0; }
.req-badge { margin-top: -4px; }

.content { max-width: 600px; margin: 0 auto; }

.search-box { margin-bottom: 12px; }
.search-results {
  background: white; border-radius: 10px; padding: 4px 8px; margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.user-item {
  display: flex; align-items: center; justify-content: space-between; padding: 8px 4px;
}
.user-item + .user-item { border-top: 1px solid #f5f0e8; }
.user-info { display: flex; align-items: center; gap: 10px; }
.user-name { font-weight: 500; color: #3e2723; }

.section { margin-bottom: 20px; }
.section-title {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  font-weight: 600; color: #5b3a29; font-size: 15px;
}

.requests-section .section-title { color: #e8a87c; }

.request-card, .friend-card {
  display: flex; align-items: center; gap: 12px;
  background: white; border-radius: 12px; padding: 14px;
  margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.request-card { border-left: 3px solid #e8a87c; }

.req-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.req-meta { min-width: 0; }
.req-name { font-weight: 600; color: #3e2723; }
.req-time { font-size: 12px; color: #999; margin-top: 2px; }
.req-actions { display: flex; gap: 6px; flex-shrink: 0; }

.friend-info { flex: 1; min-width: 0; }
.friend-name { font-weight: 600; color: #3e2723; }
.friend-stats { font-size: 12px; color: #8b7355; margin-top: 2px; }

.online-status { font-size: 12px; margin-left: auto; margin-right: 8px; }
.online-status.online { color: #5b8c5a; }
.online-status.offline { color: #aaa; }

.empty { text-align: center; color: #8b7355; margin-top: 40px; }
.empty p { font-size: 15px; }
</style>
