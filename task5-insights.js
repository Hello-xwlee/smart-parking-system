// ==========================================
// 5. 智能数据分析与决策建议系统
// ==========================================

/**
 * 生成智能经营建议（核心功能）
 * 为管理员提供数据洞察和优化建议
 * @param {Object} parkingLotData - 停车场运营数据
 * @returns {Array} - 建议列表（最多5条）
 */
function generateBusinessInsights(parkingLotData) {
    const insights = [];

    // 分析1：车位利用率
    const utilizationInsight = analyzeUtilization(parkingLotData);
    if (utilizationInsight) insights.push(utilizationInsight);

    // 分析2：收入优化
    const revenueInsight = analyzeRevenue(parkingLotData);
    if (revenueInsight) insights.push(revenueInsight);

    // 分析3：高峰预测
    const peakInsight = predictPeakHours(parkingLotData);
    if (peakInsight) insights.push(peakInsight);

    // 分析4：用户行为
    const behaviorInsight = analyzeUserBehavior(parkingLotData);
    if (behaviorInsight) insights.push(behaviorInsight);

    // 分析5：设备异常
    const deviceInsight = analyzeDeviceStatus(parkingLotData);
    if (deviceInsight) insights.push(deviceInsight);

    // 按优先级排序
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return insights
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 5);
}

/**
 * 分析车位利用率
 */
function analyzeUtilization(data) {
    // 模拟数据分析
    const areas = data.areas || generateAreaData();
    const lowUtilizationAreas = areas.filter(area => area.occupancyRate < 0.4);

    if (lowUtilizationAreas.length > 0) {
        const area = lowUtilizationAreas[0];
        return {
            type: 'warning',
            priority: 'high',
            title: '⚠️ 车位利用率偏低',
            description: `${area.name}当前利用率仅${(area.occupancyRate * 100).toFixed(1)}%，存在资源浪费`,
            metrics: {
                currentRate: (area.occupancyRate * 100).toFixed(1) + '%',
                targetRate: '70%',
                availableSpots: (area.totalSpots - area.occupiedSpots) + '个',
                potentialRevenue: Math.floor((area.totalSpots - area.occupiedSpots) * 8) + '元/天'
            },
            suggestions: [
                '🎯 降低该区域停车价格20%吸引车流',
                '📢 在APP首页推荐该区域作为优选停车点',
                '🎫 发放该区域专属优惠券，有效期7天',
                '🚗 优化导航引导，将部分车流分流至此'
            ],
            expectedImpact: '预计可提升利用率25-35%，增收约2,800元/天',
            applyAction: () => applyPriceReduction(area.id, 0.8)
        };
    }

    return null;
}

/**
 * 收入优化分析
 */
function analyzeRevenue(data) {
    const currentRevenue = data.dailyRevenue || 45000;
    const potentialRevenue = calculatePotentialRevenue(data);
    const gap = potentialRevenue - currentRevenue;

    if (gap > currentRevenue * 0.15) { // 如果有超过15%的增收潜力
        return {
            type: 'success',
            priority: 'high',
            title: '💰 收入优化机会',
            description: `通过智能定价策略，预计每日可增加收入${(gap / 1000).toFixed(1)}千元`,
            metrics: {
                currentRevenue: (currentRevenue / 1000).toFixed(1) + '千元/天',
                potentialRevenue: (potentialRevenue / 1000).toFixed(1) + '千元/天',
                increaseAmount: (gap / 1000).toFixed(1) + '千元',
                increaseRate: ((gap / currentRevenue) * 100).toFixed(1) + '%'
            },
            suggestions: [
                '📈 在高峰时段（8-10点，17-19点）自动提价30%',
                '🌙 在夜间低谷时段（22-6点）降价30%，吸引过夜停车',
                '⏰ 针对长时停车（超过6小时），提供累进折扣，鼓励长时间停留',
                '📊 实时监控占用率，动态调整价格策略'
            ],
            expectedImpact: `月收入可增加约${(gap * 30 / 10000).toFixed(1)}万元，年增收${(gap * 365 / 10000).toFixed(1)}万元`,
            applyAction: () => enableDynamicPricing()
        };
    }

    return null;
}

/**
 * 计算潜在收入
 */
function calculatePotentialRevenue(data) {
    return (data.dailyRevenue || 45000) * 1.25; // 假设优化后可提升25%
}

/**
 * 高峰时段预测
 */
