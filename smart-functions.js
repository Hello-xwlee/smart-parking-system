// ========================================
// 智能停车管理系统 - AI智能功能模块
// 任务1：智能车位分配功能
// ========================================

// 生成模拟车位数据
function generateMockSpots() {
    const spots = [];
    const areas = ['A区', 'B区', 'C区', 'D区'];
    const floors = [1, 2, 3];
    const basePrice = 5;

    for (let i = 0; i < 50; i++) {
        const floorIndex = Math.floor(Math.random() * floors.length);
        const areaIndex = Math.floor(Math.random() * areas.length);
        const floor = floors[floorIndex];
        const area = areas[areaIndex];

        spots.push({
            id: `SP${String(i + 1).padStart(3, '0')}`,
            floor: floor,
            area: area,
            location: `${floor}楼${area}-${String(i % 20 + 1).padStart(2, '0')}`,
            length: 5 + Math.random() * 1,
            width: 2 + Math.random() * 0.5,
            distanceToEntrance: Math.floor(20 + Math.random() * 180), // 20-200米
            price: basePrice + (Math.random() > 0.7 ? 2 : 0) + (floor > 1 ? 1 : 0), // 楼层加价
            occupied: Math.random() > 0.65, // 35%占用率
            areaOccupancy: {
                name: area,
                occupiedSpots: Math.floor(Math.random() * 15),
                totalSpots: 15
            }
        });
    }

    return spots.filter(spot => !spot.occupied);
}

// 智能车位推荐算法（核心功能）
function intelligentParkingAllocation(vehicle, userPreferences, availableSpots) {
    const scoredSpots = availableSpots.map(spot => {
        let score = 0;
        let reasons = [];

        // 1. 距离入口评分（满分30分）
        const distanceScore = calculateDistanceScore(spot.distanceToEntrance);
        score += distanceScore;
        if (distanceScore > 20) {
            reasons.push(`距离入口仅${spot.distanceToEntrance}米`);
        }

        // 2. 车位尺寸匹配度（满分25分）
        const sizeScore = calculateSizeMatchScore(vehicle, spot);
        score += sizeScore;
        if (sizeScore > 20) {
            reasons.push('车位尺寸非常适合您的车型');
        }

        // 3. 用户历史偏好（满分20分）
        const preferenceScore = calculatePreferenceScore(spot, userPreferences);
        score += preferenceScore;
        if (preferenceScore > 15) {
            reasons.push('符合您的历史停车习惯');
        }

        // 4. 区域负载（满分15分）
        const loadScore = calculateLoadScore(spot.area);
        score += loadScore;
        if (loadScore > 10) {
            reasons.push('该区域当前车流较少');
        }

        // 5. 价格因素（满分10分）
        const priceScore = calculatePriceScore(spot.price, userPreferences);
        score += priceScore;
        if (priceScore > 7) {
            reasons.push('价格相对优惠');
        }

        return {
            spotId: spot.id,
            location: spot.location,
            floor: spot.floor,
            area: spot.area,
            score: Math.round(score),
            scoreDetails: {
                distance: distanceScore,
                size: sizeScore,
                preference: preferenceScore,
                load: loadScore,
                price: priceScore
            },
            reasons: reasons,
            price: spot.price,
            distance: spot.distanceToEntrance,
            dimensions: `${spot.length.toFixed(1)}m × ${spot.width.toFixed(1)}m`
        };
    });

    // 按评分排序，返回前3个
    return scoredSpots
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((spot, index) => ({
            ...spot,
            rank: index + 1,
            recommendation: index === 0 ? '强烈推荐' : index === 1 ? '推荐' : '备选'
        }));
}

// 距离评分（满分30）
function calculateDistanceScore(distance) {
    if (distance <= 20) return 30;
    if (distance <= 50) return 25;
    if (distance <= 100) return 20;
    if (distance <= 150) return 15;
    return 10;
}

// 尺寸匹配评分（满分25）
function calculateSizeMatchScore(vehicle, spot) {
    const vehicleArea = vehicle.length * vehicle.width;
    const spotArea = spot.length * spot.width;
    const utilizationRate = vehicleArea / spotArea;

    // 最优利用率：70%-85%
    if (utilizationRate >= 0.7 && utilizationRate <= 0.85) return 25;
    if (utilizationRate >= 0.6 && utilizationRate < 0.7) return 20;
    if (utilizationRate >= 0.5 && utilizationRate < 0.6) return 15;
    if (utilizationRate > 0.85 && utilizationRate <= 0.95) return 10;
    return 5; // 空间过大或过小
}

