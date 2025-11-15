// ==========================================
// 4. 智能导航与反向寻车系统
// ==========================================

// 全局变量：存储用户选择的目标位置
let selectedTargetLocation = null;

/**
 * 室内导航路径规划（核心功能）
 * 简化版A*算法，支持跨楼层导航
 * @param {Object} from - 起点 {floor, x, y}
 * @param {Object} to - 终点 {floor, x, y}
 * @param {Object} parkingMap - 停车场地图数据
 * @returns {Object} - 导航路径和指引
 */
function findNavigationPath(from, to, parkingMap) {
    // 简化的A*算法
    const path = aStarPathfinding(from, to, parkingMap);

    // 生成导航指引
    const instructions = generateNavigationInstructions(path);

    // 计算总距离和预计时间
    const totalDistance = calculatePathDistance(path);
    const estimatedTime = Math.ceil(totalDistance / 80); // 假设步行速度80米/分钟

    return {
        path: path,
        instructions: instructions,
        totalDistance: Math.round(totalDistance),
        estimatedTime: estimatedTime,
        floors: [...new Set(path.map(p => p.floor))],
        isSameFloor: from.floor === to.floor,
        floorChanges: countFloorChanges(path)
    };
}

/**
 * 简化的A*寻路算法
 */
function aStarPathfinding(start, goal, map) {
    // 对于演示，简化为直线+必要节点
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

/**
 * 生成两点间的移动步骤
 */
function generateStepsBetween(from, to) {
    const steps = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const stepCount = Math.max(Math.abs(dx), Math.abs(dy), 10);

    for (let i = 1; i <= stepCount; i++) {
        const progress = i / stepCount;
        steps.push({
            floor: from.floor,
            x: from.x + dx * progress,
            y: from.y + dy * progress,
            type: 'waypoint'
        });
    }

    return steps;
}

/**
 * 生成导航指引文字
 */
function generateNavigationInstructions(path) {
    const instructions = [];
    let currentFloor = path[0].floor;
    let stepNumber = 1;

    for (let i = 0; i < path.length; i++) {
        const point = path[i];
        const prevPoint = i > 0 ? path[i - 1] : null;

        if (point.type === 'start') {
            instructions.push({
                step: stepNumber++,
                text: `从当前位置出发（${point.floor}楼入口）`,
                distance: 0,
                duration: 0,
                type: 'start',
                icon: '📍'
            });
        } else if (point.type === 'elevator_entrance') {
            const distance = prevPoint ? calculateDistance2D(prevPoint, point) : 0;
            instructions.push({
                step: stepNumber++,
                text: `步行约${Math.round(distance)}米到达电梯`,
                distance: Math.round(distance),
                duration: Math.round(distance / 80),
                type: 'walk_to_elevator',
                icon: '🚶'
            });
        } else if (point.type === 'elevator_exit') {
            instructions.push({
                step: stepNumber++,
                text: `乘坐电梯到达${point.floor}楼`,
                distance: 0,
                duration: 1,
                type: 'elevator',
                icon: '🛗'
            });
            currentFloor = point.floor;
        } else if (point.type === 'destination') {
            const distance = prevPoint ? calculateDistance2D(prevPoint, point) : 0;
            const time = Math.round(distance / 80);
            instructions.push({
                step: stepNumber++,
                text: `到达目的地车位（${point.spotNumber || 'A-' + Math.floor(Math.random() * 50)}）`,
                distance: Math.round(distance),
                duration: time,
                type: 'arrival',
                icon: '🎯'
            });
        }
    }

    return instructions;
}

/**
 * 查找最近的电梯
 */
function findNearestElevator(point, map) {
    // 模拟：返回固定位置的电梯
    const elevators = [
        { floor: point.floor, x: 50, y: 50, type: 'elevator' },
        { floor: point.floor, x: 150, y: 100, type: 'elevator' }
    ];

    // 返回最近的电梯
    return elevators[0];
}

/**
 * 计算2D平面距离
 */
function calculateDistance2D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算路径总距离（米）
 */
function calculatePathDistance(path) {
    let total = 0;
    for (let i = 1; i < path.length; i++) {
        if (path[i].floor === path[i - 1].floor) {
            total += calculateDistance2D(path[i - 1], path[i]);
        }
    }
    return total;
}

/**
 * 计算楼层变更次数
 */
function countFloorChanges(path) {
    let changes = 0;
    for (let i = 1; i < path.length; i++) {
        if (path[i].floor !== path[i - 1].floor) {
            changes++;
        }
    }
    return changes;
}

/**
 * 获取方向描述（东南西北）
 */
function getDirectionDescription(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    if (angle >= -45 && angle < 45) return '向东';
    if (angle >= 45 && angle < 135) return '向北';
    if (angle >= 135 || angle < -135) return '向西';
    return '向南';
}

/**
 * 逆向寻车功能
 * @param {String} licensePlate - 车牌号
 * @param {String} parkingTicketId - 停车凭证ID
 * @returns {Object} - 车辆位置和导航信息
 */
function findVehicleLocation(licensePlate, parkingTicketId, parkingMap) {
    // 模拟根据车牌号或凭证查找车辆位置
    const mockVehiclePositions = [
        { floor: 2, area: 'B区', spotNumber: 'B23', time: '2025-11-13T09:30:00', fee: 15 },
        { floor: 1, area: 'A区', spotNumber: 'A15', time: '2025-11-13T10:15:00', fee: 8 },
        { floor: 3, area: 'C区', spotNumber: 'C42', time: '2025-11-13T08:45:00', fee: 22 }
    ];

    const vehicle = mockVehiclePositions.find(v =>
        licensePlate || parkingTicketId
    ) || mockVehiclePositions[0];

    if (!vehicle) return null;

    // 计算停车时长和费用
    const parkingStartTime = new Date(vehicle.time);
    const currentTime = new Date();
    const parkingDuration = Math.floor((currentTime - parkingStartTime) / (1000 * 60 * 60)); // 小时

    // 生成导航到车辆的路线
    const entrance = { floor: vehicle.floor, x: 10, y: 10, type: 'entrance' };
    const vehicleLocation = {
        floor: vehicle.floor,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        spotNumber: vehicle.spotNumber,
        area: vehicle.area
    };

    const navigationPath = findNavigationPath(entrance, vehicleLocation, parkingMap);

    return {
        vehicleInfo: {
            licensePlate: licensePlate || '京A' + Math.floor(Math.random() * 90000 + 10000),
            location: vehicle,
            parkingDuration: parkingDuration,
            currentFee: vehicle.fee + (parkingDuration * 5), // 每小时5元
            parkingStartTime: vehicle.time
        },
        navigationPath: navigationPath
    };
}

/**
 * 生成停车场地图（简化版）
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Number} floor - 楼层
 * @param {Object} currentLocation - 当前位置
 * @param {Object} targetLocation - 目标位置
 */
function drawParkingMap(ctx, floor, currentLocation, targetLocation) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // 绘制车位网格
    const spotWidth = 40;
    const spotHeight = 20;
    const cols = Math.floor(width / (spotWidth + 10));
    const rows = Math.floor(height / (spotHeight + 10));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * (spotWidth + 10) + 20;
            const y = row * (spotHeight + 10) + 20;

            // 随机生成车位状态
            const isOccupied = Math.random() > 0.6;

            ctx.fillStyle = isOccupied ? '#ef4444' : '#10b981';
            ctx.fillRect(x, y, spotWidth, spotHeight);

            // 绘制车位编号
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const spotNumber = String.fromCharCode(65 + floor - 1) + (row * cols + col + 1);
            ctx.fillText(spotNumber, x + spotWidth / 2, y + spotHeight / 2);
        }
    }

    // 绘制通道
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    // 水平通道
    for (let row = 1; row < rows; row += 2) {
        const y = row * (spotHeight + 10) + 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // 垂直通道
    for (let col = 1; col < cols; col += 3) {
        const x = col * (spotWidth + 10) + 5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    // 绘制电梯位置
    const elevatorX = 50;
    const elevatorY = 50;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(elevatorX - 10, elevatorY - 10, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('电梯', elevatorX, elevatorY + 4);

    // 绘制当前位置
    if (currentLocation) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(currentLocation.x, currentLocation.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标注"当前位置"
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('当前位置', currentLocation.x, currentLocation.y - 15);
    }

    // 绘制目标位置
    if (targetLocation) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(targetLocation.x, targetLocation.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标注目标车位
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            targetLocation.spotNumber || '目标车位',
            targetLocation.x,
            targetLocation.y - 15
        );
    }

    // 绘制导航路径
    if (currentLocation && targetLocation) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentLocation.x, currentLocation.y);

        // 简单直线路径（实际应该用A*算法生成的路径）
        ctx.lineTo(targetLocation.x, targetLocation.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制箭头
        const angle = Math.atan2(targetLocation.y - currentLocation.y, targetLocation.x - currentLocation.x);
        const arrowLength = 15;
        ctx.beginPath();
        ctx.moveTo(targetLocation.x, targetLocation.y);
        ctx.lineTo(
            targetLocation.x - arrowLength * Math.cos(angle - Math.PI / 6),
            targetLocation.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(targetLocation.x, targetLocation.y);
        ctx.lineTo(
            targetLocation.x - arrowLength * Math.cos(angle + Math.PI / 6),
            targetLocation.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    // 绘制楼层标识
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${floor}楼`, 10, 20);

    // 绘制图例
    ctx.fillStyle = '#10b981';
    ctx.fillRect(10, height - 40, 15, 15);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, height - 20, 15, 15);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.fillText('空闲车位', 30, height - 28);
    ctx.fillText('占用车位', 30, height - 8);
}

/**
 * 初始化导航功能
 */
function initializeNavigation() {
    if (!document.getElementById('parking-map-canvas')) return;

    const canvas = document.getElementById('parking-map-canvas');
    const ctx = canvas.getContext('2d');

    // 设置画布大小
    canvas.width = 800;
    canvas.height = 500;

    // 绘制初始地图（初始时没有目标位置，只显示当前位置）
    drawParkingMap(ctx, 1, { x: 50, y: 50 }, selectedTargetLocation);

    // 绑定楼层切换
    document.querySelectorAll('.floor-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const floor = parseInt(this.getAttribute('data-floor'));
            document.querySelectorAll('.floor-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            drawParkingMap(ctx, floor, { x: 50, y: 50 }, selectedTargetLocation);
        });
    });

    // 绑定反向寻车
    const findCarBtn = document.getElementById('find-car-btn');
    if (findCarBtn) {
        findCarBtn.addEventListener('click', function() {
            const licensePlate = document.getElementById('license-plate').value;
            const result = findVehicleLocation(licensePlate, null, {});

            if (result) {
                displayFindVehicleResult(result);
            }
        });
    }
}

/**
 * 显示寻车结果
 */
function displayFindVehicleResult(result) {
    const container = document.getElementById('find-vehicle-result');
    if (!container) return;

    const vehicle = result.vehicleInfo;

    container.innerHTML = `
        <div class="bg-green-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold text-green-800 mb-4">🚗 车辆位置已找到</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-white p-4 rounded">
                    <div class="text-sm text-gray-600">车牌号</div>
                    <div class="text-lg font-bold">${vehicle.licensePlate}</div>
                </div>
                <div class="bg-white p-4 rounded">
                    <div class="text-sm text-gray-600">停车位置</div>
                    <div class="text-lg font-bold">${vehicle.location.floor}楼${vehicle.location.area}-${vehicle.location.spotNumber}</div>
                </div>
                <div class="bg-white p-4 rounded">
                    <div class="text-sm text-gray-600">停车时长</div>
                    <div class="text-lg font-bold">${vehicle.parkingDuration}小时</div>
                </div>
                <div class="bg-white p-4 rounded">
                    <div class="text-sm text-gray-600">待支付费用</div>
                    <div class="text-lg font-bold text-red-600">¥${vehicle.currentFee}</div>
                </div>
            </div>
            <div class="bg-blue-50 p-4 rounded">
                <h4 class="font-semibold text-blue-800 mb-2">导航指引</h4>
                <div class="space-y-2">
                    ${result.navigationPath.instructions.map(inst => `
                        <div class="flex items-center py-2 border-b border-blue-200">
                            <span class="text-xl mr-3">${inst.icon}</span>
                            <div class="flex-1">
                                <div class="font-medium">${inst.text}</div>
                                <div class="text-sm text-blue-600">
                                    ${inst.distance > 0 ? `距离: ${inst.distance}米 | ` : ''}
                                    ${inst.duration > 0 ? `预计时间: ${inst.duration}分钟` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-4 text-center text-blue-800 font-semibold">
                    总计: ${result.navigationPath.totalDistance}米，约${result.navigationPath.estimatedTime}分钟
                </div>
            </div>
        </div>
    `;
}

/**
 * 切换楼层显示
 */
function changeFloor(floor) {
    const canvas = document.getElementById('parking-map-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    drawParkingMap(ctx, floor, null, null);

    // 更新标签状态
    document.querySelectorAll('.floor-tab').forEach(tab => {
        tab.classList.remove('active', 'bg-blue-600', 'text-white');
        tab.classList.add('bg-gray-200', 'text-gray-700');
    });

    const activeTab = document.querySelector(`[data-floor="${floor}"]`);
    if (activeTab) {
        activeTab.classList.remove('bg-gray-200', 'text-gray-700');
        activeTab.classList.add('active', 'bg-blue-600', 'text-white');
    }
}

// 导出函数
window.NavigationSystem = {
    findNavigationPath,
    aStarPathfinding,
    generateNavigationInstructions,
    findNearestElevator,
    calculateDistance2D,
    calculatePathDistance,
    findVehicleLocation,
    drawParkingMap,
    initializeNavigation,
    changeFloor,
    displayFindVehicleResult
};