function predictPeakHours(data) {
    const currentHour = new Date().getHours();
    const historyData = data.history || generateHistoryData();

    // 基于历史数据预测明天的高峰时段
    const tomorrowPrediction = {
        morningPeak: { time: '08:00-09:30', probability: 0.92, reason: '上班高峰期，通勤车辆集中到达' },
        eveningPeak: { time: '17:30-19:00', probability: 0.95, reason: '下班高峰期，商场购物车流增加' },
        lunchPeak: { time: '11:30-13:00', probability: 0.68, reason: '午餐时段，周边办公楼员工就餐' }
    };

    // 判断当前时段是否接近高峰
    const nextPeak = getNextPeak(currentHour, tomorrowPrediction);

    return {
        type: 'info',
        priority: 'medium',
        title: '📊 明日高峰时段预测',
        description: `预计明日${nextPeak.time}将出现车流高峰，需提前做好运营准备`,
        metrics: {
            predictedTime: nextPeak.time,
            probability: (nextPeak.probability * 100) + '%',
            predictedOccupancy: '85-95%',
            predictedRevenue: '预计收入' + Math.floor(45000 * 1.2) + '元'
        },
        suggestions: [
            `⚠️ 在${nextPeak.time}前1小时开始动态提价，引导车辆分流`,
            `📢 向APP用户推送错峰停车建议，提供优惠鼓励`,
            '🅿️ 提前开放备用停车区域，增加临时车位100个',
            '👥 增派现场管理人员，确保出入通畅'
        ],
        expectedImpact: '可缓解30%的高峰压力，提升用户体验',
        applyAction: () => schedulePeakPreparation(nextPeak.time)
    };
}

/**
 * 获取下一个高峰
 */
function getNextPeak(currentHour, predictions) {
    const peaks = [
        { ...predictions.morningPeak, key: 'morning', startHour: 8 },
        { ...predictions.lunchPeak, key: 'lunch', startHour: 11 },
        { ...predictions.eveningPeak, key: 'evening', startHour: 17 }
    ];

    return peaks.reduce((nearest, peak) => {
        return (peak.startHour > currentHour && peak.startHour < nearest.startHour) ? peak : nearest;
    }, peaks[0]);
}

/**
 * 用户行为分析
 */
function analyzeUserBehavior(data) {
    const avgDuration = data.avgDuration || 2.5;
    const shortTermRatio = data.shortTermRatio || 0.4;

    // 检查短时停车比例
    if (shortTermRatio > 0.5) {
        return {
            type: 'info',
            priority: 'low',
            title: '👥 短时停车占比较高',
            description: `平均停车时长${avgDuration.toFixed(1)}小时，${(shortTermRatio * 100).toFixed(0)}%的用户停留1小时以内`,
            metrics: {
                avgDuration: avgDuration.toFixed(1) + '小时',
                shortTermRatio: (shortTermRatio * 100).toFixed(0) + '%',
                quickTurnoverRate: '45分钟以内占' + (shortTermRatio * 0.6 * 100).toFixed(0) + '%'
            },
            suggestions: [
                '🎯 优化计费策略：前30分钟免费，提升短时用户体验',
                '🅿️ 设置"快速停车区"，靠近出入口，方便短时停车',
                '📱 推广预约服务，减少入口等待时间',
                '♻️ 提高车位周转率，增加日接待车辆数'
            ],
            expectedImpact: '可提升用户满意度15%，增加日收入8-12%',
            applyAction: () => optimizeShortTermParking()
        };
    }

    // 检查长时停车潜力
    if (avgDuration > 4) {
        return {
            type: 'info',
            priority: 'low',
            title: '📈 长时停车用户增多',
            description: `平均停车时长达到${avgDuration.toFixed(1)}小时，长时停车需求增长`,
            metrics: {
                avgDuration: avgDuration.toFixed(1) + '小时',
                longTermRatio: ((1 - shortTermRatio) * 100).toFixed(0) + '%',
                loyalCustomers: '15%用户月停车超过10次'
            },
            suggestions: [
                '🎫 推出月卡、季卡等长期停车套餐',
                '💰 长时停车（超过6小时）享受8折优惠',
                '🅿️ 为长时用户提供预留车位服务',
                '🤝 建立会员体系，提供积分和专属权益'
            ],
            expectedImpact: '可提升用户粘性，稳定收入来源',
            applyAction: () => createLongTermPackages()
        };
    }

    return null;
}

/**
 * 设备状态分析
 */
