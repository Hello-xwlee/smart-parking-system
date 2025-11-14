// ==========================================
// 3. 智能预约推荐系统
// ==========================================

/**
 * 智能推荐停车场（核心功能）
 * @param {Object} user - 用户信息（含历史行为）
 * @param {Object} destination - 目的地坐标
 * @param {Date} targetTime - 目标时间
 * @returns {Array} - 推荐的停车场列表
 */
function recommendParkingLots(user, destination, targetTime) {
    // 分析用户画像
    const userProfile = analyzeUserProfile(user);

    // 搜索附近停车场（3公里内）
    const nearbyLots = searchNearbyParkingLots(destination, 3000);

    // 为每个停车场计算推荐分数
    const recommendations = nearbyLots.map(lot => {
        let score = 0;
        const reasons = [];

        // 1. 价格偏好匹配（30分）
        const predictedPrice = predictPrice(lot, targetTime);
        if (predictedPrice <= userProfile.avgSpending * 0.8) {
            score += 30;
            reasons.push('价格远低于您的预算');
        } else if (predictedPrice <= userProfile.avgSpending) {
            score += 25;
            reasons.push('价格符合您的预算');
        } else if (predictedPrice <= userProfile.avgSpending * 1.2) {
            score += 15;
            reasons.push('价格略高于预算，但可接受');
        }

        // 2. 距离偏好（25分）
        const distance = calculateDistance(destination, lot.location);
        if (distance <= 100) {
            score += 25;
            reasons.push('距离目的地仅100米以内');
        } else if (distance <= 300) {
            score += 20;
            reasons.push(`距离目的地${distance}米，步行4分钟即可到达`);
        } else if (distance <= 500) {
            score += 15;
            reasons.push('距离适中');
        } else {
            score += 5;
        }

        // 3. 历史偏好（20分）
        if (userProfile.frequentLots.includes(lot.id)) {
            score += 20;
            reasons.push('您经常在此停车，熟悉环境');
        }

        // 4. 车位可用性（15分）
        const availability = lot.totalSpots - lot.occupiedSpots;
        if (availability > 20) {
            score += 15;
            reasons.push('车位充足（剩余' + availability + '个），无需担心没位');
        } else if (availability > 10) {
            score += 10;
            reasons.push('车位较充足（剩余' + availability + '个）');
        } else if (availability > 5) {
            score += 5;
            reasons.push('车位紧张（仅剩' + availability + '个），建议立即预约');
        }

        // 5. 用户评分（10分）
        if (lot.rating >= 4.5) {
            score += 10;
            reasons.push('用户评价优秀（' + lot.rating + '分）');
        } else if (lot.rating >= 4.0) {
            score += 7;
            reasons.push('用户评价良好（' + lot.rating + '分）');
        } else if (lot.rating >= 3.5) {
            score += 5;
        }

        // 6. 额外加分
        if (lot.hasDiscount) {
            score += 5;
            reasons.push('目前有优惠活动');
        }
        if (lot.hasEVCharger && user.preferences?.needsEVCharger) {
            score += 5;
            reasons.push('配备充电桩，适合您的电动车');
        }

        return {
            lotId: lot.id,
            name: lot.name,
            address: lot.address,
            distance: Math.round(distance),
            distanceText: distance > 1000 ? (distance / 1000).toFixed(1) + '公里' : distance + '米',
            predictedPrice: predictedPrice,
            currentPrice: lot.basePrice,
            priceChange: ((predictedPrice - lot.basePrice) / lot.basePrice * 100).toFixed(1),
            priceTrend: predictedPrice > lot.basePrice ? '上涨' : '优惠',
            availableSpots: availability,
            occupancyRate: ((availability / lot.totalSpots) * 100).toFixed(0),
            rating: lot.rating,
            score: score,
            reasons: reasons,
            recommendLevel: score >= 80 ? '⭐⭐⭐ 强烈推荐' : score >= 65 ? '⭐⭐ 推荐' : '⭐ 可选',
            badges: [
                score >= 80 ? '强烈推荐' : score >= 65 ? '推荐' : '可选',
                availability > 20 ? '车位充足' : availability > 10 ? '车位较足' : '车位紧张',
                distance <= 300 ? '距离近' : '距离适中'
            ]
        };
    });

    // 排序并返回前5个
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

/**
 * 分析用户画像
 * @param {Object} user - 用户数据
 * @returns {Object} - 用户画像
 */
function analyzeUserProfile(user) {
    const history = user.parkingHistory || [];

    // 计算平均消费
    const avgSpending = history.length > 0
        ? history.reduce((sum, record) => sum + (record.fee || 0), 0) / history.length
        : 20; // 默认20元

    // 计算偏好距离
    const avgDistance = history.length > 0
        ? history.reduce((sum, record) => sum + (record.distance || 500), 0) / history.length
        : 500; // 默认500米

    // 统计常去停车场
    const lotFrequency = {};
    history.forEach(record => {
        lotFrequency[record.lotId] = (lotFrequency[record.lotId] || 0) + 1;
    });
    const frequentLots = Object.entries(lotFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    // 分析停车时长偏好
    const avgDuration = history.length > 0
        ? history.reduce((sum, record) => sum + (record.duration || 2), 0) / history.length
        : 2; // 默认2小时

    // 分析车型偏好
    const vehicleTypeCount = {};
    history.forEach(record => {
        vehicleTypeCount[record.vehicleType] = (vehicleTypeCount[record.vehicleType] || 0) + 1;
    });
    const preferredVehicleType = Object.entries(vehicleTypeCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'sedan';

    return {
        avgSpending: avgSpending,
        preferredDistance: avgDistance,
        frequentLots: frequentLots,
        totalParkingTimes: history.length,
        avgDuration: avgDuration,
        preferredVehicleType: preferredVehicleType
    };
}

/**
 * 预测价格（使用动态定价算法）
 */
function predictPrice(lot, targetTime) {
    const priceInfo = calculateDynamicPrice(lot, targetTime, 2);
    return parseFloat(priceInfo.hourlyRate);
}

/**
 * 搜索附近停车场
 */
function searchNearbyParkingLots(destination, radiusMeters) {
    const lots = mockParkingLots || generateMockParkingLots();
    return lots.filter(lot => {
        const distance = calculateDistance(destination, lot.location || { lat: 0, lng: 0 });
        return distance <= radiusMeters;
    }).map(lot => ({
        ...lot,
        location: lot.location || { lat: 39.9042 + (Math.random() - 0.5) * 0.01, lng: 116.4074 + (Math.random() - 0.5) * 0.01 }
    }));
}

/**
 * 计算两地距离（Haversine公式）
 */
function calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.lat || !coord2.lat) return 1000;

    const R = 6371e3; // 地球半径（米）
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 返回米
}

// 模拟用户数据生成
function generateMockUser() {
    // 生成用户历史停车记录（20-50条）
    const historyCount = 20 + Math.floor(Math.random() * 30);
    const vehicleTypes = ['sedan', 'suv', 'mpv', 'compact'];
    const parkingHistory = [];

    for (let i = 0; i < historyCount; i++) {
        const fee = 10 + Math.random() * 30;
        const duration = 1 + Math.random() * 8;
        const distance = 100 + Math.random() * 1000;
        parkingHistory.push({
            lotId: `P${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
            fee: fee,
            duration: duration,
            distance: distance,
            vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
            timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        });
    }

    return {
        id: 'U001',
        name: '张车主',
        parkingHistory: parkingHistory,
        preferences: {
            priority: Math.random() > 0.5 ? 'distance' : 'price',
            needsEVCharger: Math.random() > 0.7
        }
    };
}

/**
 * 初始化智能推荐
 */
function initializeRecommendation() {
    if (!document.getElementById('smart-recommendations')) return;

    // 模拟用户和目的地
    const user = generateMockUser();
    const destination = { lat: 39.9042, lng: 116.4074 }; // 沈阳天安门
    const targetTime = new Date();

    // 生成推荐
    const recommendations = recommendParkingLots(user, destination, targetTime);

    // 显示推荐结果
    displayRecommendations(recommendations, destination);

    // 如果有搜索结果，也更新价格
    updateParkingListPrices();
}

/**
 * 显示推荐结果
 */
function displayRecommendations(recommendations, destination) {
    const container = document.getElementById('smart-recommendations');
    if (!container) return;

    // 清除加载状态
    container.innerHTML = `
        <h3 class="text-2xl font-semibold mb-2">🎯 为您智能推荐</h3>
        <p class="text-sm text-gray-600 mb-6">基于您${recommendations.length > 0 ? '的停车习惯和偏好' : '的定位信息'}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recommendations-list">
            ${recommendations.map(lot => createRecommendationCardHTML(lot)).join('')}
        </div>
    `;

    // 添加动画
    if (typeof anime !== 'undefined') {
        anime({
            targets: '#smart-recommendations .bg-white',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            delay: anime.stagger(200),
            easing: 'easeOutQuad'
        });
    }
}

/**
 * 创建推荐卡片HTML
 */
function createRecommendationCardHTML(lot) {
    return `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="selectRecommendedLot('${lot.lotId}')">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                    <span class="text-2xl mr-2">🅿️</span>
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">${lot.name}</h4>
                        <p class="text-sm text-gray-600">${lot.address}</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-blue-600">${lot.recommendLevel}</div>
                    <div class="text-sm text-gray-500">综合评分: ${lot.score}</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="flex items-center">
                    <span class="text-xl mr-2">📍</span>
                    <div>
                        <div class="text-sm text-gray-600">距离</div>
                        <div class="font-medium">${lot.distanceText}</div>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-xl mr-2">💰</span>
                    <div>
                        <div class="text-sm text-gray-600">预估价格</div>
                        <div class="font-medium ${lot.priceChange > 0 ? 'text-red-600' : 'text-green-600'}">
                            ¥${lot.predictedPrice}/小时
                            <span class="text-xs">(${lot.priceChange > 0 ? '+' : ''}${lot.priceChange}%)</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-xl mr-2">🚗</span>
                    <div>
                        <div class="text-sm text-gray-600">可用车位</div>
                        <div class="font-medium ${lot.availableSpots > 20 ? 'text-green-600' : lot.availableSpots > 10 ? 'text-yellow-600' : 'text-red-600'}">
                            ${lot.availableSpots}个 (${lot.occupancyRate}%)
                        </div>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-xl mr-2">⭐</span>
                    <div>
                        <div class="text-sm text-gray-600">评分</div>
                        <div class="font-medium">${lot.rating.toFixed(1)}/5.0</div>
                    </div>
                </div>
            </div>

            <div class="bg-blue-50 p-3 rounded-lg mb-4">
                <div class="text-sm font-medium text-blue-800 mb-2">💡 推荐理由：</div>
                <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                    ${lot.reasons.slice(0, 3).map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
                ${lot.badges.slice(0, 3).map(badge => `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${badge}</span>`).join('')}
            </div>

            <div class="text-center">
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    立即预约
                </button>
            </div>
        </div>
    `;
}

/**
 * 更新停车场列表价格显示
 */
function updateParkingListPrices() {
    // 如果search.html页面已加载停车场列表，更新价格
    const parkingCards = document.querySelectorAll('[data-lot-id]');
    parkingCards.forEach(card => {
        const lotId = card.getAttribute('data-lot-id');
        const lot = mockParkingLots?.find(l => l.id === lotId);
        if (lot) {
            const targetTime = new Date();
            const priceInfo = calculateDynamicPrice(lot, targetTime, 2);
            const priceElement = card.querySelector('.dynamic-price');
            if (priceElement) {
                priceElement.innerHTML = `
                    <strong class="${parseFloat(priceInfo.hourlyRate) > lot.basePrice ? 'text-red-600' : 'text-green-600'}">
                        ¥${priceInfo.hourlyRate}/小时
                    </strong>
                    <br>
                    <span class="text-xs ${parseFloat(priceInfo.hourlyRate) > lot.basePrice ? 'text-red-500' : 'text-green-500'}">
                        ${parseFloat(priceInfo.hourlyRate) > lot.basePrice ? '↑' : '↓'} ${Math.abs(((priceInfo.hourlyRate - lot.basePrice) / lot.basePrice) * 100).toFixed(1)}%
                    </span>
                `;
            }
        }
    });
}

/**
 * 选择推荐的停车场
 */
function selectRecommendedLot(lotId) {
    const lot = mockParkingLots?.find(l => l.id === lotId);
    if (lot) {
        alert(`已选择停车场：${lot.name}（${lotId}）`);
        document.getElementById('parking-search').value = lot.name;
    }
}

// 导出函数
window.RecommendationSystem = {
    recommendParkingLots,
    analyzeUserProfile,
    predictPrice,
    searchNearbyParkingLots,
    calculateDistance,
    generateMockUser,
    initializeRecommendation
};
