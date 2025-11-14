// ========================================
// 智能停车管理系统 - 智能功能代码示例
// 适用于课设演示，使用简化算法
// ========================================

// ==========================================
// 1. 智能车位分配算法
// ==========================================

/**
 * 智能车位推荐算法
 * @param {Object} vehicle - 车辆信息 {type, length, width}
 * @param {Object} userPreferences - 用户偏好 {priceWeight, distanceWeight}
 * @param {Array} availableSpots - 可用车位列表
 * @returns {Array} 推荐的前3个车位（含评分和理由）
 */
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
        const priceScore = calculatePriceScore(spot.price);
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
            reasons: reasons,
            price: spot.price,
            distance: spot.distanceToEntrance
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

// 辅助函数：距离评分
function calculateDistanceScore(distance) {
    if (distance <= 20) return 30;
    if (distance <= 50) return 25;
    if (distance <= 100) return 20;
    return 10;
}

// 辅助函数：尺寸匹配评分
function calculateSizeMatchScore(vehicle, spot) {
    const vehicleArea = vehicle.length * vehicle.width;
    const spotArea = spot.length * spot.width;
    const utilizationRate = vehicleArea / spotArea;

    if (utilizationRate >= 0.7 && utilizationRate <= 0.85) return 25; // 最优利用率
    if (utilizationRate >= 0.6 && utilizationRate < 0.7) return 20;
    if (utilizationRate >= 0.5 && utilizationRate < 0.6) return 15;
    return 10;
}

// 辅助函数：用户偏好评分
function calculatePreferenceScore(spot, preferences) {
    let score = 0;
    // 根据用户历史数据计算
    if (preferences.favoriteFloors && preferences.favoriteFloors.includes(spot.floor)) {
        score += 10;
    }
    if (preferences.favoriteAreas && preferences.favoriteAreas.includes(spot.area)) {
        score += 10;
    }
    return score;
}

// 辅助函数：区域负载评分
function calculateLoadScore(area) {
    const occupancyRate = area.occupiedSpots / area.totalSpots;
    if (occupancyRate < 0.3) return 15; // 空闲
    if (occupancyRate < 0.6) return 10; // 正常
    if (occupancyRate < 0.8) return 5;  // 较忙
    return 0; // 拥挤
}

// 辅助函数：价格评分
function calculatePriceScore(price) {
    if (price <= 3) return 10;
    if (price <= 5) return 7;
    if (price <= 8) return 4;
    return 0;
}


// ==========================================
// 2. 智能动态定价策略
// ==========================================

/**
 * 动态价格计算
 * @param {Object} parkingLot - 停车场信息
 * @param {Date} targetTime - 目标时间
 * @param {Number} duration - 停车时长（小时）
 * @returns {Object} 价格信息和计算明细
 */