// 用户偏好评分（满分20）
function calculatePreferenceScore(spot, preferences) {
    let score = 10; // 基础分

    // 根据用户偏好调整
    if (preferences.priority === 'distance') {
        if (spot.distance <= 50) score += 10;
        else if (spot.distance <= 100) score += 7;
        else score += 3;
    } else if (preferences.priority === 'price') {
        if (spot.price <= 5) score += 10;
        else if (spot.price <= 7) score += 7;
        else score += 3;
    } else { // balanced
        const distanceScore = spot.distance <= 100 ? 5 : 3;
        const priceScore = spot.price <= 7 ? 5 : 3;
        score += distanceScore + priceScore;
    }

    return Math.min(score, 20);
}

// 区域负载评分（满分15）
function calculateLoadScore(area) {
    const occupancyRate = Math.random(); // 模拟区域占用率
    if (occupancyRate < 0.3) return 15; // 空闲
    if (occupancyRate < 0.6) return 10; // 正常
    if (occupancyRate < 0.8) return 5;  // 较忙
    return 0; // 拥挤
}

// 价格评分（满分10）
function calculatePriceScore(price, preferences) {
    // 价格优先时权重加倍
    if (preferences.priority === 'price') {
        if (price <= 4) return 20;
        if (price <= 6) return 15;
        if (price <= 8) return 10;
        return 5;
    }

    // 常规评分
    if (price <= 4) return 10;
    if (price <= 6) return 7;
    if (price <= 8) return 4;
    return 0;
}

