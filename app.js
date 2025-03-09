// 全局变量
let salesData = [];
let filteredData = [];
const itemsPerPage = 10; // 每页显示数据数量
let currentPage = 1;
let chartInstance = null;

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化日期显示
    updateCurrentDate();
    
    // 加载本地存储数据
    loadData();
    
    // 初始化事件监听
    initEventListeners();
});

// 更新当前日期显示
function updateCurrentDate() {
    const dateDisplay = document.getElementById('current-date');
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateDisplay.textContent = now.toLocaleDateString('zh-CN', options);
}

// 加载本地存储数据
function loadData() {
    const savedData = localStorage.getItem('coffeeBeansData');
    
    if (savedData) {
        salesData = JSON.parse(savedData);
        filteredData = [...salesData];
        
        // 更新统计信息和图表
        updateStatistics();
        updateChart();
        renderTable();
        renderMonthlyData();
        updateExportYearOptions();
    } else {
        showNotification('没有找到保存的数据，请添加新数据', 'error');
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('coffeeBeansData', JSON.stringify(salesData));
}

// 初始化事件监听
function initEventListeners() {
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            // 移除所有导航链接的活动状态
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // 添加当前链接的活动状态
            this.classList.add('active');
            
            // 切换内容区域
            activateSection(section);
        });
    });
    
    // 菜单切换按钮事件
    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('expanded');
        document.querySelector('.main-content').classList.toggle('sidebar-expanded');
    });
    
    // 表单提交事件
    const salesForm = document.getElementById('sales-form');
    salesForm.addEventListener('submit', handleFormSubmit);
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);
    
    // 排序功能
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', handleSort);
    
    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    
    // 图表控制
    document.getElementById('chart-period').addEventListener('change', updateChart);
    document.getElementById('chart-type').addEventListener('change', updateChart);
    
    // 示例数据填充按钮
    document.getElementById('fill-demo').addEventListener('click', fillDemoData);
    
    // 清空数据按钮
    document.getElementById('clear-data').addEventListener('click', () => {
        showConfirmDialog(
            '清空所有数据',
            '确定要清空所有销售数据吗？此操作不可恢复！',
            clearAllData
        );
    });
    
    // 模态框关闭按钮
    document.getElementById('close-confirm').addEventListener('click', hideConfirmDialog);
    document.getElementById('confirm-cancel').addEventListener('click', hideConfirmDialog);
    
    // 导出按钮事件
    document.getElementById('export-all').addEventListener('click', exportAllData);
    document.getElementById('export-monthly').addEventListener('click', exportMonthlyData);
    
    // 在页面加载时将日期输入框默认值设为今天
    const dateInput = document.getElementById('date');
    dateInput.valueAsDate = new Date();
}

// 切换激活的部分
function activateSection(sectionId) {
    // 更新内容部分显示
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // 如果是在移动设备上，可能需要收起菜单
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('expanded');
        document.querySelector('.main-content').classList.remove('sidebar-expanded');
    }
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const dateInput = document.getElementById('date');
    const wechatInput = document.getElementById('wechat');
    const samplesInput = document.getElementById('samples');
    const salesInput = document.getElementById('sales');
    
    // 获取表单数据
    const date = dateInput.value;
    const wechat = parseInt(wechatInput.value);
    const samples = parseInt(samplesInput.value);
    const sales = parseFloat(salesInput.value);
    
    // 验证数据
    if (!date || isNaN(wechat) || isNaN(samples) || isNaN(sales)) {
        showNotification('请填写所有字段并确保数据格式正确', 'error');
        return;
    }
    
    // 检查是否已有该日期的数据
    const existingEntryIndex = salesData.findIndex(item => item.date === date);
    
    if (existingEntryIndex >= 0) {
        // 更新现有数据
        showConfirmDialog(
            '数据已存在',
            `${formatDate(date)} 的数据已存在，是否覆盖？`,
            () => {
                salesData[existingEntryIndex] = { date, wechat, samples, sales };
                saveData();
                resetForm();
                refreshData();
                showNotification('数据更新成功');
            }
        );
    } else {
        // 添加新数据
        salesData.push({ date, wechat, samples, sales });
        saveData();
        resetForm();
        refreshData();
        showNotification('数据添加成功');
    }
}

// 重置表单
function resetForm() {
    const dateInput = document.getElementById('date');
    const wechatInput = document.getElementById('wechat');
    const samplesInput = document.getElementById('samples');
    const salesInput = document.getElementById('sales');
    
    dateInput.valueAsDate = new Date();
    wechatInput.value = 0;
    samplesInput.value = 0;
    salesInput.value = 0;
}

