import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/smallGame/'),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue') },
    { path: '/play/:id', name: 'play', component: () => import('@/views/GamePlay.vue') },
    { path: '/levels', name: 'levels', component: () => import('@/views/LevelSelect.vue') },
    { path: '/leaderboard', name: 'leaderboard', component: () => import('@/views/Leaderboard.vue') },
    { path: '/friends', name: 'friends', component: () => import('@/views/Friends.vue') },
    { path: '/notebook', name: 'notebook', component: () => import('@/views/Notebook.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/Profile.vue') },
    { path: '/achievements', name: 'achievements', component: () => import('@/views/Achievements.vue') },
  ],
})

export default router
