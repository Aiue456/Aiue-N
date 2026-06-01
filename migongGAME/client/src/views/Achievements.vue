<template>
  <div class="achievements-page">
    <div class="header">
      <el-button text @click="$router.push('/')">← 返回首页</el-button>
      <h2>成就墙</h2>
      <span class="count">{{ unlockedCount }}/{{ allAchievements.length }} 已解锁</span>
    </div>
    <div class="grid">
      <div v-for="ach in allAchievements" :key="ach.id" class="card"
        :class="{ unlocked: unlockedIds.includes(ach.id) }">
        <div class="icon">{{ ach.icon }}</div>
        <div class="name">{{ ach.name }}</div>
        <div class="desc">{{ ach.description }}</div>
        <div v-if="!unlockedIds.includes(ach.id)" class="lock">🔒</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'

const allAchievements = ref<any[]>([])
const unlockedIds = ref<string[]>([])
const unlockedCount = computed(() => unlockedIds.value.length)

onMounted(async () => {
  try {
    const [allRes, userRes] = await Promise.all([
      api.get('/api/achievements'),
      api.get('/api/achievements/user').catch(() => ({ data: { data: [] } }))
    ])
    allAchievements.value = allRes.data?.data || []
    unlockedIds.value = userRes.data?.data || []
  } catch { /* empty */ }
})
</script>
<style scoped>
.achievements-page { width: 100vw; min-height: 100vh; padding: 20px; background: linear-gradient(180deg, #87ceeb 0%, #f5f0e8 40%); }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.header h2 { color: #3e2723; margin: 0; }
.count { color: #8b7355; font-size: 14px; margin-left: auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; max-width: 800px; margin: 0 auto; }
.card { background: white; border-radius: 14px; padding: 20px 14px; text-align: center; position: relative; border: 2px solid #e8dcc8; transition: all 0.2s; }
.card.unlocked { border-color: #ffd700; background: #fffef5; }
.card:not(.unlocked) { opacity: 0.6; }
.icon { font-size: 36px; margin-bottom: 8px; }
.name { font-size: 15px; font-weight: 600; color: #3e2723; margin-bottom: 4px; }
.desc { font-size: 12px; color: #8b7355; }
.lock { position: absolute; top: 8px; right: 8px; font-size: 14px; }
</style>