function analyzeDeviceStatus(data) {
    const devices = data.devices || generateDeviceData();
    const faultyDevices = devices.filter(d => d.status === 'fault');

    if (faultyDevices.length > 0) {
        const criticalDevices = faultyDevices.filter(d => d.criticalLevel === 'high');

        return {
            type: 'error',
            priority: criticalDevices.length > 0 ? 'urgent' : 'high',
            title: criticalDevices.length > 0 ? '🚨 设备故障警告' : '⚠️ 设备异常提醒',
            description: `检测到${faultyDevices.length}个设备故障，可能影响正常运营`,
            metrics: {
                totalFaulty: faultyDevices.length + '个设备',
                criticalCount: criticalDevices.length + '个关键设备',
                uptime: ((devices.length - faultyDevices.length) / devices.length * 100).toFixed(1) + '%'
            },
            devices: faultyDevices.map(d => ({
                name: d.name,
                location: d.location,
                faultTime: d.faultTime,
                status: d.status,
                criticalLevel: d.criticalLevel || 'medium'
            })),
            suggestions: criticalDevices.length > 0
                ? [
                    '🚨 立即安排维修人员处理关键设备故障',
                    '🔧 启用备用设备或人工替代方案',
                    '📢 通知受影响区域的用户，提供替代方案',
                    '📊 每2小时跟进维修进展，确保及时恢复'
                ]
                : [
                    '📅 安排维护计划在非高峰时段进行维修',
                    '🔍 检查设备日志，分析故障原因',
                    '💾 备份设备配置，准备替换方案'
                ],
            expectedImpact: '尽快修复可避免用户投诉和收入损失',
            applyAction: () => scheduleDeviceMaintenance(faultyDevices)
        };
    }

    return null;
}

// 生成模拟数据
function generateAreaData() {
    return [
        { name: 'A区', totalSpots: 50, occupiedSpots: 15, occupancyRate: 0.3 },
        { name: 'B区', totalSpots: 80, occupiedSpots: 60, occupancyRate: 0.75 },
        { name: 'C区', totalSpots: 60, occupiedSpots: 55, occupancyRate: 0.92 },
        { name: 'D区', totalSpots: 40, occupiedSpots: 38, occupancyRate: 0.95 }
    ];
}

function generateHistoryData() {
    const history = [];
    for (let i = 0; i < 30; i++) {
        history.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            revenue: 40000 + Math.random() * 10000,
            vehicles: 800 + Math.floor(Math.random() * 200),
            occupancyRate: 0.6 + Math.random() * 0.3
        });
    }
    return history;
}

function generateDeviceData() {
    return [
        { name: '入口摄像头01', location: '1楼主入口', status: 'normal', faultTime: null, criticalLevel: 'high' },
        { name: '道闸控制器02', location: '2楼C区', status: 'fault', faultTime: '2025-11-13 14:30', criticalLevel: 'high' },
        { name: '车位传感器03', location: '3楼B区', status: 'fault', faultTime: '2025-11-13 15:45', criticalLevel: 'medium' },
        { name: '显示屏04', location: '1楼电梯口', status: 'normal', faultTime: null, criticalLevel: 'low' }
    ];
}

// 应用建议的操作（模拟）
function applyPriceReduction(areaId, multiplier) {
    alert(`已应用价格调整：${areaId}区域价格调整为${multiplier}倍`);
    return true;
}

function enableDynamicPricing() {
    alert('已启用智能动态定价系统');
    return true;
}

function schedulePeakPreparation(time) {
    alert(`已设置高峰时段准备：${time}`);
    return true;
}

function optimizeShortTermParking() {
    alert('已优化短时停车策略');
    return true;
}

function createLongTermPackages() {
    alert('已创建长时停车套餐');
    return true;
}

function scheduleDeviceMaintenance(devices) {
    alert(`已安排${devices.length}个设备的维护计划`);
    return true;
}

/**
 * 初始化智能建议
 */
function initializeSmartInsights() {
    if (!document.getElementById('smart-insights')) return;

    // 生成模拟运营数据
    const parkingLotData = generateParkingLotData();

    // 生成智能建议
    const insights = generateBusinessInsights(parkingLotData);

    // 显示建议
    displaySmartInsights(insights);

    // 每30秒更新一次
    setInterval(() => {
        updateSmartInsights();
    }, 30000);
}

/**
 * 生成停车场运营数据
 */
function generateParkingLotData() {
    return {
        dailyRevenue: 45000 + Math.random() * 10000,
        avgDuration: 2.5 + Math.random() * 1.5,
        shortTermRatio: 0.3 + Math.random() * 0.4,
        areas: generateAreaData(),
        history: generateHistoryData(),
        devices: generateDeviceData()
    };
}

