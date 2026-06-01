import axios from 'axios'
import { ElMessage } from 'element-plus'

export const api = axios.create({
  baseURL: '',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('auth')
  if (auth) {
    const { token } = JSON.parse(auth)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth')
      ElMessage.error('登录已过期，请重新登录')
    } else if (err.code === 'ERR_NETWORK' || !err.response) {
      ElMessage.error('网络连接失败，请检查网络')
    } else if (err.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error('服务器内部错误')
    }
    return Promise.reject(err)
  },
)