// 刷新所有数据显示
function refreshData() {
    filteredData = [...salesData];
    updateStatistics();
    updateChart();
    renderTable();
    renderMonthlyData();
    updateExportYearOptions();
}

// 更新统计信息
function updateStatistics() {
    if (salesData.length === 0) {
        document.getElementById('total-wechat').textContent = '0';
        document.getElementById('total-samples').textContent = '0';
        document.getElementById('total-sales').textContent = '¥0';
        document.getElementById('conversion-rate').textContent = '0%';
        return;
    }
    
    // 获取最近30天的数据
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const recentData = salesData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= thirtyDaysAgo && itemDate <= today;
    });
    
    // 计算总计
    const totalWechat = recentData.reduce((sum, item) => sum + item.wechat, 0);
    const totalSamples = recentData.reduce((sum, item) => sum + item.samples, 0);
    const totalSales = recentData.reduce((sum, item) => sum + item.sales, 0);
    
    // 计算转化率 (样品发出到销售的比率)
    const conversionRate = totalSamples > 0 ? (totalSales / (totalSamples * 100)) * 100 : 0;
    
    // 计算趋势 (与前30天相比)
    const previousThirtyDaysAgo = new Date();
    previousThirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const previousData = salesData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= previousThirtyDaysAgo && itemDate < thirtyDaysAgo;
    });
    
    const prevTotalWechat = previousData.reduce((sum, item) => sum + item.wechat, 0);
    const prevTotalSamples = previousData.reduce((sum, item) => sum + item.samples, 0);
    const prevTotalSales = previousData.reduce((sum, item) => sum + item.sales, 0);
    const prevConversionRate = prevTotalSamples > 0 ? (prevTotalSales / (prevTotalSamples * 100)) * 100 : 0;
    
    const wechatTrend = calculateTrend(totalWechat, prevTotalWechat);
    const samplesTrend = calculateTrend(totalSamples, prevTotalSamples);
    const salesTrend = calculateTrend(totalSales, prevTotalSales);
    const conversionTrend = calculateTrend(conversionRate, prevConversionRate);
    
    // 更新DOM
    document.getElementById('total-wechat').textContent = totalWechat;
    document.getElementById('total-samples').textContent = totalSamples;
    document.getElementById('total-sales').textContent = `¥${totalSales.toLocaleString('zh-CN')}`;
    document.getElementById('conversion-rate').textContent = `${conversionRate.toFixed(1)}%`;
    
    updateTrendDisplay('wechat-trend', wechatTrend);
    updateTrendDisplay('samples-trend', samplesTrend);
    updateTrendDisplay('sales-trend', salesTrend);
    updateTrendDisplay('conversion-trend', conversionTrend);
}

// 计算趋势百分比
function calculateTrend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

// 更新趋势显示
function updateTrendDisplay(elementId, trendValue) {
    const element = document.getElementById(elementId);
    const iconElement = element.querySelector('i');
    const valueElement = element.querySelector('span');
    
    if (trendValue > 0) {
        element.classList.remove('down');
        iconElement.className = 'fas fa-arrow-up';
        valueElement.textContent = `${trendValue.toFixed(1)}%`;
    } else if (trendValue < 0) {
        element.classList.add('down');
        iconElement.className = 'fas fa-arrow-down';
        valueElement.textContent = `${Math.abs(trendValue).toFixed(1)}%`;
    } else {
        element.classList.remove('down');
        iconElement.className = 'fas fa-minus';
        valueElement.textContent = '0%';
    }
}

// 渲染销售数据表格
function renderTable() {
    const tableBody = document.getElementById('sales-data');
    tableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">暂无数据</td>`;
        tableBody.appendChild(emptyRow);
        
        // 更新分页信息
        updatePagination(0);
        return;
    }
    
    // 排序数据 (默认按日期降序)
    const sortedData = [...filteredData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // 计算分页
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    
    // 渲染数据行
    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td>${item.wechat}</td>
            <td>${item.samples}</td>
            <td>¥${item.sales.toLocaleString('zh-CN')}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-btn" data-date="${item.date}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // 添加删除按钮事件监听
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
    
    // 更新分页信息
    updatePagination(sortedData.length);
}

// 更新分页信息
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const pageInfo = document.getElementById('page-info');
    pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    
    // 禁用/启用分页按钮
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// 更改页码
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

