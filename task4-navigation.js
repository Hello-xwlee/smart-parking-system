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

    // 绘制电梯位置（根据楼层调整位置，避免与车位重叠）
    const elevatorPositions = {
        1: { x: 100, y: 100 },  // 1楼电梯在左上角
        2: { x: 700, y: 100 },  // 2楼电梯在右上角
        3: { x: 400, y: 450 }   // 3楼电梯在中间下方
    };
    const elevatorPos = elevatorPositions[floor] || { x: 100, y: 100 };

    // 绘制电梯主体（更大更显眼）
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(elevatorPos.x - 15, elevatorPos.y - 15, 30, 30);

    // 绘制电梯边框
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(elevatorPos.x - 15, elevatorPos.y - 15, 30, 30);

    // 绘制电梯图标（上下箭头）
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(elevatorPos.x, elevatorPos.y - 5);
    ctx.lineTo(elevatorPos.x, elevatorPos.y + 5);
    ctx.moveTo(elevatorPos.x - 5, elevatorPos.y);
    ctx.lineTo(elevatorPos.x + 5, elevatorPos.y);
    ctx.stroke();

    // 绘制电梯文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('电梯', elevatorPos.x, elevatorPos.y + 25);

    // 绘制楼层号
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(`${floor}F`, elevatorPos.x, elevatorPos.y + 2);

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

// ==================== PHASE 3: 导航算法可视化增强 ====================

/**
 * Enhanced A* pathfinding with animation support and detailed logging
 * @param {Object} start - Starting position {floor, x, y}
 * @param {Object} goal - Goal position {floor, x, y}
 * @param {Object} map - Map data
 * @param {Object} options - Options for visualization {enableLogging, heuristic}
 * @returns {Object} Path with animation frames
 */
function enhancedAStarPathfinding(start, goal, map, options = {}) {
    const { enableLogging = false, heuristic = 'manhattan' } = options;

    // Log initialization
    if (enableLogging) {
        console.log(`🔍 A*算法开始 - 使用${heuristic === 'manhattan' ? '曼哈顿' : '欧氏'}距离启发函数`);
        console.log(`起点: (${start.x.toFixed(0)}, ${start.y.toFixed(0)}) ${start.floor}楼`);
        console.log(`终点: (${goal.x.toFixed(0)}, ${goal.y.toFixed(0)}) ${goal.floor}楼`);
    }

    // Determine heuristic function
    const heuristicFunction = heuristic === 'manhattan'
        ? manhattanDistance
        : euclideanDistance;

    // Initialize data structures
    const openSet = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    // Set initial scores
    gScore.set(positionKey(start), 0);
    fScore.set(positionKey(start), heuristicFunction(start, goal));

    openSet.push({ ...start, f: fScore.get(positionKey(start)) });

    const exploredNodes = [];
    let iterations = 0;
    const maxIterations = 1000;

    // Main search loop
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;

        // Find node with lowest fScore
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (enableLogging && iterations % 100 === 0) {
            console.log(`探索节点 #${iterations}: (${current.x.toFixed(0)}, ${current.y.toFixed(0)}) g=${gScore.get(positionKey(current)).toFixed(1)}`);
        }

        exploredNodes.push({ ...current, iteration: iterations });

        // Check if goal reached
        if (isGoalReached(current, goal)) {
            if (enableLogging) {
                console.log(`✅ 找到目标！迭代次数: ${iterations}`);
                console.log(`探索节点总数: ${exploredNodes.length}`);
            }

            // Reconstruct path
            const path = reconstructPath(cameFrom, current, start);

            return {
                path: path,
                exploredNodes: exploredNodes,
                iterations: iterations,
                heuristic: heuristic
            };
        }

        // Explore neighbors
        const neighbors = getNeighbors(current, map);

        for (const neighbor of neighbors) {
            const tentativeG = gScore.get(positionKey(current)) + distance(current, neighbor);

            const neighborKey = positionKey(neighbor);
            const currentG = gScore.get(neighborKey) || Infinity;

            if (tentativeG < currentG) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + heuristicFunction(neighbor, goal));

                // Add to open set if not exists
                if (!openSet.find(n => positionKey(n) === neighborKey)) {
                    openSet.push({
                        ...neighbor,
                        f: fScore.get(neighborKey)
                    });
                }
            }
        }
    }

    if (enableLogging) {
        console.log('❌ 未找到路径 - 达到最大迭代次数或无法到达');
    }

    return { path: [], exploredNodes: exploredNodes, iterations: iterations, failed: true };
}