// 初始化智能推荐页面
function initializeSmartAllocation() {
    if (!document.getElementById('recommendBtn')) return;

    // 车型选择变化时自动填充尺寸
    document.getElementById('vehicleType').addEventListener('change', function() {
        const type = this.value;
        const dimensions = {
            sedan: { length: 4.5, width: 1.8 },
            suv: { length: 5.0, width: 2.0 },
            mpv: { length: 5.2, width: 2.2 },
            compact: { length: 4.0, width: 1.7 }
        };

        const dim = dimensions[type];
        document.getElementById('customLength').value = dim.length;
        document.getElementById('customWidth').value = dim.width;
    });

    // 推荐按钮点击事件
    document.getElementById('recommendBtn').addEventListener('click', function() {
        handleRecommendation();
    });

    // 清空按钮
    document.getElementById('clearBtn').addEventListener('click', function() {
        clearForm();
    });

    // 弹窗关闭
    const modal = document.getElementById('scoreModal');
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 处理推荐逻辑
function handleRecommendation() {
    const loadingState = document.getElementById('loadingState');
    const initialState = document.getElementById('initialState');
    const resultsContainer = document.getElementById('resultsContainer');

    // 获取车辆信息
    const vehicleType = document.getElementById('vehicleType').value;
    const customLength = parseFloat(document.getElementById('customLength').value);
    const customWidth = parseFloat(document.getElementById('customWidth').value);

    if (!customLength || !customWidth || customLength <= 0 || customWidth <= 0) {
        alert('请填写有效的车辆尺寸！');
        return;
    }

    const vehicle = {
        type: vehicleType,
        length: customLength,
        width: customWidth
    };

    // 获取用户偏好
    const preference = document.querySelector('input[name="preference"]:checked').value;
    const userPreferences = {
        priority: preference,
        favoriteFloors: [1, 2], // 模拟
        favoriteAreas: ['A区', 'B区'] // 模拟
    };

    // 显示加载状态
    initialState.style.display = 'none';
    loadingState.style.display = 'block';

    // 模拟异步处理
    setTimeout(() => {
        const availableSpots = generateMockSpots();
        const recommendations = intelligentParkingAllocation(vehicle, userPreferences, availableSpots);

        loadingState.style.display = 'none';
        displayRecommendations(recommendations, vehicle, userPreferences);
    }, 1500);
}

// 显示推荐结果
function displayRecommendations(recommendations, vehicle, userPreferences) {
    const resultsContainer = document.getElementById('resultsContainer');

    // 清空现有内容
    resultsContainer.innerHTML = '';

    // 标题
    const titleSection = document.createElement('div');
    titleSection.className = 'mb-6';
    titleSection.innerHTML = `
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">🎯 为您推荐的车位</h2>
        <p class="text-gray-600">基于您的车辆信息智能分析，为您推荐以下三个最优车位</p>
    `;
    resultsContainer.appendChild(titleSection);

    // 生成每个推荐卡片
    recommendations.forEach((spot, index) => {
        const card = createRecommendationCard(spot, vehicle, userPreferences);
        resultsContainer.appendChild(card);
    });

    // 添加动画
    anime({
        targets: '.fade-in',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: anime.stagger(300),
        easing: 'easeOutQuad'
    });
}

// 创建推荐卡片
function createRecommendationCard(spot, vehicle, userPreferences) {
    const card = document.createElement('div');
    card.className = `fade-in rounded-lg p-6 ${spot.rank === 1 ? 'rank-1' : spot.rank === 2 ? 'rank-2' : 'rank-3'}`;

    const rankIcon = spot.rank === 1 ? '👑' : spot.rank === 2 ? '🥈' : '🥉';
    const rankName = spot.rank === 1 ? '金牌推荐' : spot.rank === 2 ? '银牌推荐' : '铜牌推荐';

    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <div class="text-3xl mr-3">${rankIcon}</div>
                <div>
                    <h3 class="text-xl font-semibold text-white">${rankName}</h3>
                    <p class="text-white opacity-90 text-sm">${spot.recommendation}</p>
                </div>
            </div>
            <div class="text-right">
                <div class="text-3xl font-bold text-white">${spot.score}</div>
                <div class="text-white opacity-90 text-sm">综合评分</div>
            </div>
        </div>

        <div class="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-white">
                <div class="flex items-center">
                    <span class="mr-2">📍</span>
                    <span>位置: ${spot.location}</span>
                </div>
                <div class="flex items-center">
                    <span class="mr-2">🏷️</span>
                    <span>编号: ${spot.spotId}</span>
                </div>
                <div class="flex items-center">
                    <span class="mr-2">📏</span>
                    <span>尺寸: ${spot.dimensions}</span>
                </div>
                <div class="flex items-center">
                    <span class="mr-2">💰</span>
                    <span>价格: ¥${spot.price}/小时</span>
                </div>
            </div>
        </div>

        <div class="mb-4">
            <h4 class="text-white font-medium mb-2">🎯 推荐理由:</h4>
            <ul class="space-y-1">
                ${spot.reasons.map(reason => `
                    <li class="text-white text-sm opacity-90 flex items-center">
                        <span class="mr-2">✓</span>
                        ${reason}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="space-y-2 mb-4">
            <h4 class="text-white font-medium">📊 评分详情:</h4>
            ${createProgressBar('距离评分', spot.scoreDetails.distance, 30)}
            ${createProgressBar('尺寸匹配', spot.scoreDetails.size, 25)}
            ${createProgressBar('用户偏好', spot.scoreDetails.preference, 20)}
            ${createProgressBar('区域负载', spot.scoreDetails.load, 15)}
            ${createProgressBar('价格因素', spot.scoreDetails.price, 10)}
        </div>

        <div class="flex space-x-3">
            <button onclick="selectSpot('${spot.spotId}', '${spot.location}')" class="flex-1 bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                ✅ 选择此车位
            </button>
            <button onclick="showScoreDetails('${spot.spotId}', ${JSON.stringify(spot.scoreDetails).replace(/"/g, '&quot;')})" class="bg-blue-200 text-blue-800 py-2 px-4 rounded-lg font-medium hover:bg-blue-300 transition-colors">
                📊 评分详情
            </button>
        </div>
    `;

    return card;
}

function createProgressBar(label, score, max) {
    const percentage = (score / max) * 100;
    return `
        <div class="space-y-1">
            <div class="flex justify-between text-white text-sm">
                <span>${label}</span>
                <span>${score}/${max}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill bg-white" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

function selectSpot(spotId, location) {
    alert(`已选择车位 ${spotId}！即将跳转到预约页面...`);
    sessionStorage.setItem('selectedSpot', JSON.stringify({ id: spotId, location }));
    window.location.href = 'booking.html';
}

function showScoreDetails(spotId, scoreDetails) {
    const modal = document.getElementById('scoreModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h4 class="text-xl font-semibold mb-4">车位 ${spotId} 评分详情</h4>
        <div class="space-y-4">
            <div class="bg-gray-100 p-4 rounded-lg">
                <h5 class="font-medium mb-2">📍 距离评分 (${scoreDetails.distance}/30)</h5>
                <p class="text-sm text-gray-600">根据车位到入口的距离评分，距离越近评分越高</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg">
                <h5 class="font-medium mb-2">📏 尺寸匹配 (${scoreDetails.size}/25)</h5>
                <p class="text-sm text-gray-600">根据车位尺寸与车辆尺寸的匹配程度评分</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg">
                <h5 class="font-medium mb-2">⭐ 用户偏好 (${scoreDetails.preference}/20)</h5>
                <p class="text-sm text-gray-600">根据您的历史停车习惯和当前偏好设置评分</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg">
                <h5 class="font-medium mb-2">📊 区域负载 (${scoreDetails.load}/15)</h5>
                <p class="text-sm text-gray-600">根据当前区域的车流情况评分，车流越少评分越高</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg">
                <h5 class="font-medium mb-2">💰 价格因素 (${scoreDetails.price}/10)</h5>
                <p class="text-sm text-gray-600">根据车位价格相对于周边车位的价格优势评分</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // 添加弹窗动画
    anime({
        targets: '.modal-content',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
}

function clearForm() {
    document.getElementById('vehicleType').value = 'sedan';
    document.getElementById('customLength').value = '4.5';
    document.getElementById('customWidth').value = '1.8';
    document.querySelector('input[name="preference"][value="distance"]').checked = true;

    // 重置结果区域
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div id="initialState" class="text-center py-16">
            <div class="text-6xl mb-4">🚗</div>
            <h3 class="text-2xl font-medium text-gray-700 mb-2">欢迎使用智能推荐</h3>
            <p class="text-gray-600">请在左侧填写车辆信息和偏好设置<br>点击"开始智能推荐"获取最适合您的车位</p>
        </div>
    `;
}


// ==========================================
// 2. 智能动态定价系统
// ==========================================

// 生成模拟停车场数据
function generateMockParkingLots() {
    const lots = [];
    const names = ['机电学馆停车场', '建筑学馆停车场', '大成停车场', '采矿学馆停车场', '逸夫停车场', '冶金学馆停车场'];
    const districts = ['朝阳区', '和平区', '和平区', '东城区', '丰台区', '石景山区'];

    for (let i = 0; i < 50; i++) {
        const basePrice = 5 + Math.random() * 3;
        const totalSpots = 100 + Math.floor(Math.random() * 200);
        const occupiedSpots = Math.floor(Math.random() * totalSpots * 0.9);

        lots.push({
            id: `P${String(i + 1).padStart(3, '0')}`,
            name: `${names[Math.floor(Math.random() * names.length)]}${i + 1}`,
            district: districts[Math.floor(Math.random() * districts.length)],
            address: `某某路${Math.floor(Math.random() * 1000) + 1}号`,
            totalSpots: totalSpots,
            occupiedSpots: occupiedSpots,
            basePrice: Math.round(basePrice * 10) / 10,
            rating: 3.5 + Math.random() * 1.5,
            distance: Math.floor(Math.random() * 50) + 1 // 1-50公里
        });
    }

    return lots;
}

/**
 * 智能动态定价算法（核心功能）
 * 根据多种因素实时计算停车价格
 * @param {Object} parkingLot - 停车场信息
 * @param {Date} targetTime - 目标时间
 * @param {Number} duration - 停车时长（小时）
 * @returns {Object} 价格信息和计算明细
 */
function calculateDynamicPrice(parkingLot, targetTime, duration = 2) {
    const basePrice = parkingLot.basePrice || 5;
    let finalPrice = basePrice;
    const priceFactors = [];

    // 1. 占用率系数
    const occupancyRate = parkingLot.occupiedSpots / parkingLot.totalSpots;
    let occupancyMultiplier = 1.0;

    if (occupancyRate < 0.3) {
        occupancyMultiplier = 0.7; // 空闲，7折吸引客流
        priceFactors.push({ factor: '低占用率优惠', multiplier: 0.7, description: `占用率仅${(occupancyRate * 100).toFixed(1)}%，车位充足` });
    } else if (occupancyRate > 0.9) {
        occupancyMultiplier = 2.0; // 接近饱和，大幅提价
        priceFactors.push({ factor: '车位紧缺', multiplier: 2.0, description: `占用率达${(occupancyRate * 100).toFixed(1)}%，仅剩少量车位` });
    } else if (occupancyRate > 0.8) {
        occupancyMultiplier = 1.5; // 拥挤，提价分流
        priceFactors.push({ factor: '高峰期加价', multiplier: 1.5, description: `占用率${(occupancyRate * 100).toFixed(1)}%，车位紧张` });
    } else if (occupancyRate > 0.6) {
        occupancyMultiplier = 1.2; // 较忙
        priceFactors.push({ factor: '车流较多', multiplier: 1.2, description: `占用率${(occupancyRate * 100).toFixed(1)}%` });
    }

    // 2. 时段系数
    const hour = targetTime.getHours();
    let timeMultiplier = 1.0;

    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 19)) {
        timeMultiplier = 1.5; // 上下班高峰期
        priceFactors.push({ factor: '高峰时段', multiplier: 1.5, description: '通勤高峰期（8-10点，17-19点）' });
    } else if (hour >= 22 || hour < 6) {
        timeMultiplier = 0.7; // 夜间低谷
        priceFactors.push({ factor: '夜间优惠', multiplier: 0.7, description: '深夜时段（22-6点）' });
    } else if (hour >= 10 && hour < 14) {
        timeMultiplier = 1.2; // 午间小高峰
        priceFactors.push({ factor: '午间时段', multiplier: 1.2, description: '中午就餐时段（10-14点）' });
    }

    // 3. 星期系数
    const dayOfWeek = targetTime.getDay();
    let weekdayMultiplier = 1.0;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekdayMultiplier = 1.3; // 周末
        priceFactors.push({ factor: '周末加价', multiplier: 1.3, description: '休息日出行高峰' });
    }

    // 4. 节假日系数
    const isHoliday = checkIfHoliday(targetTime);
    if (isHoliday) {
        priceFactors.push({ factor: '节假日加价', multiplier: 1.5, description: '法定节假日，出行需求增加' });
    }

    // 5. 天气系数（模拟）
    const weatherFactor = getWeatherFactor();
    if (weatherFactor.multiplier !== 1.0) {
        priceFactors.push(weatherFactor);
    }

    // 6. 时长折扣
    let durationDiscount = 1.0;
    if (duration >= 3 && duration < 6) {
        durationDiscount = 0.95;
        priceFactors.push({ factor: '时长优惠', multiplier: 0.95, description: '停车3小时以上，享95折' });
    } else if (duration >= 6) {
        durationDiscount = 0.9;
        priceFactors.push({ factor: '长时优惠', multiplier: 0.9, description: '停车6小时以上，享9折' });
    }

    // 计算最终价格
    finalPrice = basePrice * occupancyMultiplier * timeMultiplier *
                 weekdayMultiplier * (isHoliday ? 1.5 : 1.0) * weatherFactor.multiplier;

    const totalPrice = (finalPrice * duration * durationDiscount).toFixed(2);
    const originalPrice = (basePrice * duration).toFixed(2);
    const savings = (originalPrice - totalPrice).toFixed(2);

    // 生成省钱建议
    const recommendations = generateSavingsRecommendations(targetTime, occupancyRate, finalPrice, basePrice);

    return {
        basePrice: basePrice.toFixed(2),
        hourlyRate: finalPrice.toFixed(2),
        totalPrice: totalPrice,
        duration: duration,
        originalPrice: originalPrice,
        savings: savings > 0 ? savings : 0,
        priceFactors: priceFactors,
        recommendations: recommendations
    };
}