function calculateDynamicPrice(parkingLot, targetTime, duration) {
    const basePrice = 5; // 基础价格（元/小时）
    let finalPrice = basePrice;
    const priceFactors = [];

    // 1. 占用率系数
    const occupancyRate = parkingLot.occupiedSpots / parkingLot.totalSpots;
    let occupancyMultiplier = 1.0;
    
    if (occupancyRate < 0.3) {
        occupancyMultiplier = 0.7; // 空闲，7折吸引客流
        priceFactors.push({ factor: '低占用率优惠', multiplier: 0.7, description: '当前车位充足' });
    } else if (occupancyRate > 0.8) {
        occupancyMultiplier = 1.5; // 拥挤，提价分流
        priceFactors.push({ factor: '高峰期加价', multiplier: 1.5, description: '车位紧张' });
    } else if (occupancyRate > 0.9) {
        occupancyMultiplier = 2.0; // 接近饱和，大幅提价
        priceFactors.push({ factor: '车位紧缺', multiplier: 2.0, description: '仅剩少量车位' });
    }

    // 2. 时段系数
    const hour = targetTime.getHours();
    let timeMultiplier = 1.0;
    
    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 19)) {
        timeMultiplier = 1.5; // 上下班高峰期
        priceFactors.push({ factor: '高峰时段', multiplier: 1.5, description: '通勤高峰期' });
    } else if (hour >= 22 || hour < 6) {
        timeMultiplier = 0.7; // 夜间低谷
        priceFactors.push({ factor: '夜间优惠', multiplier: 0.7, description: '深夜时段' });
    } else if (hour >= 10 && hour < 14) {
        timeMultiplier = 1.2; // 午间小高峰
        priceFactors.push({ factor: '午间时段', multiplier: 1.2, description: '中午就餐时段' });
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
        priceFactors.push({ factor: '节假日加价', multiplier: 1.5, description: '法定节假日' });
    }

    // 5. 天气系数（模拟）
    const weatherFactor = getWeatherFactor();
    if (weatherFactor.multiplier !== 1.0) {
        priceFactors.push(weatherFactor);
    }

    // 计算最终价格
    finalPrice = basePrice * occupancyMultiplier * timeMultiplier * 
                 weekdayMultiplier * (isHoliday ? 1.5 : 1.0) * weatherFactor.multiplier;

    // 应用时长折扣
    let durationDiscount = 1.0;
    if (duration >= 3 && duration < 6) {
        durationDiscount = 0.95;
        priceFactors.push({ factor: '时长优惠', multiplier: 0.95, description: '停车3小时以上' });
    } else if (duration >= 6) {
        durationDiscount = 0.9;
        priceFactors.push({ factor: '长时优惠', multiplier: 0.9, description: '停车6小时以上' });
    }

    const totalPrice = finalPrice * duration * durationDiscount;

    return {
        basePrice: basePrice,
        hourlyRate: Math.round(finalPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        duration: duration,
        priceFactors: priceFactors,
        savingsCompared: Math.round((basePrice * duration - totalPrice) * 100) / 100,
        recommendation: totalPrice < basePrice * duration * 0.8 ? 
            '当前价格较优惠，建议立即预约' : 
            '建议选择其他时段或停车场以节省费用'
    };
}

// 辅助函数：判断是否为节假日
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

// 辅助函数：获取天气系数（模拟）
function getWeatherFactor() {
    const weather = Math.random();
    if (weather < 0.2) {
        return { factor: '雨天', multiplier: 1.2, description: '降雨天气，停车需求增加' };
    } else if (weather < 0.3) {
        return { factor: '高温', multiplier: 1.1, description: '高温天气，室内停车需求增加' };
    }
    return { factor: '正常天气', multiplier: 1.0, description: '天气良好' };
}


// ==========================================
// 3. 智能预约推荐系统
// ==========================================

/**
 * 智能推荐停车场
 * @param {Object} user - 用户信息（含历史行为）
 * @param {Object} destination - 目的地坐标
 * @param {Date} targetTime - 目标时间
 * @returns {Array} 推荐的停车场列表
 */
