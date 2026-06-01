<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>注册</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="昵称" prop="username">
          <el-input v-model="form.username" placeholder="输入显示名称（2-12个字符）" />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="设置登录账号（任意字符，如 xiaoming）" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="6-32个字符" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" show-password
            @keyup.enter="handleRegister" />
        </el-form-item>
        <el-button type="success" size="large" :loading="loading" @click="handleRegister" style="width:100%">
          注册
        </el-button>
      </el-form>
      <div class="auth-links">
        <el-button text @click="$router.push('/login')">已有账号？立即登录</el-button>
        <el-button text @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)

const form = reactive({ username: '', account: '', password: '', confirmPassword: '' })

const validateConfirm = (_rule: any, value: string, cb: any) => {
  if (value !== form.password) cb(new Error('两次密码输入不一致'))
  else cb()
}

const rules = {
  username: [{ required: true }, { min: 2, max: 12, message: '昵称2-12个字符' }],
  account: [{ required: true, message: '请设置账号', trigger: 'blur' }, { min: 3, max: 30, message: '账号3-30个字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 32, message: '密码6-32个字符', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: validateConfirm, trigger: 'blur' }],
}

async function handleRegister() {
  loading.value = true
  try {
    await auth.register(form.username, form.account, form.password)
    ElMessage.success('注册成功，账号：' + form.account)
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #87ceeb 0%, #f5f0e8 60%); }
.auth-card { background: white; border-radius: 16px; padding: 40px; width: 400px; max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.auth-card h2 { text-align: center; color: #3e2723; margin-bottom: 24px; font-size: 24px; }
.auth-links { margin-top: 16px; display: flex; justify-content: space-between; }
</style>