// 判断是否为节假日
function checkIfHoliday(date) {
    const holidays = [
        '2025-01-01', // 元旦
        '2025-02-01', '2025-02-02', '2025-02-03', // 春节
        '2025-04-05', // 清明
        '2025-05-01', // 劳动节
        '2025-10-01', '2025-10-02', '2025-10-03' // 国庆
    ];
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
}

// 获取天气系数（模拟）
function getWeatherFactor() {
    const weather = Math.random();
    if (weather < 0.15) {
        return { factor: '雨天', multiplier: 1.2, description: '降雨天气，室内停车需求增加' };
    } else if (weather < 0.25) {
        return { factor: '高温', multiplier: 1.1, description: '高温天气（>35°C），室内停车需求增加' };
    }
    return { factor: '正常天气', multiplier: 1.0, description: '天气良好' };
}

// 生成省钱建议
function generateSavingsRecommendations(targetTime, occupancyRate, currentPrice, basePrice) {
    const recommendations = [];
    const hour = targetTime.getHours();
    const dayOfWeek = targetTime.getDay();

    // 检查是否高峰时段
    const isPeakHour = (hour >= 8 && hour < 10) || (hour >= 17 && hour < 19);
    if (isPeakHour) {
        // 建议错峰停车
        const offPeakHours = [11, 12, 13, 14, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
        const suggestedHour = offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
        const potentialSavings = ((currentPrice - basePrice * 0.7) * 2).toFixed(2);

        recommendations.push({
            type: 'time',
            title: '错峰停车可省钱',
            description: `当前${hour}:00是高峰时段，建议${suggestedHour}:00后停车`,
            potentialSavings: potentialSavings
        });
    }

    // 如果占用率高，建议其他停车场
    if (occupancyRate > 0.8) {
        recommendations.push({
            type: 'location',
            title: '周边停车场更优惠',
            description: '当前停车场车位紧张，建议查看附近其他停车场',
            potentialSavings: Math.floor(Math.random() * 10 + 5).toString()
        });
    }

    // 如果周末，建议工作日
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        recommendations.push({
            type: 'day',
            title: '工作日停车更便宜',
            description: '周末价格上浮30%，建议工作日出行',
            potentialSavings: ((currentPrice * 0.3) * 2).toFixed(2)
        });
    }

    return recommendations.slice(0, 2); // 最多返回2条建议
}