function recommendParkingLots(user, destination, targetTime) {
    // 用户画像
    const userProfile = analyzeUserProfile(user);
    
    // 搜索附近停车场（3公里内）
    const nearbyLots = searchNearbyParkingLots(destination, 3000);
    
    // 为每个停车场计算推荐分数
    const recommendations = nearbyLots.map(lot => {
        let score = 0;
        const reasons = [];

        // 1. 价格偏好匹配（30分）
        const predictedPrice = predictPrice(lot, targetTime);
        if (predictedPrice <= userProfile.avgSpending) {
            score += 30;
            reasons.push('价格符合您的预算');
        } else if (predictedPrice <= userProfile.avgSpending * 1.2) {
            score += 20;
        } else {
            score += 10;
        }

        // 2. 距离偏好（25分）
        const distance = calculateDistance(destination, lot.location);
        if (distance <= userProfile.preferredDistance) {
            score += 25;
            reasons.push(`距离目的地仅${Math.round(distance)}米`);
        } else if (distance <= userProfile.preferredDistance * 1.5) {
            score += 15;
        } else {
            score += 5;
        }

        // 3. 历史偏好（20分）
        if (userProfile.frequentLots.includes(lot.id)) {
            score += 20;
            reasons.push('您经常在此停车');
        }

        // 4. 车位可用性（15分）
        const availability = lot.totalSpots - lot.occupiedSpots;
        if (availability > 10) {
            score += 15;
            reasons.push('车位充足');
        } else if (availability > 5) {
            score += 10;
        } else {
            score += 5;
            reasons.push('车位紧张，建议尽快预约');
        }

        // 5. 用户评分（10分）
        if (lot.rating >= 4.5) {
            score += 10;
            reasons.push('用户评价优秀');
        } else if (lot.rating >= 4.0) {
            score += 7;
        } else if (lot.rating >= 3.5) {
            score += 5;
        }

        return {
            lotId: lot.id,
            name: lot.name,
            address: lot.address,
            distance: Math.round(distance),
            predictedPrice: predictedPrice,
            availableSpots: availability,
            rating: lot.rating,
            score: score,
            reasons: reasons,
            recommendLevel: score >= 80 ? '强烈推荐' : score >= 60 ? '推荐' : '可选'
        };
    });

    // 排序并返回前5个
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// 辅助函数：分析用户画像
function analyzeUserProfile(user) {
    const history = user.parkingHistory || [];
    
    // 计算平均消费
    const avgSpending = history.length > 0 ?
        history.reduce((sum, record) => sum + record.fee, 0) / history.length :
        20; // 默认20元

    // 计算偏好距离
    const avgDistance = history.length > 0 ?
        history.reduce((sum, record) => sum + record.distance, 0) / history.length :
        500; // 默认500米

    // 统计常去停车场
    const lotFrequency = {};
    history.forEach(record => {
        lotFrequency[record.lotId] = (lotFrequency[record.lotId] || 0) + 1;
    });
    const frequentLots = Object.entries(lotFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    return {
        avgSpending,
        preferredDistance: avgDistance,
        frequentLots,
        totalParkingTimes: history.length
    };
}

// 辅助函数：预测价格
function predictPrice(lot, targetTime) {
    // 简化版本，使用动态定价算法的结果
    return calculateDynamicPrice(lot, targetTime, 2).hourlyRate;
}

// 辅助函数：计算距离（使用Haversine公式）
function calculateDistance(coord1, coord2) {
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

// 辅助函数：搜索附近停车场（模拟）
function searchNearbyParkingLots(destination, radiusMeters) {
    // 模拟数据
    return [
        {
            id: 'P001',
            name: '机电学馆停车场',
            location: { lat: destination.lat + 0.001, lng: destination.lng + 0.001 },
            totalSpots: 200,
            occupiedSpots: 120,
            rating: 4.5,
            address: '某某路123号'
        },
        {
            id: 'P002',
            name: '建筑学馆停车场',
            location: { lat: destination.lat - 0.002, lng: destination.lng + 0.002 },
            totalSpots: 150,
            occupiedSpots: 140,
            rating: 4.2,
            address: '某某路456号'
        }
        // ... 更多停车场
    ];
}


// ==========================================
// 4. 智能导航与路径规划（简化版A*）
// ==========================================

/**
 * 室内导航路径规划
 * @param {Object} from - 起点 {floor, x, y}
 * @param {Object} to - 终点 {floor, x, y}
 * @param {Object} parkingMap - 停车场地图数据
 * @returns {Object} 导航路径和指引
 */
function findNavigationPath(from, to, parkingMap) {
    // 简化的A*算法
    const path = aStarPathfinding(from, to, parkingMap);
    
    // 生成导航指引
    const instructions = generateInstructions(path);
    
    // 计算总距离和预计时间
    const totalDistance = calculatePathDistance(path);
    const estimatedTime = Math.ceil(totalDistance / 80); // 假设步行速度80米/分钟

    return {
        path: path,
        instructions: instructions,
        totalDistance: Math.round(totalDistance),
        estimatedTime: estimatedTime,
        floors: [...new Set(path.map(p => p.floor))]
    };
}

// 简化的A*寻路算法
function aStarPathfinding(start, goal, map) {
    // 为演示简化，实际应实现完整A*算法
    const path = [];
    let current = { ...start };

    // 如果在不同楼层，先找到电梯/楼梯
    if (start.floor !== goal.floor) {
        const elevator = findNearestElevator(start, map);
        path.push({ ...start, type: 'start' });
        path.push({ ...elevator, type: 'elevator_entrance' });
        path.push({ ...elevator, floor: goal.floor, type: 'elevator_exit' });
        current = { ...elevator, floor: goal.floor };
    } else {
        path.push({ ...start, type: 'start' });
    }

    // 在目标楼层移动到目标点
    const steps = generateStepsBetween(current, goal);
    path.push(...steps);
    path.push({ ...goal, type: 'destination' });

    return path;
}

// 生成两点间的移动步骤
function generateStepsBetween(from, to) {
    const steps = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const stepCount = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 1; i <= stepCount; i++) {
        steps.push({
            floor: from.floor,
            x: from.x + (dx / stepCount) * i,
            y: from.y + (dy / stepCount) * i,
            type: 'waypoint'
        });
    }

    return steps;
}

// 生成导航指引文字
function generateInstructions(path) {
    const instructions = [];
    let currentFloor = path[0].floor;

    for (let i = 0; i < path.length; i++) {
        const point = path[i];

        if (point.type === 'start') {
            instructions.push({
                step: 1,
                text: `从当前位置出发（${point.floor}楼）`,
                distance: 0
            });
        } else if (point.type === 'elevator_entrance') {
            instructions.push({
                step: instructions.length + 1,
                text: `前往电梯（约${Math.round(calculateDistance2D(path[i - 1], point))}米）`,
                distance: Math.round(calculateDistance2D(path[i - 1], point))
            });
        } else if (point.type === 'elevator_exit') {
            instructions.push({
                step: instructions.length + 1,
                text: `乘坐电梯至${point.floor}楼`,
                distance: 0
            });
            currentFloor = point.floor;
        } else if (point.type === 'destination') {
            instructions.push({
                step: instructions.length + 1,
                text: `到达目的地车位（${point.spotNumber || '未知'}）`,
                distance: Math.round(calculateDistance2D(path[i - 1], point))
            });
        }
    }

    return instructions;
}

// 计算2D平面距离
function calculateDistance2D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// 计算路径总距离
function calculatePathDistance(path) {
    let total = 0;
    for (let i = 1; i < path.length; i++) {
        if (path[i].floor === path[i - 1].floor) {
            total += calculateDistance2D(path[i - 1], path[i]);
        }
    }
    return total;
}

// 查找最近的电梯
function findNearestElevator(point, map) {
    // 模拟：返回固定位置的电梯
    return {
        floor: point.floor,
        x: 50,
        y: 50,
        type: 'elevator'
    };
}


// ==========================================
// 5. 用户信用评分系统
// ==========================================

/**
 * 计算用户信用分
 * @param {Object} user - 用户数据
 * @returns {Object} 信用分详情
 */
function calculateCreditScore(user) {
    let score = 600; // 初始分数
    const factors = [];

    // 1. 按时缴费记录（最高+200分）
    const onTimePaymentRate = user.totalPayments > 0 ?
        user.onTimePayments / user.totalPayments : 1;
    const paymentScore = Math.round(onTimePaymentRate * 200);
    score += paymentScore;
    factors.push({
        factor: '缴费记录',
        score: paymentScore,
        description: `按时缴费率${(onTimePaymentRate * 100).toFixed(1)}%`
    });

    // 2. 预约履约情况（-50分/次爽约）
    const missedPenalty = user.missedReservations * 50;
    score -= missedPenalty;
    if (missedPenalty > 0) {
        factors.push({
            factor: '预约爽约',
            score: -missedPenalty,
            description: `爽约${user.missedReservations}次`
        });
    }

    // 3. 投诉记录（-30分/次）
    const complaintPenalty = user.complaints * 30;
    score -= complaintPenalty;
    if (complaintPenalty > 0) {
        factors.push({
            factor: '投诉记录',
            score: -complaintPenalty,
            description: `被投诉${user.complaints}次`
        });
    }

    // 4. 优质评价（+5分/次，最高+50分）
    const reviewBonus = Math.min(user.positiveReviews * 5, 50);
    score += reviewBonus;
    if (reviewBonus > 0) {
        factors.push({
            factor: '优质评价',
            score: reviewBonus,
            description: `获得${user.positiveReviews}次好评`
        });
    }

    // 5. 使用频次（活跃用户+30分）
    if (user.totalParkingTimes > 50) {
        score += 30;
        factors.push({
            factor: '活跃用户',
            score: 30,
            description: `停车${user.totalParkingTimes}次`
        });
    }

    // 限制分数范围在300-850
    score = Math.max(300, Math.min(850, score));

    // 确定信用等级
    let level, levelDescription;
    if (score >= 750) {
        level = '优秀';
        levelDescription = '信用优秀，享受优先预约权和价格优惠';
    } else if (score >= 650) {
        level = '良好';
        levelDescription = '信用良好，正常使用所有功能';
    } else if (score >= 550) {
        level = '一般';
        levelDescription = '信用一般，部分功能受限';
    } else if (score >= 450) {
        level = '较差';
        levelDescription = '信用较差，预约需预付费';
    } else {
        level = '差';
        levelDescription = '信用很差，建议改善信用记录';
    }

    return {
        score: score,
        level: level,
        levelDescription: levelDescription,
        factors: factors,
        benefits: getCreditBenefits(level)
    };
}

// 获取信用等级对应的权益
function getCreditBenefits(level) {
    const benefits = {
        '优秀': [
            '优先预约权',
            '预约免预付',
            '专属折扣9折',
            '延长免费取消时间'
        ],
        '良好': [
            '正常预约',
            '标准优惠',
            '常规取消时间'
        ],
        '一般': [
            '正常预约',
            '部分功能延迟',
            '标准费率'
        ],
        '较差': [
            '预约需预付',
            '限制预约次数',
            '无折扣'
        ],
        '差': [
            '禁止预约',
            '仅限现场停车',
            '需额外保证金'
        ]
    };

    return benefits[level] || [];
}


// ==========================================
// 6. 智能数据分析与决策建议
// ==========================================

/**
 * 生成智能经营建议
 * @param {Object} parkingLotData - 停车场运营数据
 * @returns {Array} 建议列表
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

    return insights;
}

// 车位利用率分析
function analyzeUtilization(data) {
    const lowUtilizationAreas = data.areas.filter(area => 
        area.occupancyRate < 0.3
    );

    if (lowUtilizationAreas.length > 0) {
        const area = lowUtilizationAreas[0];
        return {
            type: 'warning',
            priority: 'high',
            title: '车位利用率低',
            description: `${area.name}区域当前利用率仅${(area.occupancyRate * 100).toFixed(1)}%`,
            metrics: {
                currentRate: (area.occupancyRate * 100).toFixed(1) + '%',
                targetRate: '60%',
                gap: ((0.6 - area.occupancyRate) * area.totalSpots).toFixed(0) + '个车位'
            },
            suggestions: [
                '降低该区域停车价格20%吸引车流',
                '在导航系统中优先推荐该区域',
                '推出该区域停车优惠券活动'
            ],
            expectedImpact: '预计可提升利用率15-20%'
        };
    }

    return null;
}

// 收入优化分析
function analyzeRevenue(data) {
    const currentRevenue = data.dailyRevenue;
    const potentialRevenue = calculatePotentialRevenue(data);
    const gap = potentialRevenue - currentRevenue;

    if (gap > currentRevenue * 0.1) { // 如果有超过10%的增收潜力
        return {
            type: 'success',
            priority: 'high',
            title: '收入优化机会',
            description: `通过智能定价策略，预计每日可增加收入${gap.toFixed(0)}元`,
            metrics: {
                currentRevenue: currentRevenue.toFixed(0) + '元/天',
                potentialRevenue: potentialRevenue.toFixed(0) + '元/天',
                increaseRate: ((gap / currentRevenue) * 100).toFixed(1) + '%'
            },
            suggestions: [
                '在高峰时段（8-10点，17-19点）提价30%',
                '在低谷时段（22-6点）降价30%吸引过夜停车',
                '针对长时停车（>6小时）提供累进折扣'
            ],
            expectedImpact: `月收入可增加约${(gap * 30).toFixed(0)}元`
        };
    }

    return null;
}

// 计算潜在收入（使用动态定价）
function calculatePotentialRevenue(data) {
    // 简化计算：假设优化后的单车收入提升
    return data.dailyRevenue * 1.15;
}

// 高峰时段预测
function predictPeakHours(data) {
    // 基于历史数据预测（简化版）
    const historyData = data.history || [];
    const tomorrowPrediction = {
        morningPeak: { time: '8:30-9:30', probability: 0.85 },
        eveningPeak: { time: '17:30-18:30', probability: 0.90 }
    };

    return {
        type: 'info',
        priority: 'medium',
        title: '明日高峰预测',
        description: `预计明日${tomorrowPrediction.eveningPeak.time}将出现停车高峰`,
        metrics: {
            peakTime: tomorrowPrediction.eveningPeak.time,
            probability: (tomorrowPrediction.eveningPeak.probability * 100) + '%',
            predictedOccupancy: '85-95%'
        },
        suggestions: [
            '提前1小时开始动态提价分流车辆',
            '向会员用户推送错峰停车建议',
            '准备应急停车方案（引导至附近停车场）'
        ],
        expectedImpact: '可缓解20%的高峰压力'
    };
}

// 用户行为分析
function analyzeUserBehavior(data) {
    const avgDuration = data.avgParkingDuration || 2.5;
    
    if (avgDuration < 1.5) {
        return {
            type: 'info',
            priority: 'low',
            title: '短时停车占比高',
            description: `平均停车时长仅${avgDuration.toFixed(1)}小时，短时停车占比${(data.shortTermRatio * 100).toFixed(0)}%`,
            suggestions: [
                '优化计费策略：前15分钟免费以提升体验',
                '为短时停车设置专区（靠近出口）',
                '推广预约服务减少入场等待时间'
            ],
            expectedImpact: '可提升用户满意度和回头率'
        };
    }

    return null;
}

// 设备状态分析
function analyzeDeviceStatus(data) {
    const faultyDevices = (data.devices || []).filter(d => d.status === 'fault');
    
    if (faultyDevices.length > 0) {
        return {
            type: 'error',
            priority: 'urgent',
            title: '设备异常警告',
            description: `检测到${faultyDevices.length}个设备故障，可能影响正常运营`,
            devices: faultyDevices.map(d => ({
                name: d.name,
                location: d.location,
                faultTime: d.faultTime
            })),
            suggestions: [
                '立即安排维修人员检查',
                '启用备用设备或人工替代方案',
                '通知受影响区域的用户'
            ],
            expectedImpact: '尽快修复以避免用户投诉和收入损失'
        };
    }

    return null;
}


// ==========================================
// 使用示例
// ==========================================

// 示例1：智能车位分配
const vehicleInfo = { type: 'sedan', length: 4.5, width: 1.8 };
const userPrefs = { priceWeight: 0.3, distanceWeight: 0.4 };
const availableSpots = [/* 车位数据 */];
const recommendations = intelligentParkingAllocation(vehicleInfo, userPrefs, availableSpots);
console.log('推荐车位:', recommendations);

// 示例2：动态定价
const parkingLot = { occupiedSpots: 160, totalSpots: 200 };
const targetTime = new Date('2025-11-13T18:00:00');
const priceInfo = calculateDynamicPrice(parkingLot, targetTime, 2);
console.log('动态价格:', priceInfo);

// 示例3：停车场推荐
const user = { /* 用户数据 */ };
const destination = { lat: 39.9042, lng: 116.4074 };
const lotRecommendations = recommendParkingLots(user, destination, new Date());
console.log('推荐停车场:', lotRecommendations);

// 示例4：路径导航
const from = { floor: 1, x: 10, y: 10 };
const to = { floor: 2, x: 80, y: 80 };
const navigationPath = findNavigationPath(from, to, {});
console.log('导航路径:', navigationPath);

// 示例5：信用评分
const userInfo = {
    totalPayments: 50,
    onTimePayments: 48,
    missedReservations: 1,
    complaints: 0,
    positiveReviews: 10,
    totalParkingTimes: 50
};
const creditInfo = calculateCreditScore(userInfo);
console.log('信用评分:', creditInfo);

// 示例6：智能建议
const operationData = { /* 运营数据 */ };
const insights = generateBusinessInsights(operationData);
console.log('经营建议:', insights);