// 处理删除操作
function handleDelete(e) {
    const date = e.currentTarget.getAttribute('data-date');
    
    showConfirmDialog(
        '删除数据',
        `确定要删除 ${formatDate(date)} 的数据吗？`,
        () => {
            salesData = salesData.filter(item => item.date !== date);
            saveData();
            refreshData();
            showNotification('数据已删除');
        }
    );
}

// 处理搜索
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        filteredData = [...salesData];
    } else {
        filteredData = salesData.filter(item => {
            return formatDate(item.date).toLowerCase().includes(searchTerm) ||
                  item.wechat.toString().includes(searchTerm) ||
                  item.samples.toString().includes(searchTerm) ||
                  item.sales.toString().includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderTable();
}

// 处理排序
function handleSort() {
    const sortOption = document.getElementById('sort-select').value;
    
    switch (sortOption) {
        case 'date-desc':
            filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'sales-desc':
            filteredData.sort((a, b) => b.sales - a.sales);
            break;
        case 'sales-asc':
            filteredData.sort((a, b) => a.sales - b.sales);
            break;
    }
    
    currentPage = 1;
    renderTable();
}

// 更新图表
function updateChart() {
    const chartPeriod = document.getElementById('chart-period').value;
    const chartType = document.getElementById('chart-type').value;
    
    if (salesData.length === 0) {
        return;
    }
    
    // 获取Canvas元素
    const ctx = document.getElementById('sales-chart').getContext('2d');
    
    // 销毁现有图表
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // 准备数据
    const chartData = prepareChartData(chartPeriod, chartType);
    
    // 创建新图表
    chartInstance = new Chart(ctx, {
        type: chartType === 'combined' ? 'bar' : 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f5f5f5',
                        font: {
                            family: "'PingFang SC', 'Helvetica Neue', Arial, sans-serif"
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#2d2d2d',
                    titleColor: '#f5f5f5',
                    bodyColor: '#f5f5f5',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9e9e9e'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9e9e9e'
                    },
                    beginAtZero: true
                },
                y1: chartType === 'combined' ? {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9e9e9e'
                    },
                    beginAtZero: true
                } : undefined
            }
        }
    });
}