// 生成24小时价格趋势数据
function generatePriceTrend(parkingLot) {
    const trend = [];
    const now = new Date();

    for (let hour = 0; hour < 24; hour++) {
        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
        const priceInfo = calculateDynamicPrice(parkingLot, time, 2);

        trend.push({
            hour: hour,
            time: `${hour.toString().padStart(2, '0')}:00`,
            price: parseFloat(priceInfo.hourlyRate),
            isPeak: priceInfo.priceFactors.some(f => f.factor === '高峰时段'),
            isOffPeak: priceInfo.priceFactors.some(f => f.factor === '夜间优惠')
        });
    }

    return trend;
}

// 初始化动态定价功能
function initializePricing() {
    if (!document.getElementById('dynamic-price-chart')) return;

    // 绑定事件监听器
    const parkingSelect = document.getElementById('parking-lot-select');
    const timeSelect = document.getElementById('time-select');
    const durationSelect = document.getElementById('duration-select');

    if (parkingSelect) {
        parkingSelect.addEventListener('change', updatePriceChart);
    }
    if (timeSelect) {
        timeSelect.addEventListener('change', updatePriceChart);
    }
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePriceChart);
    }

    // 初始化图表
    updatePriceChart();
}

// 更新价格图表
function updatePriceChart() {
    const parkingId = document.getElementById('parking-lot-select')?.value || 'P001';
    const selectedTime = document.getElementById('time-select')?.value || new Date().toISOString().slice(0, 16);
    const duration = parseInt(document.getElementById('duration-select')?.value) || 2;

    // 获取停车场数据
    const parkingLot = mockParkingLots.find(lot => lot.id === parkingId) || mockParkingLots[0];

    // 更新时间显示
    const targetTime = new Date(selectedTime);
    const priceInfo = calculateDynamicPrice(parkingLot, targetTime, duration);

    // 显示当前价格信息
    displayCurrentPrice(priceInfo, parkingLot);

    // 生成并显示趋势图
    const trendData = generatePriceTrend(parkingLot);
    displayPriceChart(trendData, targetTime.getHours());
}

