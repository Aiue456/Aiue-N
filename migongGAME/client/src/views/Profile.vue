<template>
  <div class="profile-page">
    <div class="card">
      <div class="header">
        <el-button text @click="$router.push('/')">← 返回首页</el-button>
        <h2>{{ isEditing ? '编辑个人信息' : '个人信息' }}</h2>
      </div>

      <div v-if="!auth.isGuest" class="info-section">
        <div class="avatar-section">
          <el-avatar :size="72">{{ auth.user?.username?.[0] }}</el-avatar>
        </div>

        <el-form label-position="top" v-if="isEditing">
          <el-form-item label="昵称">
            <el-input v-model="editForm.username" placeholder="修改昵称" />
          </el-form-item>
          <el-form-item label="账号 (不可修改)">
            <el-input :model-value="auth.user?.account" disabled />
          </el-form-item>
          <el-space>
            <el-button type="success" @click="saveProfile">保存</el-button>
            <el-button @click="isEditing = false">取消</el-button>
          </el-space>
        </el-form>

        <div v-else class="info-display">
          <p><strong>昵称：</strong>{{ auth.user?.username }}</p>
          <p><strong>账号：</strong>{{ auth.user?.account }}</p>
          <p><strong>创建时间：</strong>{{ formatDate(auth.user?.createdAt) }}</p>
          <el-button @click="isEditing = true" type="primary" plain>编辑资料</el-button>
        </div>
      </div>

      <!-- Guest upgrade -->
      <div v-if="auth.isGuest" class="guest-section">
        <div class="guest-icon">👤</div>
        <h3>游客模式</h3>
        <p class="hint">当前以游客身份游玩，数据仅保存在本地浏览器。</p>
        <p class="hint">注册账号后可在多设备间同步进度。</p>
        <el-form label-position="top">
          <el-form-item label="昵称">
            <el-input v-model="upgradeForm.username" placeholder="设置您的显示名称" />
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="upgradeForm.account" placeholder="设置登录账号" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="upgradeForm.password" type="password" placeholder="设置密码（6-32位）" show-password />
          </el-form-item>
          <el-button type="success" size="large" style="width:100%" @click="upgradeAccount">升级为正式账号</el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const isEditing = ref(false)

const editForm = reactive({ username: auth.user?.username || '' })
const upgradeForm = reactive({ username: '', account: '', password: '' })

function formatDate(ts: number | undefined) {
  if (!ts) return '未知'
  return new Date(ts).toLocaleDateString('zh-CN')
}

async function saveProfile() {
  try {
    await api.put('/api/users/me', { username: editForm.username })
    if (auth.user) auth.user.username = editForm.username
    ElMessage.success('保存成功')
    isEditing.value = false
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
}

async function upgradeAccount() {
  if (!upgradeForm.username || !upgradeForm.account || !upgradeForm.password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await auth.register(upgradeForm.username, upgradeForm.account, upgradeForm.password)
    ElMessage.success('升级成功！')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '升级失败')
  }
}
</script>

<style scoped>
.profile-page { width: 100vw; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding-top: 40px; background: linear-gradient(180deg, #87ceeb 0%, #f5f0e8 60%); }
.card { background: white; border-radius: 16px; padding: 32px; width: 480px; max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.header h2 { color: #3e2723; margin: 0; font-size: 22px; }
.avatar-section { text-align: center; margin-bottom: 24px; }
.info-display p { margin-bottom: 12px; font-size: 15px; color: #3e2723; }
.info-display p strong { color: #5b3a29; }
.guest-section { text-align: center; }
.guest-icon { font-size: 64px; margin-bottom: 12px; }
.guest-section h3 { color: #3e2723; margin-bottom: 8px; }
.hint { color: #8b7355; font-size: 14px; margin-bottom: 4px; }
</style>