// 准备图表数据
function prepareChartData(period, type) {
    // 按日期升序排序数据
    const sortedData = [...salesData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 根据周期分组
    let groupedData = {};
    let labels = [];
    
    switch (period) {
        case 'daily':
            // 最近30天数据
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentData = sortedData.filter(item => new Date(item.date) >= thirtyDaysAgo);
            
            recentData.forEach(item => {
                const formattedDate = formatDate(item.date);
                groupedData[formattedDate] = {
                    wechat: item.wechat,
                    samples: item.samples,
                    sales: item.sales
                };
                labels.push(formattedDate);
            });
            break;
            
        case 'weekly':
            // 按周分组
            sortedData.forEach(item => {
                const date = new Date(item.date);
                const year = date.getFullYear();
                const weekNumber = getWeekNumber(date);
                const weekLabel = `${year}年第${weekNumber}周`;
                
                if (!groupedData[weekLabel]) {
                    groupedData[weekLabel] = {
                        wechat: 0,
                        samples: 0,
                        sales: 0
                    };
                    labels.push(weekLabel);
                }
                
                groupedData[weekLabel].wechat += item.wechat;
                groupedData[weekLabel].samples += item.samples;
                groupedData[weekLabel].sales += item.sales;
            });
            break;
            
        case 'monthly':
            // 按月分组
            sortedData.forEach(item => {
                const date = new Date(item.date);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const monthLabel = `${year}年${month}月`;
                
                if (!groupedData[monthLabel]) {
                    groupedData[monthLabel] = {
                        wechat: 0,
                        samples: 0,
                        sales: 0
                    };
                    labels.push(monthLabel);
                }
                
                groupedData[monthLabel].wechat += item.wechat;
                groupedData[monthLabel].samples += item.samples;
                groupedData[monthLabel].sales += item.sales;
            });
            break;
    }
    
    // 准备数据集
    let datasets = [];
    
    if (type === 'combined') {
        datasets = [
            {
                label: '销售额',
                data: labels.map(label => groupedData[label].sales),
                backgroundColor: 'rgba(176, 124, 79, 0.5)',
                borderColor: '#b07c4f',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                label: '微信添加',
                data: labels.map(label => groupedData[label].wechat),
                type: 'line',
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#4caf50',
                tension: 0.3,
                yAxisID: 'y1'
            },
            {
                label: '样品发出',
                data: labels.map(label => groupedData[label].samples),
                type: 'line',
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#2196f3',
                tension: 0.3,
                yAxisID: 'y1'
            }
        ];
    } else {
        let colors = {
            sales: {
                borderColor: '#b07c4f',
                backgroundColor: 'rgba(176, 124, 79, 0.1)'
            },
            wechat: {
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
            },
            samples: {
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
            }
        };
        
        let labels = {
            sales: '销售额',
            wechat: '微信添加',
            samples: '样品发出'
        };
        
        datasets = [{
            label: labels[type],
            data: Object.keys(groupedData).map(key => groupedData[key][type]),
            borderColor: colors[type].borderColor,
            backgroundColor: colors[type].backgroundColor,
            borderWidth: 2,
            pointBackgroundColor: colors[type].borderColor,
            tension: 0.3,
            fill: true
        }];
    }
    
    return {
        labels: labels,
        datasets: datasets
    };
}

// 获取周数
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 渲染月度汇总数据
function renderMonthlyData() {
    const monthlyDataElement = document.getElementById('monthly-data');
    monthlyDataElement.innerHTML = '';
    
    if (salesData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">暂无数据</td>`;
        monthlyDataElement.appendChild(emptyRow);
        return;
    }
    
    // 按月分组数据
    const monthlyData = {};
    
    salesData.forEach(item => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                wechat: 0,
                samples: 0,
                sales: 0
            };
        }
        
        monthlyData[monthKey].wechat += item.wechat;
        monthlyData[monthKey].samples += item.samples;
        monthlyData[monthKey].sales += item.sales;
    });
    
    // 排序月份 (最新的在前面)
    const sortedMonths = Object.keys(monthlyData).sort().reverse();
    
    // 渲染每个月的数据
    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthData = monthlyData[monthKey];
        
        // 计算转化率
        const conversionRate = monthData.samples > 0 ? 
            (monthData.sales / (monthData.samples * 100)) * 100 : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}年${month}月</td>
            <td>${monthData.wechat}</td>
            <td>${monthData.samples}</td>
            <td>¥${monthData.sales.toLocaleString('zh-CN')}</td>
            <td>${conversionRate.toFixed(1)}%</td>
        `;
        
        monthlyDataElement.appendChild(row);
    });
}

// 更新导出年份选项
function updateExportYearOptions() {
    const yearSelect = document.getElementById('export-year');
    yearSelect.innerHTML = '';
    
    // 获取所有年份
    const years = new Set();
    salesData.forEach(item => {
        const year = new Date(item.date).getFullYear();
        years.add(year);
    });
    
    // 如果没有数据，至少添加当前年份
    if (years.size === 0) {
        years.add(new Date().getFullYear());
    }
    
    // 按降序排列并添加选项
    Array.from(years).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearSelect.appendChild(option);
    });
    
    // 添加"所有年份"选项
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = '所有年份';
    yearSelect.insertBefore(allOption, yearSelect.firstChild);
    
    // 默认选择"所有年份"
    yearSelect.value = 'all';
}

// 导出所有数据
function exportAllData() {
    if (salesData.length === 0) {
        showNotification('没有数据可导出', 'error');
        return;
    }
    
    const format = document.getElementById('export-format').value;
    const year = document.getElementById('export-year').value;
    
    let dataToExport = [...salesData];
    
    // 如果选择了特定年份
    if (year !== 'all') {
        dataToExport = dataToExport.filter(item => {
            return new Date(item.date).getFullYear() === parseInt(year);
        });
    }
    
    if (dataToExport.length === 0) {
        showNotification(`${year}年没有数据`, 'error');
        return;
    }
    
    exportData(dataToExport, format, `咖啡豆销售数据_${year !== 'all' ? year : '全部'}`);
}

// 导出月度汇总数据
function exportMonthlyData() {
    if (salesData.length === 0) {
        showNotification('没有数据可导出', 'error');
        return;
    }
    
    const format = document.getElementById('export-format').value;
    const year = document.getElementById('export-year').value;
    
    // 按月分组数据
    const monthlyData = {};
    
    salesData.forEach(item => {
        const date = new Date(item.date);
        const itemYear = date.getFullYear();
        
        // 如果选择了特定年份，过滤数据
        if (year !== 'all' && itemYear !== parseInt(year)) {
            return;
        }
        
        const month = date.getMonth() + 1;
        const monthKey = `${itemYear}-${month.toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                year: itemYear,
                month: month,
                wechat: 0,
                samples: 0,
                sales: 0
            };
        }
        
        monthlyData[monthKey].wechat += item.wechat;
        monthlyData[monthKey].samples += item.samples;
        monthlyData[monthKey].sales += item.sales;
    });
    
    const monthlyArray = Object.values(monthlyData);
    
    if (monthlyArray.length === 0) {
        showNotification(`${year}年没有数据`, 'error');
        return;
    }
    
    // 按年月排序
    monthlyArray.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });
    
    exportData(monthlyArray, format, `咖啡豆销售月度数据_${year !== 'all' ? year : '全部'}`);
}