/**
 * 显示智能建议
 */
function displaySmartInsights(insights) {
    const container = document.getElementById('smart-insights-container');
    if (!container) return;

    if (insights.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 p-8 rounded-lg text-center">
                <div class="text-4xl mb-4">✅</div>
                <h3 class="text-lg font-semibold text-green-800 mb-2">系统运行良好</h3>
                <p class="text-green-700">当前没有发现需要优化的问题，请继续保持！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = insights.map(insight => `
        <div class="insight-card bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 ${getInsightBorderColor(insight.type)}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                    <div class="text-2xl mr-3">${getInsightIcon(insight.type)}</div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${insight.title}</h3>
                        <p class="text-sm text-gray-600">${insight.description}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 text-xs rounded ${getPriorityBadgeClass(insight.priority)}">
                        ${getPriorityText(insight.priority)}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                ${Object.entries(insight.metrics).map(([key, value]) => `
                    <div class="text-center">
                        <div class="text-xs text-gray-500 mb-1">${getMetricLabel(key)}</div>
                        <div class="text-lg font-bold text-gray-800">${value}</div>
                    </div>
                `).join('')}
            </div>

            <div class="mb-4">
                <h4 class="font-medium text-gray-800 mb-2">💡 优化建议：</h4>
                <ul class="list-disc list-inside space-y-1">
                    ${insight.suggestions.map(suggestion => `
                        <li class="text-sm text-gray-700">${suggestion}</li>
                    `).join('')}
                </ul>
            </div>

            <div class="bg-green-50 p-3 rounded mb-4">
                <div class="flex items-center">
                    <span class="text-green-600 mr-2">🎯</span>
                    <span class="text-sm text-green-800"><strong>预期效果：</strong>${insight.expectedImpact}</span>
                </div>
            </div>

            <div class="flex justify-between items-center">
                <div class="text-xs text-gray-500">
                    生成时间：${new Date().toLocaleString()}
                </div>
                <button onclick="applyInsightAction('${insight.title}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm">
                    应用建议
                </button>
            </div>
        </div>
    `).join('');

    // 添加动画
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.insight-card',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });
    }
}

/**
 * 获取建议边框颜色
 */
function getInsightBorderColor(type) {
    const colors = {
        success: 'border-green-500',
        warning: 'border-yellow-500',
        error: 'border-red-500',
        info: 'border-blue-500'
    };
    return colors[type] || 'border-gray-500';
}

/**
 * 获取建议图标
 */
function getInsightIcon(type) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '🚨',
        info: 'ℹ️'
    };
    return icons[type] || '💡';
}

/**
 * 获取优先级徽章样式
 */
function getPriorityBadgeClass(priority) {
    const classes = {
        urgent: 'bg-red-100 text-red-800',
        high: 'bg-orange-100 text-orange-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-blue-100 text-blue-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority) {
    const texts = {
        urgent: '紧急',
        high: '高',
        medium: '中',
        low: '低'
    };
    return texts[priority] || '普通';
}

/**
 * 获取指标标签
 */
function getMetricLabel(key) {
    const labels = {
        currentRate: '当前率',
        targetRate: '目标率',
        gap: '差距',
        potentialRevenue: '潜在收益',
        currentRevenue: '当前收入',
        potentialRevenue: '潜在收入',
        increaseRate: '增长幅度',
        predictedTime: '预测时间',
        probability: '置信度',
        predictedOccupancy: '预计占用率',
        avgDuration: '平均时长',
        shortTermRatio: '短时比例',
        totalFaulty: '故障数',
        criticalCount: '关键故障',
        uptime: '可用率'
    };
    return labels[key] || key;
}

/**
 * 应用建议操作
 */
function applyInsightAction(title) {
    alert(`已执行操作：应用建议 - ${title}`);
}

/**
 * 更新智能建议
 */
function updateSmartInsights() {
    const parkingLotData = generateParkingLotData();
    const insights = generateBusinessInsights(parkingLotData);
    displaySmartInsights(insights);
}

// 导出函数
window.InsightsSystem = {
    generateBusinessInsights,
    analyzeUtilization,
    analyzeRevenue,
    predictPeakHours,
    analyzeUserBehavior,
    analyzeDeviceStatus,
    generateParkingLotData,
    initializeSmartInsights,
    updateSmartInsights
};
