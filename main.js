// 智能停车管理系统主要JavaScript文件

// ==================== API 层（Mock 实现） ====================
/**
 * 统一的 API 层设计
 * 当前使用 MockDB + Promise 模拟后端接口
 * 将来接入真实后端时，只需将此处的实现替换为 fetch('/api/...') 调用
 * 无需修改调用方代码
 */
const api = {
  // ==================== 认证相关 API ====================
  auth: {
    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证 {username, password}
     * @returns {Promise<Object>} 用户信息 {token, userId, username, email, role}
     */
    login(credentials) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const { username, password } = credentials;
          const user = MockDB.users.find(
            u => u.username === username && u.password === password
          );

          if (user) {
            // 模拟生成 token
            const token = btoa(`${user.username}:${Date.now()}`);
            resolve({
              token,
              userId: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            });
          } else {
            reject(new Error('用户名或密码错误'));
          }
        }, 500); // 模拟网络延迟
      });
    },

    /**
     * 获取当前用户信息
     * @param {string} token - 用户 token
     * @returns {Promise<Object>} 用户信息
     */
    getCurrentUser(token) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 简单的 token 解析（实际项目中应该验证 token 有效性）
          try {
            const decoded = atob(token).split(':');
            const username = decoded[0];
            const user = MockDB.users.find(u => u.username === username);
            if (user) {
              resolve({
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name || '',
                phone: user.phone || ''
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        }, 300);
      });
    },

    /**
     * 用户登出
     */
    logout() {
      return Promise.resolve();
    }
  },

  // ==================== 停车场相关 API ====================
  parking: {
    /**
     * 获取停车场列表
     * @param {Object} params - 查询参数 {location, availableOnly}
     * @returns {Promise<Array>} 停车场列表
     */
    getList(params = {}) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filter = (lot) => {
            if (params.location) {
              const location = params.location.toLowerCase();
              if (!lot.name.toLowerCase().includes(location) &&
                  !lot.address.toLowerCase().includes(location)) {
                return false;
              }
            }
            if (params.availableOnly && lot.availableSpots === 0) {
              return false;
            }
            return true;
          };

          const parkingLots = MockData.getList('parkingLots', { filter });
          resolve(parkingLots);
        }, 400);
      });
    },

    /**
     * 获取单个停车场详情
     * @param {number} id - 停车场ID
     * @returns {Promise<Object>} 停车场详情
     */
    getById(id) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const parkingLot = MockData.getOne('parkingLots', id);
          if (parkingLot) {
            resolve(parkingLot);
          } else {
            reject(new Error('停车场不存在'));
          }
        }, 300);
      });
    },

    /**
     * 更新停车场信息
     * @param {number} id - 停车场ID
     * @param {Object} data - 更新数据
     * @returns {Promise<Object>} 更新后的停车场信息
     */
    update(id, data) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const success = MockData.update('parkingLots', (lots) => {
            const index = lots.findIndex(lot => lot.id === id);
            if (index === -1) return lots;
            lots[index] = { ...lots[index], ...data };
            return lots;
          });

          if (success) {
            resolve(MockData.getOne('parkingLots', id));
          } else {
            reject(new Error('更新失败'));
          }
        }, 500);
      });
    }
  },

  // ==================== 预约相关 API ====================
  booking: {
    /**
     * 获取用户的预约列表
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>} 预约列表
     */
    getUserBookings(userId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const bookings = MockData.getList('bookings', {
            filter: (booking) => booking.userId === userId
          });
          resolve(bookings);
        }, 400);
      });
    },

    /**
     * 创建预约
     * @param {Object} data - 预约数据 {userId, parkingLotId, spotNumber, date, startTime, endTime}
     * @returns {Promise<Object>} 创建的预约
     */
    create(data) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 计算费用（简化计算）
          const parkingLot = MockData.getOne('parkingLots', data.parkingLotId);
          if (!parkingLot) {
            reject(new Error('停车场不存在'));
            return;
          }

          // 计算时长
          const start = new Date(`${data.date} ${data.startTime}`);
          const end = new Date(`${data.date} ${data.endTime}`);
          const hours = Math.ceil((end - start) / (1000 * 60 * 60));
          const fee = hours * parkingLot.hourlyRate;

          const booking = MockData.add('bookings', {
            ...data,
            status: 'pending',
            fee
          });

          // 更新可用车位数
          MockData.update('parkingLots', (lots) => {
            const index = lots.findIndex(lot => lot.id === data.parkingLotId);
            if (index !== -1 && lots[index].availableSpots > 0) {
              lots[index].availableSpots -= 1;
            }
            return lots;
          });

          resolve(booking);
        }, 800); // 较长的延迟模拟创建过程
      });
    },

    /**
     * 取消预约
     * @param {number} bookingId - 预约ID
     * @returns {Promise<void>}
     */
    cancel(bookingId) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const booking = MockData.getOne('bookings', bookingId);
          if (!booking) {
            reject(new Error('预约不存在'));
            return;
          }

          if (booking.status === 'cancelled') {
            reject(new Error('预约已取消'));
            return;
          }

          // 更新状态
          MockData.update('bookings', (bookings) => {
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
              bookings[index].status = 'cancelled';
            }
            return bookings;
          });

          // 恢复车位
          if (booking.status === 'confirmed') {
            MockData.update('parkingLots', (lots) => {
              const index = lots.findIndex(lot => lot.id === booking.parkingLotId);
              if (index !== -1) {
                lots[index].availableSpots += 1;
              }
              return lots;
            });
          }

          resolve();
        }, 600);
      });
    }
  },

  // ==================== 支付相关 API ====================
  payment: {
    /**
     * 处理支付
     * @param {Object} data - 支付数据 {bookingId, amount, method}
     * @returns {Promise<Object>} 支付结果
     */
    process(data) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 模拟支付处理
          const booking = MockData.getOne('bookings', data.bookingId);
          if (!booking) {
            reject(new Error('预约不存在'));
            return;
          }

          // 创建支付记录
          const payment = MockData.add('payments', {
            userId: booking.userId,
            bookingId: data.bookingId,
            amount: data.amount,
            status: 'completed',
            method: data.method,
            time: new Date().toLocaleString('zh-CN'),
            transactionId: 'TXN' + Date.now()
          });

          // 更新预约状态
          MockData.update('bookings', (bookings) => {
            const index = bookings.findIndex(b => b.id === data.bookingId);
            if (index !== -1) {
              bookings[index].status = 'confirmed';
            }
            return bookings;
          });

          resolve(payment);
        }, 1500); // 较长的延迟模拟支付处理
      });
    },

    /**
     * 获取支付记录
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>} 支付记录列表
     */
    getUserPayments(userId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const payments = MockData.getList('payments', {
            filter: (payment) => payment.userId === userId,
            sortBy: 'time',
            order: 'desc'
          });
          resolve(payments);
        }, 400);
      });
    }
  },

  // ==================== 通知相关 API ====================
  notification: {
    /**
     * 获取用户通知列表
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>} 通知列表
     */
    getUserNotifications(userId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const notifications = NotificationManager.getUserNotifications(userId);
          resolve(notifications);
        }, 300);
      });
    },

    /**
     * 标记通知为已读
     * @param {number} notificationId - 通知ID
     * @returns {Promise<void>}
     */
    markAsRead(notificationId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          NotificationManager.markAsRead(notificationId);
          resolve();
        }, 200);
      });
    },

    /**
     * 标记所有通知为已读
     * @param {number} userId - 用户ID
     * @returns {Promise<void>}
     */
    markAllAsRead(userId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          NotificationManager.markAllAsRead(userId);
          resolve();
        }, 300);
      });
    }
  }
};

