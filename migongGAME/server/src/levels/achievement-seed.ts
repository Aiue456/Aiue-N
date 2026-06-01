export const achievementSeeds = [
  { id: 'first_win', name: '初出茅庐', description: '通关第1关', icon: '🏅', condition: { type: 'levels', count: 1 } },
  { id: 'chapter1_done', name: '温暖起点', description: '通关第一章所有关卡', icon: '📖', condition: { type: 'levels', count: 10 } },
  { id: 'chapter2_done', name: '并肩前行', description: '通关第二章所有关卡', icon: '📚', condition: { type: 'levels', count: 30 } },
  { id: 'all_clear', name: '传承之光', description: '通关全部60关', icon: '🏆', condition: { type: 'levels', count: 60 } },
  { id: 'star_collector', name: '追星者', description: '累计获得100颗星', icon: '⭐', condition: { type: 'stars', count: 100 } },
  { id: 'speedrunner', name: '疾风步', description: '任意关卡在45秒内通关', icon: '💨', condition: { type: 'speed', seconds: 45 } },
  { id: 'friend_maker', name: '交个朋友', description: '添加1位好友', icon: '🤝', condition: { type: 'friends', count: 1 } },
  { id: 'note_collector', name: '笔记本收藏家', description: '收集10张便签', icon: '📝', condition: { type: 'notes', count: 10 } },
]