// 显示当前价格信息
function displayCurrentPrice(priceInfo, parkingLot) {
    const container = document.getElementById('current-price-info');
    if (!container) return;

    const basePrice = parseFloat(priceInfo.basePrice);
    const currentPrice = parseFloat(priceInfo.hourlyRate);
    const priceChange = (((currentPrice - basePrice) / basePrice) * 100).toFixed(1);

    container.innerHTML = `
        <div class="bg-blue-50 p-6 rounded-lg mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">基础价格</div>
                    <div class="text-2xl font-bold text-gray-800">¥${priceInfo.basePrice}</div>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">当前价格</div>
                    <div class="text-3xl font-bold ${priceChange > 0 ? 'text-red-600' : 'text-green-600'}">¥${priceInfo.hourlyRate}</div>
                    <div class="text-sm ${priceChange > 0 ? 'text-red-600' : 'text-green-600'}">
                        ${priceChange > 0 ? '↑' : '↓'} ${Math.abs(priceChange)}%
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">总费用估算</div>
                    <div class="text-2xl font-bold text-blue-600">¥${priceInfo.totalPrice}</div>
                    ${priceInfo.savings > 0 ? `<div class="text-sm text-green-600">已优惠 ¥${priceInfo.savings}</div>` : ''}
                </div>
            </div>
        </div>
        <div class="bg-white p-6 rounded-lg">
            <h4 class="text-lg font-semibold mb-4">价格影响因素</h4>
            <div class="space-y-3">
                ${priceInfo.priceFactors.map(factor => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full ${factor.multiplier > 1 ? 'bg-red-500' : 'bg-green-500'} mr-3"></span>
                            <span class="font-medium">${factor.factor}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-gray-600">${factor.multiplier > 1 ? '+' : ''}${((factor.multiplier - 1) * 100).toFixed(0)}%</div>
                            <div class="text-xs text-gray-500">${factor.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ${priceInfo.recommendations.length > 0 ? `
        <div class="bg-yellow-50 p-6 rounded-lg mt-6">
            <h4 class="text-lg font-semibold mb-4">💡 省钱建议</h4>
            <div class="space-y-3">
                ${priceInfo.recommendations.map(rec => `
                    <div class="flex items-start p-3 bg-white rounded">
                        <div class="text-2xl mr-3">${rec.type === 'time' ? '⏰' : rec.type === 'day' ? '📅' : '📍'}</div>
                        <div class="flex-1">
                            <div class="font-medium">${rec.title}</div>
                            <div class="text-sm text-gray-600">${rec.description}</div>
                        </div>
                        <div class="text-green-600 font-bold">省¥${rec.potentialSavings}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

// 显示价格趋势图
function displayPriceChart(trendData, currentHour) {
    const chartContainer = document.getElementById('dynamic-price-chart');
    if (!chartContainer) return;

    const chart = echarts.init(chartContainer);

    const option = {
        title: {
            text: '24小时价格趋势',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                const data = params[0];
                const trendItem = trendData[data.dataIndex];
                const type = trendItem.isPeak ? '⚠️ 高峰时段' : trendItem.isOffPeak ? '🌙 优惠时段' : '⏰ 普通时段';
                return `${data.name}<br/>${type}<br/>价格: ¥${data.value}`;
            }
        },
        xAxis: {
            type: 'category',
            data: trendData.map(item => item.time),
            axisLabel: {
                interval: 1,
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '价格 (元/小时)',
            min: function(value) {
                return (value.min * 0.9).toFixed(2);
            }
        },
        series: [{
            name: '价格',
            type: 'line',
            data: trendData.map(item => item.price),
            smooth: true,
            itemStyle: {
                color: '#3b82f6'
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
                    ]
                }
            },
            markPoint: {
                data: [
                    { type: 'max', name: '最高价' },
                    { type: 'min', name: '最低价' },
                    {
                        name: '当前时间',
                        value: trendData[currentHour]?.price,
                        xAxis: currentHour,
                        yAxis: trendData[currentHour]?.price,
                        itemStyle: {
                            color: '#ef4444'
                        }
                    }
                ]
            },
            markLine: {
                data: [
                    { type: 'average', name: '平均价格' }
                ],
                lineStyle: {
                    color: '#10b981',
                    type: 'dashed'
                }
            }
        }],
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        }
    };

    chart.setOption(option);

    // 响应式
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

// 在页面加载完成后初始化
let mockParkingLots = [];

document.addEventListener('DOMContentLoaded', function() {
    // 生成模拟数据
    mockParkingLots = generateMockParkingLots();

    // 初始化定价功能
    initializePricing();

    // 每10秒更新一次数据
    setInterval(() => {
        // 随机更新占用率
        mockParkingLots.forEach(lot => {
            const change = Math.floor(Math.random() * 5) - 2;
            lot.occupiedSpots = Math.max(0, Math.min(lot.totalSpots, lot.occupiedSpots + change));
        });

        // 如果有图表显示，更新它
        if (document.getElementById('dynamic-price-chart') && document.getElementById('dynamic-price-chart').style.display !== 'none') {
            updatePriceChart();
        }
    }, 10000);
});