// ==================== API 层结束 ====================

// ==================== 认证管理器 ====================
/**
 * 认证管理器 - 处理用户登录认证和权限控制
 * 使用 localStorage 存储 token，实现前端路由守卫
 * 将来接入真实后端时，只需更新 api.auth 的实现
 */
const AuthManager = {
  // 初始化认证系统
  init() {
    this.checkAuth();
    this.updateNavigation();
    return this;
  },

  /**
   * 检查当前用户是否已登录
   * 未登录且需要权限的页面会跳转到登录页
   */
  checkAuth() {
    const token = this.getToken();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 需要登录才能访问的页面
    const protectedPages = ['booking.html', 'payment.html'];

    // 需要管理员权限的页面
    const adminPages = ['admin.html'];

    if (protectedPages.includes(currentPage) || adminPages.includes(currentPage)) {
      if (!token) {
        this.redirectToLogin();
        return false;
      }

      // 检查管理员权限
      if (adminPages.includes(currentPage) && !this.isAdmin()) {
        alert('需要管理员权限');
        window.location.href = 'index.html';
        return false;
      }
    }

    return true;
  },

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录用户信息
   */
  async login(username, password) {
    try {
      const userData = await api.auth.login({ username, password });

      // 保存用户信息到 localStorage
      localStorage.setItem('smartparking_token', userData.token);
      localStorage.setItem('smartparking_user', JSON.stringify({
        userId: userData.userId,
        username: userData.username,
        email: userData.email,
        role: userData.role
      }));

      this.updateNavigation();
      return userData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 用户登出
   */
  logout() {
    localStorage.removeItem('smartparking_token');
    localStorage.removeItem('smartparking_user');
    localStorage.removeItem('smartparking_notifications');
    this.updateNavigation();
    window.location.href = 'index.html';
  },

  /**
   * 获取当前用户 token
   * @returns {string|null} token
   */
  getToken() {
    return localStorage.getItem('smartparking_token');
  },

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('smartparking_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * 检查是否已登录
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * 检查是否为管理员
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * 更新导航栏显示
   * 根据登录状态显示不同的导航项
   */
  updateNavigation() {
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const adminLink = document.getElementById('nav-admin-link');
    const registerBtn = document.getElementById('nav-register-btn');

    const isLoggedIn = this.isAuthenticated();
    const isAdminRole = this.isAdmin();

    if (loginBtn) {
      loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    }

    if (registerBtn) {
      registerBtn.style.display = isLoggedIn ? 'none' : 'block';
    }

    if (logoutBtn) {
      logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    }

    if (adminLink) {
      adminLink.style.display = isAdminRole ? 'block' : 'none';
    }
  },

  /**
   * 跳转到登录页
   * @param {string} redirectTo - 登录后跳转的页面，默认 index.html
   */
  redirectToLogin(redirectTo = null) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'login.html') {
      const redirect = redirectTo || currentPage;
      window.location.href = `login.html${redirect !== 'index.html' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;
    }
  }
};

// ==================== 认证管理器结束 ====================

// ==================== 通知管理器 ====================
/**
 * 通知管理器 - 处理消息通知功能
 * 当前使用前端模拟数据，将来可通过 WebSocket 或轮询更新
 */
const NotificationManager = {
  // 初始化通知系统
  init() {
    this.updateUnreadCount();
    return this;
  },

  /**
   * 获取用户通知列表
   * @param {number} userId - 用户ID
   * @returns {Array} 通知列表
   */
  getUserNotifications(userId) {
    const notifications = MockDB.notifications || [];
    return notifications;
  },

  /**
   * 创建新通知
   * @param {Object} notification - 通知数据
   */
  add(notification) {
    const notifications = MockDB.notifications || [];
    const newNotification = {
      id: Date.now(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toLocaleString('zh-CN'),
      read: false,
      ...notification
    };

    notifications.unshift(newNotification);
    MockDB.notifications = notifications;
    MockData.save();

    this.updateUnreadCount();
    return newNotification;
  },

  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   */
  markAsRead(notificationId) {
    const notifications = MockDB.notifications || [];
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      MockDB.notifications = notifications;
      MockData.save();
      this.updateUnreadCount();
    }
  },

  /**
   * 标记所有通知为已读
   * @param {number} userId - 用户ID
   */
  markAllAsRead(userId) {
    const notifications = MockDB.notifications || [];
    notifications.forEach(n => n.read = true);
    MockDB.notifications = notifications;
    MockData.save();
    this.updateUnreadCount();
  },

  /**
   * 获取未读通知数量
   * @returns {number} 未读数量
   */
  getUnreadCount() {
    const notifications = MockDB.notifications || [];
    return notifications.filter(n => !n.read).length;
  },

  /**
   * 更新未读通知计数显示
   */
  updateUnreadCount() {
    const badge = document.getElementById('notification-badge');
    const count = this.getUnreadCount();

    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  /**
   * 显示通知抽屉
   */
  showNotificationDrawer() {
    const drawer = document.getElementById('notification-drawer');
    const overlay = document.getElementById('drawer-overlay');

    if (drawer) {
      drawer.classList.remove('translate-x-full');
    }

    if (overlay) {
      overlay.classList.remove('hidden');
    }

    this.renderNotifications();
  },

  /**
   * 隐藏通知抽屉
   */
  hideNotificationDrawer() {
    const drawer = document.getElementById('notification-drawer');
    const overlay = document.getElementById('drawer-overlay');

    if (drawer) {
      drawer.classList.add('translate-x-full');
    }

    if (overlay) {
      overlay.classList.add('hidden');
    }
  },

  /**
   * 渲染通知列表
   */
  renderNotifications() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('notification-list');
    const notifications = this.getUserNotifications(user.userId);

    if (!container) return;

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 text-gray-500">
          <div class="text-4xl mb-2">📭</div>
          <p>暂无通知</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications.map(notif => `
      <div class="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${
        notif.read ? 'opacity-75' : 'bg-blue-50/50'
      }" onclick="NotificationManager.markAsRead(${notif.id})">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            ${this.getNotificationIcon(notif.type)}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-900">${notif.title}</h3>
              ${notif.read ? '' : '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>'}
            </div>
            <p class="text-sm text-gray-600 mt-1">${notif.message}</p>
            <p class="text-xs text-gray-400 mt-2">${notif.timestamp}</p>
          </div>
        </div>
      </div>
    `).join('');
  },

  /**
   * 获取通知图标
   */
  getNotificationIcon(type) {
    const icons = {
      success: '<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>',
      warning: '<div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">⚠️</div>',
      error: '<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">✕</div>',
      info: '<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">ℹ️</div>'
    };
    return icons[type] || icons.info;
  }
};

// ==================== 通知管理器结束 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeParticles();
    initializeCharts();
    initializeRealTimeData();
    initializeEventListeners();
    AuthManager.init();
    NotificationManager.init();
});

// 初始化页面动画
function initializeAnimations() {
    // 英雄区域标题动画
    anime({
        targets: '#hero-title',
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        delay: 500,
        easing: 'easeOutQuad'
    });

    // 英雄区域副标题动画
    anime({
        targets: '#hero-subtitle',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: 800,
        easing: 'easeOutQuad'
    });

    // 英雄区域按钮动画
    anime({
        targets: '#hero-buttons',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: 1200,
        easing: 'easeOutQuad'
    });

    // 功能卡片动画
    anime({
        targets: '.feature-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100, {start: 1500}),
        easing: 'easeOutQuad'
    });
}

// 初始化粒子背景
function initializeParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // 设置画布大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 粒子类
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // 创建粒子
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 绘制连接线
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 初始化图表
function initializeCharts() {
    // ========================================
    // 修复：添加错误处理和延迟初始化 (FIXED)
    // ========================================
    setTimeout(() => {
        try {
            // 停车场使用率图表 - 使用 MockDB 数据
            const usageChartElement = document.getElementById('usage-chart');
            const activityChartElement = document.getElementById('activity-chart');

            if (!usageChartElement || !activityChartElement) {
                console.error('❌ 图表容器未找到，检查ID是否正确');
                return;
            }

            const parkingLots = MockDB.parkingLots;

            // 计算总车位和已使用车位
            const totalSpots = parkingLots.reduce((sum, lot) => sum + lot.totalSpots, 0);
            const usedSpots = parkingLots.reduce((sum, lot) => sum + (lot.totalSpots - lot.availableSpots), 0);

            const usageChart = echarts.init(usageChartElement);
            const usageOption = {
                title: {
                    text: '实时车位使用情况',
                    left: 'center',
                    textStyle: { fontSize: 16 }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    top: 'center'
                },
                series: [
                    {
                        name: '车位使用情况',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['60%', '50%'],
                        data: [
                            { value: usedSpots, name: '已使用' },
                            { value: totalSpots - usedSpots, name: '空闲' }
                        ],
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        color: ['#3b82f6', '#10b981'],
                        label: {
                            show: true,
                            formatter: '{b}\n{d}%'
                        }
                    }
                ]
            };
            usageChart.setOption(usageOption);

            // 响应式调整
            window.addEventListener('resize', () => {
                if (usageChart) usageChart.resize();
            });

            console.log('✅ 停车场使用率图表初始化完成');

            // 用户活跃度图表
            const activityChart = echarts.init(activityChartElement);
            const activityOption = {
                title: {
                    text: '一周用户活跃度',
                    left: 'center',
                    textStyle: { fontSize: 16 }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: '{b}: {c} 人'
                },
                xAxis: {
                    type: 'category',
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    axisLabel: { interval: 0 }
                },
                yAxis: {
                    type: 'value',
                    name: '活跃用户数',
                    axisLabel: { formatter: '{value} 人' }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                series: [
                    {
                        name: '活跃用户数',
                        data: [820, 932, 901, 934, 1290, 1330, 1320],
                        type: 'line',
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: {
                            width: 3,
                            color: '#3b82f6'
                        },
                        itemStyle: {
                            color: '#3b82f6'
                        },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [{
                                    offset: 0, color: 'rgba(59, 130, 246, 0.3)'
                                }, {
                                    offset: 1, color: 'rgba(59, 130, 246, 0.1)'
                                }]
                            }
                        }
                    }
                ]
            };
            activityChart.setOption(activityOption);

            // 响应式调整 - 合并事件监听器
            window.addEventListener('resize', () => {
                if (activityChart) activityChart.resize();
            });

            console.log('✅ 用户活跃度图表初始化完成');
        } catch (error) {
            console.error('❌ 图表初始化失败:', error);
        }
    }, 500); // 延迟500ms确保DOM完全加载
}

// 初始化实时数据更新
function initializeRealTimeData() {
    // 模拟实时数据更新
    setInterval(function() {
        updateRealTimeData();
    }, 3000);
}

// 更新实时数据
function updateRealTimeData() {
    // 使用 MockData 生成模拟统计数据
    const stats = MockData.generateMockStats();

    const totalParking = document.getElementById('total-parking');
    const availableSpots = document.getElementById('available-spots');
    const todayBookings = document.getElementById('today-bookings');
    const activeUsers = document.getElementById('active-users');

    if (totalParking) {
        totalParking.textContent = stats.totalParking;
    }

    if (availableSpots) {
        availableSpots.textContent = stats.availableSpots.toLocaleString();
    }

    if (todayBookings) {
        todayBookings.textContent = stats.todayBookings.toLocaleString();
    }

    if (activeUsers) {
        activeUsers.textContent = stats.activeUsers.toLocaleString();
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    // 管理员登录表单提交
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAdminLogin();
        });
    }
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 显示管理员登录模态框
function showAdminLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }
}

// 关闭管理员登录模态框
function closeAdminLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuad',
            complete: function() {
                modal.classList.add('hidden');
            }
        });
    }
}

// 处理管理员登录
function handleAdminLogin() {
    // 模拟登录验证
    setTimeout(function() {
        closeAdminLogin();
        // 获取管理员用户名（这里假设是表单中的第一个输入框）
        const adminForm = document.getElementById('admin-login-form');
        const usernameInput = adminForm ? adminForm.querySelector('input[type="text"]') : null;
        const username = usernameInput ? usernameInput.value : '管理员';

        // 跳转到管理员页面
        window.location.href = `admin.html?admin=${encodeURIComponent(username)}`;
    }, 1000);
}

// 显示用户注册模态框
function showUserRegister() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.remove('hidden');
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
        // 清空之前的表单数据
        clearRegisterForm();
    }
}

// 关闭用户注册模态框
function closeUserRegister() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuad',
            complete: function() {
                modal.classList.add('hidden');
                // 清空表单数据
                clearRegisterForm();
            }
        });
    }
}

// 清空注册表单
function clearRegisterForm() {
    const form = document.getElementById('user-register-form');
    if (form) {
        form.reset();
    }
    // 清空错误信息
    document.getElementById('username-error').textContent = '';
    document.getElementById('username-error').classList.add('hidden');
    document.getElementById('phone-error').textContent = '';
    document.getElementById('phone-error').classList.add('hidden');
    document.getElementById('email-error').textContent = '';
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('confirm-password-error').textContent = '';
    document.getElementById('confirm-password-error').classList.add('hidden');
}

// 验证用户名
function validateUsername(username) {
    const errorDiv = document.getElementById('username-error');

    if (!username || username.trim().length < 3) {
        errorDiv.textContent = '用户名至少需要3个字符';
        errorDiv.classList.remove('hidden');
        return false;
    }
    if (username.length > 20) {
        errorDiv.textContent = '用户名不能超过20个字符';
        errorDiv.classList.remove('hidden');
        return false;
    }
    // 检查用户名是否已存在
    const users = JSON.parse(localStorage.getItem('smartparking_users') || '[]');
    if (users.find(u => u.username === username)) {
        errorDiv.textContent = '用户名已存在，请使用其他用户名';
        errorDiv.classList.remove('hidden');
        return false;
    }

    errorDiv.classList.add('hidden');
    return true;
}

// 验证手机号
function validatePhone(phone) {
    const errorDiv = document.getElementById('phone-error');
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!phone) {
        errorDiv.textContent = '手机号不能为空';
        errorDiv.classList.remove('hidden');
        return false;
    }
    if (!phoneRegex.test(phone)) {
        errorDiv.textContent = '请输入正确的手机号格式';
        errorDiv.classList.remove('hidden');
        return false;
    }
    // 检查手机号是否已存在
    const users = JSON.parse(localStorage.getItem('smartparking_users') || '[]');
    if (users.find(u => u.phone === phone)) {
        errorDiv.textContent = '手机号已被注册';
        errorDiv.classList.remove('hidden');
        return false;
    }

    errorDiv.classList.add('hidden');
    return true;
}

// 验证邮箱
function validateEmail(email) {
    const errorDiv = document.getElementById('email-error');

    if (!email || email.trim() === '') {
        errorDiv.classList.add('hidden');
        return true; // 邮箱是可选的
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = '请输入正确的邮箱格式';
        errorDiv.classList.remove('hidden');
        return false;
    }

    errorDiv.classList.add('hidden');
    return true;
}

// 验证密码
function validatePassword(password, confirmPassword = null) {
    const errorDiv = document.getElementById('password-error');

    if (!password || password.length < 6) {
        errorDiv.textContent = '密码至少需要6位字符';
        errorDiv.classList.remove('hidden');
        return false;
    }

    errorDiv.classList.add('hidden');

    // 验证确认密码
    if (confirmPassword !== null) {
        return validateConfirmPassword(password, confirmPassword);
    }

    return true;
}

// 验证确认密码
function validateConfirmPassword(password, confirmPassword) {
    const errorDiv = document.getElementById('confirm-password-error');

    if (!confirmPassword) {
        errorDiv.textContent = '请确认密码';
        errorDiv.classList.remove('hidden');
        return false;
    }
    if (password !== confirmPassword) {
        errorDiv.textContent = '两次输入的密码不一致';
        errorDiv.classList.remove('hidden');
        return false;
    }

    errorDiv.classList.add('hidden');
    return true;
}

// 用户注册功能
function handleUserRegister(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // 验证所有字段
    const isUsernameValid = validateUsername(username);
    const isPhoneValid = validatePhone(phone);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(password, confirmPassword);

    if (!document.getElementById('reg-terms').checked) {
        alert('请先同意服务条款和隐私政策');
        return false;
    }

    if (isUsernameValid && isPhoneValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
        // 注册成功，保存用户信息
        const users = JSON.parse(localStorage.getItem('smartparking_users') || '[]');
        const newUser = {
            id: Date.now(), // 使用时间戳作为用户ID
            username: username,
            phone: phone,
            email: email || null,
            password: btoa(password), // 简单加密存储密码（实际项目应使用更安全的加密方式）
            registerTime: new Date().toLocaleString('zh-CN'),
            status: 'active',
            vehicleCount: 0
        };

        users.push(newUser);
        localStorage.setItem('smartparking_users', JSON.stringify(users));

        // 自动登录
        const token = btoa(`${username}:${Date.now()}`);
        localStorage.setItem('smartparking_token', token);
        localStorage.setItem('smartparking_user', JSON.stringify({
            userId: newUser.id,
            username: newUser.username,
            phone: newUser.phone,
            email: newUser.email
        }));

        // 关闭注册模态框
        closeUserRegister();

        // 显示成功消息
        alert(`注册成功！欢迎 ${username}！`);

        // 更新导航栏显示
        if (typeof AuthManager !== 'undefined') {
            AuthManager.updateNavigation();
        } else {
            // 如果没有AuthManager，手动更新导航栏
            updateNavigationBar();
        }
    }
}

// 更新导航栏（当没有AuthManager时）
function updateNavigationBar() {
    const loginBtn = document.getElementById('nav-login-btn');
    const registerBtn = document.getElementById('nav-register-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const notificationBtn = document.getElementById('notification-btn');

    if (localStorage.getItem('smartparking_token')) {
        // 已登录状态
        if (loginBtn) loginBtn.classList.add('hidden');
        if (registerBtn) registerBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (notificationBtn) notificationBtn.style.display = 'block';
    }
}

// 停车场搜索功能
function searchParkingLots() {
    const searchInput = document.getElementById('search-input');
    const location = searchInput ? searchInput.value : '';

    if (location.trim()) {
        // 模拟搜索功能
        console.log('搜索停车场位置:', location);
        // 这里可以添加实际的搜索逻辑
    }
}

// 预约车位功能
function bookParkingSpot(parkingId, spotId) {
    console.log('预约车位:', parkingId, spotId);
    // 这里可以添加预约逻辑
    alert('预约功能开发中，敬请期待！');
}

// 支付功能
function processPayment(amount) {
    console.log('处理支付:', amount);
    // 这里可以添加支付逻辑
    alert('支付功能开发中，敬请期待！');
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('JavaScript错误:', e.error);
});

// 注册表单提交事件监听（针对index.html）
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('user-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleUserRegister);
    }

    // 添加实时验证功能
    const usernameInput = document.getElementById('reg-username');
    const phoneInput = document.getElementById('reg-phone');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            validateUsername(this.value.trim());
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            validatePhone(this.value.trim());
        });
    }

    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this.value.trim());
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            validatePassword(this.value);
        });
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput && confirmPasswordInput.value) {
                validateConfirmPassword(this.value, confirmPasswordInput.value);
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            if (passwordInput) {
                validateConfirmPassword(passwordInput.value, this.value);
            }
        });
    }
});

// 导出主要函数供其他页面使用
window.SmartParking = {
    showAdminLogin,
    closeAdminLogin,
    showUserRegister,
    closeUserRegister,
    searchParkingLots,
    bookParkingSpot,
    processPayment
};