// 导出数据为指定格式
function exportData(data, format, filename) {
    let content;
    let mimeType;
    let extension;
    
    switch (format) {
        case 'csv':
            content = convertToCSV(data);
            mimeType = 'text/csv;charset=utf-8;';
            extension = 'csv';
            break;
        case 'json':
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json;charset=utf-8;';
            extension = 'json';
            break;
        case 'excel':
            // 对于Excel，我们仍然使用CSV，但改变MIME类型
            content = convertToCSV(data);
            mimeType = 'application/vnd.ms-excel;charset=utf-8;';
            extension = 'xls';
            break;
    }
    
    // 创建下载链接
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.${extension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`数据已导出为 ${filename}.${extension}`);
}

// 转换数据为CSV格式
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    // 获取所有可能的字段
    const allFields = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => allFields.add(key));
    });
    
    const fields = Array.from(allFields);
    
    // 创建表头
    const header = fields.map(field => {
        // 将字段名转换为中文
        const fieldMap = {
            'date': '日期',
            'wechat': '微信添加',
            'samples': '样品发出',
            'sales': '销售额',
            'year': '年份',
            'month': '月份'
        };
        return fieldMap[field] || field;
    }).join(',');
    
    // 创建数据行
    const rows = data.map(item => {
        return fields.map(field => {
            const value = item[field] === undefined ? '' : item[field];
            // 如果是日期字段，格式化它
            if (field === 'date' && value) {
                return formatDate(value);
            }
            return value;
        }).join(',');
    }).join('\n');
    
    return header + '\n' + rows;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
}

// 填充演示数据
function fillDemoData() {
    showConfirmDialog(
        '填充演示数据',
        '确定要添加演示数据吗？这将不会覆盖现有数据。',
        () => {
            // 生成过去90天的随机数据
            const today = new Date();
            for (let i = 1; i <= 90; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                
                // 随机生成数据
                const wechat = Math.floor(Math.random() * 20) + 1;  // 1-20
                const samples = Math.floor(Math.random() * wechat * 0.7);  // 0-70% of wechat
                const salesPerSample = Math.floor(Math.random() * 300) + 100;  // 100-400
                const sales = samples * salesPerSample;
                
                const dateString = date.toISOString().split('T')[0];
                
                // 检查是否已存在该日期的数据
                if (!salesData.some(item => item.date === dateString)) {
                    salesData.push({
                        date: dateString,
                        wechat,
                        samples,
                        sales
                    });
                }
            }
            
            saveData();
            refreshData();
            showNotification('演示数据已添加');
        }
    );
}

// 清空所有数据
function clearAllData() {
    salesData = [];
    saveData();
    refreshData();
    showNotification('所有数据已清空');
    hideConfirmDialog();
}

// 显示确认对话框
function showConfirmDialog(title, message, confirmCallback) {
    const dialog = document.getElementById('confirm-dialog');
    const titleElement = document.getElementById('confirm-title');
    const messageElement = document.getElementById('confirm-message');
    const confirmButton = document.getElementById('confirm-ok');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // 移除之前的事件监听
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // 添加新的事件监听
    newConfirmButton.addEventListener('click', () => {
        confirmCallback();
        hideConfirmDialog();
    });
    
    dialog.classList.add('active');
}

// 隐藏确认对话框
function hideConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.remove('active');
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const notificationIcon = notification.querySelector('.notification-icon i');
    
    notificationMessage.textContent = message;
    
    if (type === 'error') {
        notification.classList.add('error');
        notificationIcon.className = 'fas fa-times-circle';
    } else {
        notification.classList.remove('error');
        notificationIcon.className = 'fas fa-check-circle';
    }
    
    notification.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
} 