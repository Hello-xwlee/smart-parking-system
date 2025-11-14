/**
 * MockData 模块 - 统一的模拟数据管理系统
 * 提供 getList() 和 update() 接口，支持 localStorage 持久化
 */

const MockDB = {
  // 用户数据
  users: [
    { id: 1, username: 'admin', email: 'admin@smartparking.com', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user1', email: 'user1@example.com', password: 'user123', role: 'user', name: '张三', phone: '13800138001' },
    { id: 3, username: 'user2', email: 'user2@example.com', password: 'user123', role: 'user', name: '李四', phone: '13800138002' }
  ],

  // 停车场数据
  parkingLots: [
    { id: 1, name: '机电学馆停车场', address: '沈阳市和平区东北大学南湖校区机电学馆', totalSpots: 500, availableSpots: 125, hourlyRate: 5, image: 'https://via.placeholder.com/400x200/3b82f6/ffffff?text=机电学馆停车场' },
    { id: 2, name: '建筑学馆停车场', address: '沈阳市和平区东北大学南湖校区建筑学馆', totalSpots: 800, availableSpots: 234, hourlyRate: 3, image: 'https://via.placeholder.com/400x200/10b981/ffffff?text=建筑学馆停车场' },
    { id: 3, name: '大成停车场', address: '沈阳市和平区东北大学南湖校区大成教学楼', totalSpots: 1200, availableSpots: 456, hourlyRate: 4, image: 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=大成停车场' },
    { id: 4, name: '逸夫停车场', address: '沈阳市和平区东北大学南湖校区逸夫教学楼', totalSpots: 600, availableSpots: 178, hourlyRate: 2, image: 'https://via.placeholder.com/400x200/ef4444/ffffff?text=逸夫停车场' },
    { id: 5, name: '何世礼停车场', address: '沈阳市和平区东北大学南湖校区何世礼教学楼', totalSpots: 650, availableSpots: 210, hourlyRate: 3, image: 'https://via.placeholder.com/400x200/8b5cf6/ffffff?text=何世礼停车场' },
    { id: 6, name: '采矿学馆停车场', address: '沈阳市和平区东北大学南湖校区采矿学馆', totalSpots: 450, availableSpots: 132, hourlyRate: 4, image: 'https://via.placeholder.com/400x200/06b6d4/ffffff?text=采矿学馆停车场' },
    { id: 7, name: '冶金学馆停车场', address: '沈阳市和平区东北大学南湖校区冶金学馆', totalSpots: 380, availableSpots: 95, hourlyRate: 3, image: 'https://via.placeholder.com/400x200/84cc16/ffffff?text=冶金学馆停车场' }
  ],

  // 预约记录
  bookings: [
    { id: 1, userId: 2, parkingLotId: 1, spotNumber: 'A-101', date: '2025-11-14', startTime: '09:00', endTime: '12:00', status: 'confirmed', fee: 15 },
    { id: 2, userId: 2, parkingLotId: 2, spotNumber: 'B-205', date: '2025-11-15', startTime: '14:00', endTime: '18:00', status: 'pending', fee: 12 },
    { id: 3, userId: 3, parkingLotId: 3, spotNumber: 'C-308', date: '2025-11-14', startTime: '19:00', endTime: '22:00', status: 'confirmed', fee: 16 }
  ],

  // 支付记录
  payments: [
    { id: 1, userId: 2, bookingId: 1, amount: 15, status: 'completed', method: 'wechat', time: '2025-11-14 08:30', transactionId: 'TXN20251114001' },
    { id: 2, userId: 3, bookingId: 3, amount: 16, status: 'completed', method: 'alipay', time: '2025-11-14 18:45', transactionId: 'TXN20251114002' }
  ],

  // 设备数据（IoT设备）
  devices: [
    { id: 1, type: 'camera', location: '中央商务停车场入口', status: 'online', lastSeen: '2025-11-14 10:00:00' },
    { id: 2, type: 'sensor', location: '科技园区停车场A区', status: 'online', lastSeen: '2025-11-14 10:01:00' },
    { id: 3, type: 'barrier', location: '购物广场停车场出口', status: 'offline', lastSeen: '2025-11-14 09:30:00' },
    { id: 4, type: 'sensor', location: '医院停车场B区', status: 'online', lastSeen: '2025-11-14 10:02:00' }
  ],

  // 系统统计数据
  stats: {
    totalParking: 155,
    totalSpots: 3100,
    availableSpots: 2876,
    todayBookings: 1234,
    activeUsers: 8921,
    revenueToday: 4567
  }
};

/**
 * MockData 管理器
 */
const MockData = {
  // 初始化 - 从 localStorage 加载数据
  init() {
    const savedData = localStorage.getItem('smartparking_mockdb');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 合并保存的数据（只覆盖存在的字段）
        Object.keys(parsed).forEach(key => {
          if (MockDB[key] !== undefined) {
            MockDB[key] = parsed[key];
          }
        });
        console.log('MockData: 已从 localStorage 加载数据');
      } catch (e) {
        console.error('MockData: 加载 localStorage 数据失败', e);
      }
    }
    return this;
  },

  /**
   * 获取数据列表
   * @param {string} collection - 集合名称（users, parkingLots, bookings 等）
   * @param {Object} options - 可选参数
   * @param {Function} options.filter - 过滤函数
   * @param {string} options.sortBy - 排序字段
   * @param {string} options.order - 排序顺序（asc/desc）
   * @returns {Array} 数据列表
   */
  getList(collection, options = {}) {
    if (!MockDB[collection]) {
      console.error(`MockData: 集合 "${collection}" 不存在`);
      return [];
    }

    let data = [...MockDB[collection]];

    // 应用过滤器
    if (options.filter && typeof options.filter === 'function') {
      data = data.filter(options.filter);
    }

    // 排序
    if (options.sortBy) {
      data.sort((a, b) => {
        const aVal = a[options.sortBy];
        const bVal = b[options.sortBy];
        const order = options.order === 'desc' ? -1 : 1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }

    return data;
  },

  /**
   * 获取单条数据
   * @param {string} collection - 集合名称
   * @param {number} id - 数据ID
   * @returns {Object|null} 数据对象
   */
  getOne(collection, id) {
    const list = this.getList(collection);
    return list.find(item => item.id === id) || null;
  },

  /**
   * 更新数据集合
   * @param {string} collection - 集合名称
   * @param {Function} updater - 更新函数，接收当前数据并返回新数据
   * @returns {boolean} 是否更新成功
   */
  update(collection, updater) {
    if (!MockDB[collection]) {
      console.error(`MockData: 集合 "${collection}" 不存在`);
      return false;
    }

    if (typeof updater !== 'function') {
      console.error('MockData: updater 必须是函数');
      return false;
    }

    try {
      const currentData = MockDB[collection];
      const newData = updater(currentData);

      // 验证返回的数据类型
      if (!Array.isArray(newData) && typeof newData !== 'object') {
        console.error('MockData: updater 必须返回数组或对象');
        return false;
      }

      MockDB[collection] = newData;
      this.save(); // 自动保存到 localStorage
      return true;
    } catch (e) {
      console.error('MockData: 更新数据失败', e);
      return false;
    }
  },

  /**
   * 添加数据项
   * @param {string} collection - 集合名称
   * @param {Object} item - 要添加的数据项
   * @returns {Object|null} 添加后的数据项（包含生成的ID）
   */
  add(collection, item) {
    if (!MockDB[collection]) {
      console.error(`MockData: 集合 "${collection}" 不存在`);
      return null;
    }

    const list = MockDB[collection];
    const isArray = Array.isArray(list);

    if (isArray) {
      // 为数组类型集合生成ID
      const newId = Math.max(...list.map(i => i.id || 0), 0) + 1;
      const newItem = { id: newId, ...item };
      list.push(newItem);
      this.save();
      return newItem;
    } else {
      // 为对象类型集合（如 stats）合并数据
      MockDB[collection] = { ...list, ...item };
      this.save();
      return MockDB[collection];
    }
  },

  /**
   * 删除数据项
   * @param {string} collection - 集合名称
   * @param {number} id - 要删除的数据ID
   * @returns {boolean} 是否删除成功
   */
  remove(collection, id) {
    if (!MockDB[collection] || !Array.isArray(MockDB[collection])) {
      console.error(`MockData: 集合 "${collection}" 不存在或不是数组`);
      return false;
    }

    const index = MockDB[collection].findIndex(item => item.id === id);
    if (index === -1) return false;

    MockDB[collection].splice(index, 1);
    this.save();
    return true;
  },

  /**
   * 生成模拟统计数据（用于实时更新）
   */
  generateMockStats() {
    const stats = this.getList('stats')[0];

    // 更新统计数据
    const newStats = {
      totalParking: Math.max(150, Math.min(160, stats.totalParking + Math.floor(Math.random() * 3) - 1)),
      totalSpots: 3100,
      availableSpots: Math.max(2800, Math.min(2900, stats.availableSpots + Math.floor(Math.random() * 20) - 10)),
      todayBookings: Math.max(1200, Math.min(1250, stats.todayBookings + Math.floor(Math.random() * 10) - 5)),
      activeUsers: Math.max(8900, Math.min(9000, stats.activeUsers + Math.floor(Math.random() * 50) - 25)),
      revenueToday: Math.floor(Math.random() * 5000) + 4000
    };

    this.update('stats', () => [newStats]);
    return newStats;
  },

  /**
   * 保存数据到 localStorage
   */
  save() {
    try {
      localStorage.setItem('smartparking_mockdb', JSON.stringify(MockDB));
      return true;
    } catch (e) {
      console.error('MockData: 保存到 localStorage 失败', e);
      return false;
    }
  },

  /**
   * 清空所有数据（重置为初始状态）
   */
  clear() {
    localStorage.removeItem('smartparking_mockdb');
    location.reload();
  }
};

// 初始化
MockData.init();

// 导出到全局
window.MockData = MockData;
window.MockDB = MockDB; // 也导出原始数据对象供调试使用