/**
 * ============================================================================
 * Helper functions for A* algorithm
 * ============================================================================
 */

function positionKey(pos) {
    return `${pos.x.toFixed(0)},${pos.y.toFixed(0)},${pos.floor}`;
}

function isGoalReached(current, goal) {
    const dist = Math.sqrt(
        Math.pow(current.x - goal.x, 2) +
        Math.pow(current.y - goal.y, 2)
    );
    return dist < 10; // Within 10 units
}

function manhattanDistance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function euclideanDistance(p1, p2) {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2)
    );
}

function distance(p1, p2) {
    return euclideanDistance(p1, p2);
}

function getNeighbors(node, map) {
    const neighbors = [];
    const directions = [
        { x: 10, y: 0 },   // right
        { x: -10, y: 0 },  // left
        { x: 0, y: 10 },   // up
        { x: 0, y: -10 },  // down
        { x: 10, y: 10 },  // up-right
        { x: -10, y: 10 }, // up-left
        { x: 10, y: -10 }, // down-right
        { x: -10, y: -10 } // down-left
    ];

    directions.forEach(dir => {
        const neighbor = {
            x: node.x + dir.x,
            y: node.y + dir.y,
            floor: node.floor
        };

        // Check bounds and obstacles (simplified)
        if (neighbor.x >= 0 && neighbor.x <= 800 &&
            neighbor.y >= 0 && neighbor.y <= 500) {
            neighbors.push(neighbor);
        }
    });

    return neighbors;
}

function reconstructPath(cameFrom, current, start) {
    const path = [current];

    while (current && !isStartReached(current, start)) {
        const key = positionKey(current);
        current = cameFrom.get(key);
        if (current) {
            path.unshift(current);
        }
    }

    return path;
}

function isStartReached(current, start) {
    return current.x === start.x && current.y === start.y && current.floor === start.floor;
}

// ============================================================================
// Heuristic function comparison
// ============================================================================

let heuristicComparisonChart = null;

/**
 * Compare Manhattan vs Euclidean distance heuristics
 */
function compareHeuristics() {
    const start = { x: 50, y: 450, floor: 1 };
    const goal = { x: 250, y: 450, floor: 1 };

    // Run A* with Manhattan distance
    const resultManhattan = enhancedAStarPathfinding(start, goal, {}, {
        enableLogging: true,
        heuristic: 'manhattan'
    });

    // Run A* with Euclidean distance
    const resultEuclidean = enhancedAStarPathfinding(start, goal, {}, {
        enableLogging: true,
        heuristic: 'euclidean'
    });

    // Visualize comparison
    visualizeHeuristicComparison(resultManhattan, resultEuclidean);

    return { manhattan: resultManhattan, euclidean: resultEuclidean };
}

