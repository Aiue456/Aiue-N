import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface UserInfo {
  id: string
  username: string
  account: string
  avatar: string
  createdAt?: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isGuest = computed(() => !token.value)

  function init() {
    const saved = localStorage.getItem('auth')
    if (saved) {
      const data = JSON.parse(saved)
      user.value = data.user
      token.value = data.token
    }
  }

  function setAuth(u: UserInfo, t: string) {
    user.value = u
    token.value = t
    localStorage.setItem('auth', JSON.stringify({ user: u, token: t }))
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth')
  }

  async function login(account: string, password: string) {
    const res = await api.post('/api/auth/login', { account, password })
    setAuth(res.data.data.user, res.data.data.token)
    return res.data
  }

  async function register(username: string, account: string, password: string) {
    const res = await api.post('/api/auth/register', { username, account, password })
    setAuth(res.data.data.user, res.data.data.token)
    return res.data
  }

  return { user, token, isLoggedIn, isGuest, init, setAuth, logout, login, register }
})