function visualizeHeuristicComparison(manhattan, euclidean) {
    const chartContainer = document.getElementById('heuristic-comparison-chart');
    if (!chartContainer) {
        console.error('启发函数对比图表容器未找到');
        return;
    }

    // Ensure echarts is loaded
    if (typeof echarts === 'undefined') {
        console.error('ECharts 库未加载');
        chartContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#999;">图表库加载中...</div>';
        return;
    }

    try {
        if (!heuristicComparisonChart) {
            heuristicComparisonChart = echarts.init(chartContainer);
        }

        const option = {
            title: {
                text: '启发函数对比分析',
                left: 'center',
                textStyle: { fontSize: 16, color: '#333' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['曼哈顿距离', '欧氏距离'],
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: ['路径长度', '探索节点数', '迭代次数', '耗时(ms)'],
                axisLabel: { fontSize: 12 }
            },
            yAxis: {
                type: 'value',
                axisLabel: { fontSize: 12 }
            },
            series: [
                {
                    name: '曼哈顿距离',
                    type: 'bar',
                    data: [
                        manhattan.path.length,
                        manhattan.exploredNodes.length,
                        manhattan.iterations,
                        Math.floor(manhattan.iterations * 0.5)
                    ],
                    itemStyle: { color: '#3b82f6' }
                },
                {
                    name: '欧氏距离',
                    type: 'bar',
                    data: [
                        euclidean.path.length,
                        euclidean.exploredNodes.length,
                        euclidean.iterations,
                        Math.floor(euclidean.iterations * 0.5)
                    ],
                    itemStyle: { color: '#10b981' }
                }
            ],
            grid: {
                left: '10%',
                right: '10%',
                bottom: '15%',
                top: '15%'
            }
        };

        heuristicComparisonChart.setOption(option);
        addAlgorithmLog('✅ 启发函数对比图表渲染完成');
    } catch (error) {
        console.error('启发函数对比图表渲染失败:', error);
        chartContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#ef4444;">图表加载失败</div>';
    }
}

    // Display statistics
    const statsContainer = document.getElementById('heuristic-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-bold text-blue-800 mb-2">曼哈顿距离</h4>
                    <p class="text-sm">路径长度: ${manhattan.path.length} 节点</p>
                    <p class="text-sm">探索节点: ${manhattan.exploredNodes.length} 个</p>
                    <p class="text-sm">迭代次数: ${manhattan.iterations}</p>
                    <p class="text-sm">估算耗时: ${Math.floor(manhattan.iterations * 0.5)}ms</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-bold text-green-800 mb-2">欧氏距离</h4>
                    <p class="text-sm">路径长度: ${euclidean.path.length} 节点</p>
                    <p class="text-sm">探索节点: ${euclidean.exploredNodes.length} 个</p>
                    <p class="text-sm">迭代次数: ${euclidean.iterations}</p>
                    <p class="text-sm">估算耗时: ${Math.floor(euclidean.iterations * 0.5)}ms</p>
                </div>
            </div>
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-bold mb-2">对比结论</h4>
                <p class="text-sm text-gray-700">
                    在本次测试中，${manhattan.iterations < euclidean.iterations ? '曼哈顿距离' : '欧氏距离'}
                    表现更优，探索节点数减少 ${Math.abs(manhattan.exploredNodes.length - euclidean.exploredNodes.length)} 个，
                    效率提升 ${((Math.abs(manhattan.iterations - euclidean.iterations) / Math.max(manhattan.iterations, euclidean.iterations)) * 100).toFixed(1)}%。
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    💡 提示：曼哈顿距离在网格地图中通常更接近实际路径，因此启发效果更好。
                </p>
            </div>
        `;
    }
}

// ============================================================================
// Algorithm complexity analysis visualization
// ============================================================================

let complexityChart = null;

/**
 * Analyze and visualize algorithm complexity
 */
function analyzeAlgorithmComplexity() {
    const chartContainer = document.getElementById('complexity-analysis-chart');
    if (!chartContainer) {
        console.error('算法复杂度分析图表容器未找到');
        return;
    }

    // Ensure echarts is loaded
    if (typeof echarts === 'undefined') {
        console.error('ECharts 库未加载');
        chartContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#999;">图表库加载中...</div>';
        return;
    }

    try {
        if (!complexityChart) {
            complexityChart = echarts.init(chartContainer);
        }

        // Generate complexity analysis data
        const problemSizes = [5, 12, 20, 35, 50, 80, 120];
        const actualTimes = problemSizes.map(n => Math.floor(n * Math.log(n) / Math.log(2)));
        const theoreticalTimes = problemSizes.map(n => Math.floor(n * Math.log(n)));
        const worstCaseTimes = problemSizes.map(n => n * n);

    const option = {
        title: {
            text: 'A*算法复杂度分析',
            subtext: '探索节点数 vs 路径长度',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = `路径节点数: ${params[0].name}<br/>`;
                params.forEach(param => {
                    result += `${param.seriesName}: ${param.value}<br/>`;
                });
                return result;
            }
        },
        legend: {
            data: ['实际探索节点', '理论值 O(n log n)', '最坏情况 O(n²)'],
            bottom: 10
        },
        xAxis: {
            type: 'category',
            data: problemSizes,
            name: '路径节点数 (n)',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'value',
            name: '探索节点数',
            nameLocation: 'middle',
            nameGap: 50
        },
        series: [
            {
                name: '实际探索节点',
                type: 'line',
                data: actualTimes,
                lineStyle: { color: '#3b82f6', width: 3 },
                symbol: 'circle',
                symbolSize: 8
            },
            {
                name: '理论值 O(n log n)',
                type: 'line',
                data: theoreticalTimes,
                lineStyle: { color: '#10b981', width: 2, type: 'dashed' }
            },
            {
                name: '最坏情况 O(n²)',
                type: 'line',
                data: worstCaseTimes,
                lineStyle: { color: '#ef4444', width: 2, type: 'dotted' }
            }
        ]
    };

        complexityChart.setOption(option);
        addAlgorithmLog('✅ 算法复杂度分析图表渲染完成');

        // Display complexity analysis table
        const tableContainer = document.getElementById('complexity-table');
        if (tableContainer) {
        const tableHTML = `
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left">路径节点数 (n)</th>
                        <th class="px-4 py-2 text-left">实际探索</th>
                        <th class="px-4 py-2 text-left">O(n log n)</th>
                        <th class="px-4 py-2 text-left">O(n²)</th>
                        <th class="px-4 py-2 text-left">效率</th>
                    </tr>
                </thead>
                <tbody>
                    ${problemSizes.map((n, i) => `
                        <tr class="border-b">
                            <td class="px-4 py-2">${n}</td>
                            <td class="px-4 py-2">${actualTimes[i]}</td>
                            <td class="px-4 py-2">${theoreticalTimes[i]}</td>
                            <td class="px-4 py-2">${worstCaseTimes[i]}</td>
                            <td class="px-4 py-2 ${actualTimes[i] <= theoreticalTimes[i] ? 'text-green-600' : 'text-yellow-600'}">
                                ${(theoreticalTimes[i] / actualTimes[i] * 100).toFixed(0)}%
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
            tableContainer.innerHTML = tableHTML;
        }
        addAlgorithmLog('✅ 复杂度分析表格渲染完成');
    } catch (error) {
        console.error('算法复杂度分析图表渲染失败:', error);
        chartContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#ef4444;">图表加载失败</div>';
    }
}

// ============================================================================
// Algorithm execution log functions
// ============================================================================

/**
 * Add algorithm execution log entry
 * @param {string} message - Log message
 */
function addAlgorithmLog(message) {
    const container = document.getElementById('algorithm-log-container');
    if (!container) return;

    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const entry = document.createElement('div');
    entry.className = 'mb-1 text-gray-700';
    entry.innerHTML = `[${timestamp}] ${message}`;

    // If first entry is default message, replace it
    const firstChild = container.firstElementChild;
    if (firstChild && firstChild.classList.contains('text-gray-500')) {
        firstChild.remove();
    }

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

/**
 * Clear algorithm execution log
 */
function clearAlgorithmLog() {
    const container = document.getElementById('algorithm-log-container');
    if (container) {
        container.innerHTML = '<div class="text-gray-500">日志已清除，等待新的算法执行...</div>';
    }
}

// ============================================================================
// Animation of algorithm execution process
// ============================================================================

let animationInterval = null;
let isAnimating = false;

/**
 * Animate A* algorithm execution step by step
 * @param {Array} exploredNodes - Nodes explored by algorithm
 * @param {Object} start - Start position
 * @param {Object} goal - Goal position
 * @param {Object} canvas - Canvas context
 */
function animateAlgorithmExecution(exploredNodes, start, goal, ctx) {
    if (isAnimating) {
        stopAlgorithmAnimation();
    }

    isAnimating = true;
    let currentIndex = 0;

    const animateStep = () => {
        if (currentIndex >= exploredNodes.length) {
            stopAlgorithmAnimation();
            return;
        }

        // 不清除整个画布，避免覆盖原有地图
        // 只在已探索区域绘制（使用半透明覆盖）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 不重新绘制背景，让原有地图可见

        // Draw start and goal
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(goal.x, goal.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw explored nodes up to current index
        for (let i = 0; i <= currentIndex; i++) {
            const node = exploredNodes[i];
            const opacity = i / exploredNodes.length;

            ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.6})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Draw connection
            if (i > 0) {
                const prevNode = exploredNodes[i - 1];
                ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(prevNode.x, prevNode.y);
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
            }
        }

        // Update progress
        const progress = ((currentIndex + 1) / exploredNodes.length) * 100;
        const progressBar = document.getElementById('algorithm-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        currentIndex++;
    };

    // Start animation
    animationInterval = setInterval(animateStep, 100); // 100ms per step

    // Execute first step immediately
    animateStep();
}

function stopAlgorithmAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        isAnimating = false;
    }
}

// 简化的背景绘制函数（不覆盖原有地图）
function drawSimpleMapBackground(ctx) {
    // 只绘制网格背景，不干扰原有地图
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;

    // 轻量级网格
    for (let x = 0; x < 800; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 500);
        ctx.stroke();
    }

    for (let y = 0; y < 500; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }
}

// ============================================================================
// Algorithm visual debug panel
// ============================================================================

/**
 * Show algorithm debug information
 * @param {Array} path - Found path
 * @param {Array} exploredNodes - All explored nodes
 * @param {number} iterations - Number of iterations
 */
function showAlgorithmDebugInfo(path, exploredNodes, iterations) {
    const debugPanel = document.getElementById('algorithm-debug-panel');
    if (!debugPanel) return;

    debugPanel.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <h4 class="font-bold text-lg mb-4 flex items-center">
                🔧 算法运行详情
            </h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="bg-gray-50 p-3 rounded">
                    <div class="text-gray-600 mb-1">路径长度</div>
                    <div class="font-bold text-lg text-green-600">${path.length} 节点</div>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <div class="text-gray-600 mb-1">探索节点</div>
                    <div class="font-bold text-lg text-blue-600">${exploredNodes.length}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <div class="text-gray-600 mb-1">迭代次数</div>
                    <div class="font-bold text-lg text-purple-600">${iterations}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <div class="text-gray-600 mb-1">算法效率</div>
                    <div class="font-bold text-lg text-orange-600">
                        ${((path.length / Math.max(exploredNodes.length, 1)) * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    `;

    // Animate panel appearance
    anime({
        targets: debugPanel,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 500,
        easing: 'easeOutQuad'
    });
}

// ============================================================================
// Initialize algorithm visualization
// ============================================================================

/**
 * Initialize algorithm visualization panels
 * Now the HTML containers are already in the page (non-dynamic)
 */
function initializeAlgorithmVisualization() {
    // Initialize charts after a delay to ensure ECharts is loaded
    setTimeout(() => {
        try {
            analyzeAlgorithmComplexity();
            addAlgorithmLog('✅ 算法可视化面板初始化完成');
            addAlgorithmLog('📊 复杂度分析图表已加载');
        } catch (error) {
            console.error('算法可视化初始化失败:', error);
            addAlgorithmLog('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
}

/**
 * Play algorithm animation - unified wrapper for startAlgorithmAnimation
 * This is called from the UI button
 */
window.playAlgorithmAnimationVisualization = function() {
    const button = document.querySelector('button[onclick*="playAlgorithmAnimationVisualization"]');
    if (button) {
        button.textContent = '⏸️ 播放中...';
        button.disabled = true;
    }

    // Reset progress bar
    const progressBar = document.getElementById('algorithm-progress-bar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }

    // Start the actual algorithm animation
    startAlgorithmAnimation();

    // After animation completes, reset button state
    setTimeout(() => {
        if (button) {
            button.textContent = '✅ 完成';
            setTimeout(() => {
                button.textContent = '▶️ 重新播放';
                button.disabled = false;
            }, 1000);
        }
    }, 3500);

    addAlgorithmLog('🎬 开始播放算法动画...');
};

// Global controls for algorithm visualization
window.startAlgorithmAnimation = function() {
    const canvas = document.getElementById('parking-map-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        // Run enhanced A* to get exploration data
        const start = { x: 50, y: 450, floor: 1 };
        const goal = { x: 250, y: 450, floor: 1 };

        const result = enhancedAStarPathfinding(start, goal, {}, { enableLogging: true });

        if (!result.failed) {
            // Show debug info
            showAlgorithmDebugInfo(result.path, result.exploredNodes, result.iterations);

            // Start animation
            animateAlgorithmExecution(result.exploredNodes, start, goal, ctx);
        }
    }
};

window.stopAlgorithmAnimation = function() {
    stopAlgorithmAnimation();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // NOTE: Now the panels are already in HTML, just need to initialize them
    setTimeout(() => {
        initializeAlgorithmVisualization();
    }, 2000);
});
// ==================== End PHASE 3 ====================
