// 全局变量
let salesData = [];
let filteredData = [];
const itemsPerPage = 10; // 每页显示数据数量
let currentPage = 1;
let chartInstance = null; // 销售趋势图表实例
let analysisChartInstance = null; // 分析页面图表实例
let correlationChartInstance = null; // 关联分析图表实例
let currentPageId = 'dashboard'; // 当前页面ID
let unsubscribe = null; // Firebase实时监听取消函数

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化欢迎屏幕
    initWelcomeScreen();
    
    // 初始化日期显示
    updateCurrentDate();
    
    // 加载Firebase数据
    loadData();
    
    // 初始化事件监听
    initEventListeners();
    
    // 初始化页面
    initPages();
});

// 初始化各页面
function initPages() {
    // 初始化数据分析页面
    updateAnalysisForRange('month');
    
    // 初始化表单区域
    const formSection = document.getElementById('data-form-section');
    if (formSection) {
        formSection.style.display = 'none';
    }
    
    // 设置默认日期为今天
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = new Date().toISOString().split('T')[0];
    });
    
    // 初始化弹窗
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        // 点击遮罩层关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // 初始化表单提交事件
    const salesForm = document.getElementById('sales-form');
    if (salesForm) {
        salesForm.addEventListener('submit', handleFormSubmit);
    }
    
    const quickForm = document.getElementById('quick-form');
    if (quickForm) {
        quickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleQuickFormSubmit();
        });
    }
}

// 更新当前日期显示
function updateCurrentDate() {
    const dateDisplay = document.getElementById('current-date');
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateDisplay.textContent = now.toLocaleDateString('zh-CN', options);
}

// 加载Firebase数据
function loadData() {
    // 设置实时数据监听
    unsubscribe = setupRealtimeListener(data => {
        salesData = data;
        filteredData = [...salesData];
        
        // 更新统计信息和图表
        updateStatistics();
        updateChart();
        renderTable();
        renderMonthlyData();
        updateExportYearOptions();
        
        // 更新今日概况
        updateTodaySummary();
        
        // 更新最近数据
        renderRecentData();
    });
    
    // 如果初始加载没有数据，显示提示信息
    setTimeout(() => {
        if (salesData.length === 0) {
            showNotification('没有找到数据，请添加新数据', 'info');
        }
    }, 2000);
}

// 保存数据到Firebase (不再需要，由各个操作函数直接处理)
function saveData() {
    // 此函数保留但空置，以避免修改其他调用此函数的地方
    console.log('数据自动保存到Firebase');
}

// 初始化事件监听
function initEventListeners() {
    // 导航链接点击事件 - 侧边栏
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            navigateToPage(pageId);
            
            // 关闭侧边栏 (移动端)
            document.querySelector('.sidebar').classList.remove('expanded');
        });
    });
    
    // 导航链接点击事件 - 底部导航
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            navigateToPage(pageId);
        });
    });
    
    // 菜单切换按钮事件
    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('expanded');
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
    
    // 按钮事件
    document.getElementById('fill-demo').addEventListener('click', fillDemoData);
    document.getElementById('clear-data').addEventListener('click', clearAllData);
    
    // 确认对话框控制
    document.getElementById('close-confirm').addEventListener('click', hideConfirmDialog);
    document.getElementById('confirm-cancel').addEventListener('click', hideConfirmDialog);
    
    // 导出按钮
    document.getElementById('export-today').addEventListener('click', () => exportData('today'));
    document.getElementById('export-month').addEventListener('click', () => exportData('month'));
    document.getElementById('export-all').addEventListener('click', () => exportData('all'));
    
    // 处理哈希变化
    window.addEventListener('hashchange', handleHashChange);
    
    // 初始哈希处理
    handleHashChange();
    
    // 快速添加按钮
    const quickAddBtn = document.getElementById('quick-add-btn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            openQuickAddModal();
        });
    }
    
    // 快速添加弹窗相关
    document.getElementById('close-quick-add')?.addEventListener('click', () => {
        closeModal('quick-add-modal');
    });
    
    document.getElementById('quick-cancel')?.addEventListener('click', () => {
        closeModal('quick-add-modal');
    });
    
    document.getElementById('quick-save')?.addEventListener('click', () => {
        handleQuickFormSubmit();
    });
    
    // 筛选按钮
    document.getElementById('filter-btn')?.addEventListener('click', () => {
        openFilterModal();
    });
    
    document.getElementById('close-filter')?.addEventListener('click', () => {
        closeModal('filter-modal');
    });
    
    document.getElementById('filter-reset')?.addEventListener('click', () => {
        resetFilters();
    });
    
    document.getElementById('filter-apply')?.addEventListener('click', () => {
        applyFilters();
    });
    
    // 导出数据按钮
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
        openExportModal();
    });
    
    document.getElementById('close-export')?.addEventListener('click', () => {
        closeModal('export-modal');
    });
    
    document.getElementById('export-cancel')?.addEventListener('click', () => {
        closeModal('export-modal');
    });
    
    document.getElementById('export-confirm')?.addEventListener('click', () => {
        handleExport();
    });
    
    // 新建记录按钮
    document.getElementById('new-entry-btn')?.addEventListener('click', () => {
        showForm('add');
    });
    
    // 关闭表单按钮
    document.getElementById('close-form-btn')?.addEventListener('click', () => {
        hideForm();
    });
    
    // 重置表单按钮
    document.getElementById('reset-form')?.addEventListener('click', () => {
        resetForm();
    });
    
    // 日期范围按钮
    const dateRangeBtns = document.querySelectorAll('.date-range-btn');
    dateRangeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            dateRangeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateAnalysisForRange(this.dataset.range);
        });
    });
    
    // 图表类型切换
    const chartTypeBtns = document.querySelectorAll('.chart-type-btn');
    chartTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            chartTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateAnalysisChartType(this.dataset.type);
        });
    });
    
    // 刷新总览按钮
    document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
        refreshDashboard();
    });
    
    // 确保所有按钮都有事件监听
    document.querySelectorAll('[id]').forEach(el => {
        const id = el.id;
        
        // 处理特定按钮
        if (id === 'quick-add-btn' && !el.hasEventListener) {
            el.addEventListener('click', openQuickAddModal);
            el.hasEventListener = true;
        }
        
        if (id === 'new-entry-btn' && !el.hasEventListener) {
            el.addEventListener('click', () => showForm('add'));
            el.hasEventListener = true;
        }
        
        if (id === 'close-form-btn' && !el.hasEventListener) {
            el.addEventListener('click', hideForm);
            el.hasEventListener = true;
        }
        
        if (id === 'reset-form' && !el.hasEventListener) {
            el.addEventListener('click', resetForm);
            el.hasEventListener = true;
        }
        
        if (id === 'filter-btn' && !el.hasEventListener) {
            el.addEventListener('click', openFilterModal);
            el.hasEventListener = true;
        }
        
        if (id === 'export-data-btn' && !el.hasEventListener) {
            el.addEventListener('click', openExportModal);
            el.hasEventListener = true;
        }
        
        if (id === 'refresh-dashboard' && !el.hasEventListener) {
            el.addEventListener('click', refreshDashboard);
            el.hasEventListener = true;
        }
    });
    
    // 处理表格行点击事件
    document.addEventListener('click', function(e) {
        // 编辑按钮点击
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const row = e.target.closest('tr');
            const itemId = row.dataset.id;
            if (itemId) {
                showForm('edit', itemId);
            }
        }
        
        // 删除按钮点击
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const row = e.target.closest('tr');
            const itemId = row.dataset.id;
            if (itemId) {
                handleDelete({ target: e.target, itemId });
            }
        }
    });
}

// 处理哈希变化
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'data-entry', 'export'].includes(hash)) {
        navigateToPage(hash);
    }
}

// 页面导航
function navigateToPage(pageId) {
    if (pageId === currentPageId) return;
    
    // 更新导航链接状态
    document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // 获取当前页面和目标页面
    const currentPageEl = document.getElementById(currentPageId);
    const targetPageEl = document.getElementById(pageId);
    
    // 决定动画方向
    const pages = ['dashboard', 'data-entry', 'export'];
    const currentIndex = pages.indexOf(currentPageId);
    const targetIndex = pages.indexOf(pageId);
    const direction = targetIndex > currentIndex ? 'next' : 'prev';
    
    // 设置过渡类
    if (direction === 'next') {
        currentPageEl.className = 'page page-prev';
        targetPageEl.className = 'page page-current';
    } else {
        currentPageEl.className = 'page page-next';
        targetPageEl.className = 'page page-current';
    }
    
    // 更新当前页面ID
    currentPageId = pageId;
    
    // 更新URL哈希
    window.location.hash = pageId;
}

// 初始化转盘式日期选择器
function initWheelDatePicker() {
    const dateInput = document.getElementById('date');
    const now = new Date();
    
    // 简单起见，先使用普通日期输入框
    dateInput.type = 'date';
    dateInput.value = now.toISOString().split('T')[0];
    dateInput.style.display = 'block';
    
    // 隐藏转盘容器
    const wheelContainer = document.getElementById('wheel-date-picker');
    if (wheelContainer) {
        wheelContainer.style.display = 'none';
    }
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const wechat = document.getElementById('wechat').value;
    const samples = document.getElementById('samples').value;
    const sales = document.getElementById('sales').value;
    const notes = document.getElementById('notes')?.value || '';
    
    if (!date) {
        showNotification('请选择日期', 'error');
        return;
    }
    
    // 检查是否是编辑模式
    const itemId = e.target.dataset.itemId;
    
    try {
        if (itemId) {
            // 编辑现有数据
            const index = salesData.findIndex(item => item.id === itemId);
            if (index !== -1) {
                salesData[index] = {
                    ...salesData[index],
                    date,
                    wechat: parseInt(wechat || 0),
                    samples: parseInt(samples || 0),
                    sales: parseInt(sales || 0),
                    notes
                };
                
                // 更新Firebase
                if (firebase.apps.length) {
                    const db = firebase.firestore();
                    db.collection('salesData').doc(itemId).update({
                        date,
                        wechat: parseInt(wechat || 0),
                        samples: parseInt(samples || 0),
                        sales: parseInt(sales || 0),
                        notes
                    }).catch(error => {
                        console.error('更新数据时出错:', error);
                    });
                }
                
                showNotification('数据已更新');
            }
        } else {
            // 添加新数据
            const newItem = {
                date,
                wechat: parseInt(wechat || 0),
                samples: parseInt(samples || 0),
                sales: parseInt(sales || 0),
                notes,
                id: Date.now().toString()
            };
            
            salesData.push(newItem);
            
            // 添加到Firebase
            if (firebase.apps.length) {
                const db = firebase.firestore();
                db.collection('salesData').add(newItem).catch(error => {
                    console.error('添加数据时出错:', error);
                });
            }
            
            showNotification('数据已添加');
        }
        
        // 更新过滤数据
        filteredData = [...salesData];
        
        // 更新UI
        updateStatistics();
        updateChart();
        renderTable();
        renderRecentData();
        updateTodaySummary();
        
        // 重置表单并隐藏
        resetForm();
        hideForm();
        
    } catch (error) {
        console.error('处理表单提交时出错:', error);
        showNotification('操作失败: ' + error.message, 'error');
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
    const tableBody = document.querySelector('.data-table tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 添加数据行
    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id; // 保存记录的Firebase ID用于删除和更新
        
        // 创建表格单元格
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(item.date);
        
        const wechatCell = document.createElement('td');
        wechatCell.textContent = item.wechat;
        
        const samplesCell = document.createElement('td');
        samplesCell.textContent = item.samples;
        
        const salesCell = document.createElement('td');
        salesCell.textContent = `¥${item.sales.toFixed(2)}`;
        
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.addEventListener('click', () => showForm('edit', item.id));
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.addEventListener('click', () => handleDelete({ target: e.target, itemId: item.id }));
        
        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        
        // 将单元格添加到行
        row.appendChild(dateCell);
        row.appendChild(wechatCell);
        row.appendChild(samplesCell);
        row.appendChild(salesCell);
        row.appendChild(actionsCell);
        
        // 将行添加到表格
        tableBody.appendChild(row);
    });
    
    // 更新分页信息
    updatePagination(filteredData.length);
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
    const recordId = e.target.closest('tr').dataset.id;
    const date = e.target.closest('tr').cells[0].textContent;
    
    showConfirmDialog(
        '确认删除',
        `确定要删除 ${date} 的销售记录吗？`,
        async () => {
            // 使用Firebase删除记录
            const success = await deleteSalesRecord(recordId);
            if (success) {
                showNotification('记录已成功删除');
            } else {
                showNotification('删除记录失败，请重试', 'error');
            }
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

// 导出数据到Markdown格式
function exportData(timeRange) {
    let dataToExport = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // 今天的日期 YYYY-MM-DD
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // 当前月份 YYYY-MM
    
    // 根据时间范围筛选数据
    if (timeRange === 'today') {
        dataToExport = salesData.filter(item => item.date === today);
    } else if (timeRange === 'month') {
        dataToExport = salesData.filter(item => item.date.startsWith(currentMonth));
    } else {
        dataToExport = [...salesData];
    }
    
    // 如果没有数据，显示提示
    if (dataToExport.length === 0) {
        showNotification('所选时间范围内没有数据', 'warning');
        return;
    }
    
    // 生成Markdown表格
    let markdown = '# 咖啡豆销售数据报表\n\n';
    
    // 添加时间范围信息
    if (timeRange === 'today') {
        markdown += `## 今日(${formatDate(today)})数据\n\n`;
    } else if (timeRange === 'month') {
        const monthName = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        markdown += `## ${monthName}数据\n\n`;
    } else {
        markdown += '## 全部数据\n\n';
    }
    
    // 添加表格头
    markdown += '| 日期 | 微信添加 | 样品发出 | 销售额(元) |\n';
    markdown += '| ---- | -------- | -------- | ---------- |\n';
    
    // 排序数据 (按日期降序)
    dataToExport.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 添加数据行
    dataToExport.forEach(item => {
        markdown += `| ${formatDate(item.date)} | ${item.wechat} | ${item.samples} | ${item.sales.toFixed(2)} |\n`;
    });
    
    // 添加统计信息
    const totalWechat = dataToExport.reduce((sum, item) => sum + item.wechat, 0);
    const totalSamples = dataToExport.reduce((sum, item) => sum + item.samples, 0);
    const totalSales = dataToExport.reduce((sum, item) => sum + item.sales, 0);
    const conversionRate = totalWechat > 0 ? (totalSamples / totalWechat * 100).toFixed(2) : 0;
    
    markdown += '\n## 统计汇总\n\n';
    markdown += `- **微信添加总数:** ${totalWechat}\n`;
    markdown += `- **样品发出总数:** ${totalSamples}\n`;
    markdown += `- **销售总额:** ¥${totalSales.toFixed(2)}\n`;
    markdown += `- **转化率:** ${conversionRate}%\n`;
    
    // 生成下载文件
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 设置文件名
    let filename;
    if (timeRange === 'today') {
        filename = `咖啡销售数据_${today}.md`;
    } else if (timeRange === 'month') {
        filename = `咖啡销售数据_${currentMonth}.md`;
    } else {
        filename = `咖啡销售数据_全部.md`;
    }
    
    a.download = filename;
    a.click();
    
    // 释放URL对象
    URL.revokeObjectURL(url);
    
    showNotification('数据导出成功');
}

// 填充演示数据
function fillDemoData() {
    showConfirmDialog(
        '填充示例数据',
        '确定要填充示例数据吗？这将添加30条随机销售记录。',
        async () => {
            // 生成随机销售数据
            const demoData = [];
            const today = new Date();
            
            // 先取消监听避免频繁更新
            if (unsubscribe) {
                unsubscribe();
            }
            
            try {
                // 使用批量写入提高性能
                const batch = firebase.firestore().batch();
                
                for (let i = 0; i < 30; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const wechat = Math.floor(Math.random() * 20) + 5;
                    const samples = Math.floor(Math.random() * 10) + 1;
                    const sales = Math.floor(Math.random() * 3000) + 500;
                    
                    const demoEntry = {
                        date: dateStr,
                        wechat: wechat,
                        samples: samples,
                        sales: sales
                    };
                    
                    demoData.push(demoEntry);
                    
                    // 添加到批处理
                    const newDocRef = salesCollection.doc();
                    batch.set(newDocRef, demoEntry);
                }
                
                // 提交批处理
                await batch.commit();
                
                showNotification('示例数据已添加成功');
                
                // 重新加载数据
                loadData();
            } catch (error) {
                console.error('添加示例数据时发生错误:', error);
                showNotification('添加示例数据失败，请重试', 'error');
                
                // 重新监听
                loadData();
            }
        }
    );
}

// 清空所有数据
function clearAllData() {
    showConfirmDialog(
        '清空所有数据',
        '确定要删除所有数据吗？此操作不可恢复！',
        async () => {
            // 先取消监听避免频繁更新
            if (unsubscribe) {
                unsubscribe();
            }
            
            // 批量删除所有数据
            try {
                const batch = firebase.firestore().batch();
                const snapshot = await salesCollection.get();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                
                // 清空本地数据
                salesData = [];
                filteredData = [];
                
                // 刷新UI
                refreshData();
                showNotification('所有数据已清空');
                
                // 重新监听
                loadData();
            } catch (error) {
                console.error('清空数据时发生错误:', error);
                showNotification('清空数据失败，请重试', 'error');
                
                // 确保监听被重新设置
                loadData();
            }
        }
    );
}

// 页面卸载时取消监听
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

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

// 备份Firebase数据
async function backupFirebaseData() {
    try {
        // 获取所有数据的快照
        const snapshot = await salesCollection.get();
        const backupData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (backupData.length === 0) {
            showNotification('没有数据可备份', 'error');
            return;
        }
        
        // 将数据转换为JSON并下载
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        
        // 创建文件名: coffee-sales-backup-YYYY-MM-DD.json
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        downloadLink.download = `coffee-sales-backup-${dateString}.json`;
        
        // 模拟点击下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showNotification('数据备份成功');
    } catch (error) {
        console.error('备份数据时发生错误:', error);
        showNotification('备份数据失败，请重试', 'error');
    }
}

// 触发文件选择对话框
function restoreFirebaseData() {
    document.getElementById('restore-file').click();
}

// 处理选择的备份文件
async function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (file.type !== 'application/json') {
        showNotification('请选择JSON格式的备份文件', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // 解析备份文件
            const backupData = JSON.parse(e.target.result);
            
            // 确认恢复
            showConfirmDialog(
                '确认恢复数据',
                `将恢复 ${backupData.length} 条销售记录，这将覆盖当前数据。确定继续吗？`,
                async () => {
                    // 先取消监听避免频繁更新
                    if (unsubscribe) {
                        unsubscribe();
                    }
                    
                    try {
                        // 删除当前所有数据
                        const currentData = await salesCollection.get();
                        const deletePromises = currentData.docs.map(doc => doc.ref.delete());
                        await Promise.all(deletePromises);
                        
                        // 恢复备份数据
                        const batch = firebase.firestore().batch();
                        
                        backupData.forEach(item => {
                            const docId = item.id;
                            const { id, ...data } = item; // 剔除id字段
                            batch.set(salesCollection.doc(docId), data);
                        });
                        
                        await batch.commit();
                        
                        showNotification('数据恢复成功');
                        
                        // 重新加载数据
                        loadData();
                    } catch (error) {
                        console.error('恢复数据时发生错误:', error);
                        showNotification('恢复数据失败，请重试', 'error');
                        
                        // 重新监听
                        loadData();
                    }
                }
            );
        } catch (error) {
            console.error('读取备份文件时发生错误:', error);
            showNotification('无效的备份文件格式', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // 重置文件输入框，以便可以选择相同文件
    event.target.value = '';
}

// 初始化欢迎屏幕
function initWelcomeScreen() {
    // 更新欢迎语
    updateGreeting();
    
    // 两秒后隐藏欢迎屏幕
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
            
            // 完全移除欢迎屏幕DOM
            setTimeout(() => {
                welcomeScreen.remove();
            }, 500);
        }
    }, 2500);
}

// 更新欢迎语
function updateGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    const welcomeMessageEl = document.getElementById('welcome-message');
    const now = new Date();
    const hour = now.getHours();
    
    let greeting = '';
    if (hour >= 5 && hour < 12) {
        greeting = '早上好！';
    } else if (hour >= 12 && hour < 18) {
        greeting = '下午好！';
    } else {
        greeting = '晚上好！';
    }
    
    if (greetingEl) {
        greetingEl.textContent = greeting;
    }
    
    if (welcomeMessageEl) {
        const randomMessages = [
            "正在准备您的咖啡销售数据...",
            "为您温暖一杯数据拿铁...",
            "今天又是充满咖啡香的一天...",
            "给数据加点糖和奶泡...",
            "新鲜数据，正在萃取中..."
        ];
        welcomeMessageEl.textContent = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    }
}

// 更新今日概况
function updateTodaySummary() {
    const summaryEl = document.getElementById('today-summary');
    const today = new Date().toISOString().split('T')[0];
    
    const todayData = salesData.filter(item => item.date === today);
    
    if (todayData.length > 0) {
        const totalWechat = todayData.reduce((sum, item) => sum + parseInt(item.wechat || 0), 0);
        const totalSamples = todayData.reduce((sum, item) => sum + parseInt(item.samples || 0), 0);
        const totalSales = todayData.reduce((sum, item) => sum + parseInt(item.sales || 0), 0);
        
        summaryEl.innerHTML = `今日已添加 <strong>${totalWechat}</strong> 位微信好友，发出 <strong>${totalSamples}</strong> 份样品，销售额 <strong>¥${totalSales}</strong>`;
    } else {
        summaryEl.textContent = '今日尚无销售数据，立即添加新的记录？';
    }
}

// 渲染最近数据
function renderRecentData() {
    const recentDataEl = document.getElementById('recent-data');
    if (!recentDataEl) return;
    
    // 清空现有内容
    recentDataEl.innerHTML = '';
    
    // 获取最近5条数据
    const recentData = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recentData.length === 0) {
        recentDataEl.innerHTML = `
            <div class="empty-data-message">
                <i class="fas fa-inbox"></i>
                <p>暂无数据记录</p>
            </div>
        `;
        return;
    }
    
    // 渲染数据卡片
    recentData.forEach(item => {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="data-card-date">${formattedDate}</div>
            <div class="data-card-info">
                <div class="data-card-stat">
                    <i class="fab fa-weixin"></i>
                    <span>${item.wechat}</span>
                </div>
                <div class="data-card-stat">
                    <i class="fas fa-box"></i>
                    <span>${item.samples}</span>
                </div>
                <div class="data-card-stat">
                    <i class="fas fa-yen-sign"></i>
                    <span>¥${item.sales}</span>
                </div>
            </div>
        `;
        
        recentDataEl.appendChild(card);
    });
}

// 打开快速添加弹窗
function openQuickAddModal() {
    // 设置默认日期为今天
    document.getElementById('quick-date').value = new Date().toISOString().split('T')[0];
    
    // 打开弹窗
    openModal('quick-add-modal');
}

// 处理快速添加表单提交
function handleQuickFormSubmit() {
    const date = document.getElementById('quick-date').value;
    const wechat = document.getElementById('quick-wechat').value;
    const samples = document.getElementById('quick-samples').value;
    const sales = document.getElementById('quick-sales').value;
    
    if (!date) {
        showNotification('请选择日期', 'error');
        return;
    }
    
    // 创建新数据项
    const newItem = {
        date,
        wechat: parseInt(wechat || 0),
        samples: parseInt(samples || 0),
        sales: parseInt(sales || 0),
        id: Date.now().toString()
    };
    
    try {
        // 直接添加到本地数据
        salesData.push(newItem);
        filteredData = [...salesData];
        
        // 更新表格和统计信息
        updateStatistics();
        updateChart();
        renderTable();
        renderRecentData();
        updateTodaySummary();
        
        // 添加到Firebase (如果已连接)
        if (firebase.apps.length) {
            const db = firebase.firestore();
            db.collection('salesData').add(newItem)
                .then(() => {
                    console.log('数据已添加到Firebase');
                })
                .catch(error => {
                    console.error('添加数据到Firebase时出错:', error);
                    showNotification('数据已保存本地，但同步到云端失败', 'warning');
                });
        }
        
        // 关闭弹窗
        closeModal('quick-add-modal');
        
        // 显示成功通知
        showNotification('数据添加成功！');
    } catch (error) {
        console.error('添加数据时出错:', error);
        showNotification('添加数据失败: ' + error.message, 'error');
    }
}

// 打开弹窗
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('visible');
        
        // 如果是快速添加弹窗，设置默认日期为今天
        if (modalId === 'quick-add-modal') {
            document.getElementById('quick-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('quick-wechat').value = '0';
            document.getElementById('quick-samples').value = '0';
            document.getElementById('quick-sales').value = '0';
        }
    }
}

// 关闭弹窗
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('visible');
    }
}

// 打开筛选弹窗
function openFilterModal() {
    openModal('filter-modal');
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-sales-min').value = '';
    document.getElementById('filter-sales-max').value = '';
}

// 应用筛选条件
function applyFilters() {
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    const salesMin = document.getElementById('filter-sales-min').value;
    const salesMax = document.getElementById('filter-sales-max').value;
    
    filteredData = [...salesData];
    
    // 应用日期筛选
    if (dateFrom) {
        filteredData = filteredData.filter(item => item.date >= dateFrom);
    }
    
    if (dateTo) {
        filteredData = filteredData.filter(item => item.date <= dateTo);
    }
    
    // 应用销售额筛选
    if (salesMin) {
        filteredData = filteredData.filter(item => parseInt(item.sales) >= parseInt(salesMin));
    }
    
    if (salesMax) {
        filteredData = filteredData.filter(item => parseInt(item.sales) <= parseInt(salesMax));
    }
    
    // 重新渲染表格
    currentPage = 1;
    renderTable();
    
    // 关闭弹窗
    closeModal('filter-modal');
    
    // 显示通知
    showNotification(`已筛选出 ${filteredData.length} 条数据`);
}

// 打开导出弹窗
function openExportModal() {
    openModal('export-modal');
}

// 处理导出
function handleExport() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const range = document.querySelector('.export-range-btn.active').dataset.range;
    
    exportData(range);
    closeModal('export-modal');
}

// 显示表单
function showForm(mode, itemId = null) {
    const formSection = document.getElementById('data-form-section');
    const formTitle = document.getElementById('form-title');
    
    if (formSection) {
        formSection.classList.add('active');
    }
    
    // 设置表单标题
    if (formTitle) {
        formTitle.textContent = mode === 'add' ? '添加新记录' : '编辑记录';
    }
    
    // 重置表单
    resetForm();
    
    // 如果是编辑模式，填充数据
    if (mode === 'edit' && itemId) {
        fillFormWithData(itemId);
    } else {
        // 添加模式，设置今天的日期
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }
}

// 隐藏表单
function hideForm() {
    const formSection = document.getElementById('data-form-section');
    if (formSection) {
        formSection.classList.remove('active');
    }
}

// 用数据填充表单
function fillFormWithData(itemId) {
    const item = salesData.find(data => data.id === itemId);
    if (!item) return;
    
    document.getElementById('date').value = item.date;
    document.getElementById('wechat').value = item.wechat;
    document.getElementById('samples').value = item.samples;
    document.getElementById('sales').value = item.sales;
    document.getElementById('notes').value = item.notes || '';
    
    // 将ID存储在表单中，用于更新
    document.getElementById('sales-form').dataset.itemId = itemId;
}

// 更新分析页面的日期范围
function updateAnalysisForRange(range) {
    // 根据选择的范围更新分析页面
    let periodText = '';
    const now = new Date();
    
    switch (range) {
        case 'month':
            periodText = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
            break;
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3) + 1;
            periodText = `${now.getFullYear()}年第${quarter}季度`;
            break;
        case 'year':
            periodText = `${now.getFullYear()}年`;
            break;
        case 'custom':
            periodText = '自定义日期范围';
            break;
    }
    
    document.getElementById('analysis-period').textContent = periodText;
    
    // 更新图表和分析数据
    updateAnalysisCharts(range);
}

// 更新分析图表类型
function updateAnalysisChartType(type) {
    // 根据选择的图表类型更新
    if (analysisChartInstance) {
        analysisChartInstance.config.type = type;
        analysisChartInstance.update();
    }
}

// 更新分析图表
function updateAnalysisCharts(range) {
    // 清除旧图表
    if (analysisChartInstance) {
        analysisChartInstance.destroy();
    }
    if (correlationChartInstance) {
        correlationChartInstance.destroy();
    }
    
    // 准备数据
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let filteredSalesData = [...salesData];
    let labels = [];
    let wechatData = [];
    let samplesData = [];
    let salesAmountData = [];
    
    // 根据选择的范围筛选数据
    switch(range) {
        case 'month':
            // 本月数据
            const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
            filteredSalesData = salesData.filter(item => item.date >= monthStart && item.date <= monthEnd);
            
            // 按日期分组
            for (let i = 1; i <= 31; i++) {
                const day = i < 10 ? `0${i}` : `${i}`;
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day}`;
                
                if (new Date(dateStr).getMonth() === currentMonth) {
                    const dayData = filteredSalesData.filter(item => item.date === dateStr);
                    
                    labels.push(i + '日');
                    wechatData.push(dayData.reduce((sum, item) => sum + parseInt(item.wechat || 0), 0));
                    samplesData.push(dayData.reduce((sum, item) => sum + parseInt(item.samples || 0), 0));
                    salesAmountData.push(dayData.reduce((sum, item) => sum + parseInt(item.sales || 0), 0));
                }
            }
            break;
            
        case 'quarter':
            // 本季度数据
            const quarter = Math.floor(currentMonth / 3);
            const quarterStart = new Date(currentYear, quarter * 3, 1).toISOString().split('T')[0];
            const quarterEnd = new Date(currentYear, (quarter + 1) * 3, 0).toISOString().split('T')[0];
            filteredSalesData = salesData.filter(item => item.date >= quarterStart && item.date <= quarterEnd);
            
            // 按月分组
            for (let i = 0; i < 3; i++) {
                const monthIndex = quarter * 3 + i;
                const monthName = new Date(currentYear, monthIndex, 1).toLocaleDateString('zh-CN', { month: 'long' });
                
                const monthStart = new Date(currentYear, monthIndex, 1).toISOString().split('T')[0];
                const monthEnd = new Date(currentYear, monthIndex + 1, 0).toISOString().split('T')[0];
                const monthData = filteredSalesData.filter(item => item.date >= monthStart && item.date <= monthEnd);
                
                labels.push(monthName);
                wechatData.push(monthData.reduce((sum, item) => sum + parseInt(item.wechat || 0), 0));
                samplesData.push(monthData.reduce((sum, item) => sum + parseInt(item.samples || 0), 0));
                salesAmountData.push(monthData.reduce((sum, item) => sum + parseInt(item.sales || 0), 0));
            }
            break;
            
        case 'year':
            // 全年数据
            const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
            const yearEnd = new Date(currentYear, 11, 31).toISOString().split('T')[0];
            filteredSalesData = salesData.filter(item => item.date >= yearStart && item.date <= yearEnd);
            
            // 按月分组
            for (let i = 0; i < 12; i++) {
                const monthName = new Date(currentYear, i, 1).toLocaleDateString('zh-CN', { month: 'short' });
                
                const monthStart = new Date(currentYear, i, 1).toISOString().split('T')[0];
                const monthEnd = new Date(currentYear, i + 1, 0).toISOString().split('T')[0];
                const monthData = filteredSalesData.filter(item => item.date >= monthStart && item.date <= monthEnd);
                
                labels.push(monthName);
                wechatData.push(monthData.reduce((sum, item) => sum + parseInt(item.wechat || 0), 0));
                samplesData.push(monthData.reduce((sum, item) => sum + parseInt(item.samples || 0), 0));
                salesAmountData.push(monthData.reduce((sum, item) => sum + parseInt(item.sales || 0), 0));
            }
            break;
            
        default:
            // 默认显示最近30天
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
            filteredSalesData = salesData.filter(item => item.date >= thirtyDaysAgoStr);
            
            // 按周分组
            const weeks = {};
            filteredSalesData.forEach(item => {
                const date = new Date(item.date);
                const weekNumber = getWeekNumber(date);
                const weekKey = `${date.getFullYear()}-W${weekNumber}`;
                
                if (!weeks[weekKey]) {
                    weeks[weekKey] = {
                        wechat: 0,
                        samples: 0,
                        sales: 0
                    };
                }
                
                weeks[weekKey].wechat += parseInt(item.wechat || 0);
                weeks[weekKey].samples += parseInt(item.samples || 0);
                weeks[weekKey].sales += parseInt(item.sales || 0);
            });
            
            // 转换为数组
            Object.keys(weeks).forEach(weekKey => {
                labels.push(weekKey);
                wechatData.push(weeks[weekKey].wechat);
                samplesData.push(weeks[weekKey].samples);
                salesAmountData.push(weeks[weekKey].sales);
            });
    }
    
    // 更新分析摘要
    updateAnalysisSummary(wechatData, samplesData, salesAmountData);
    
    // 创建分析图表
    const ctx = document.getElementById('analysis-chart');
    if (ctx) {
        const chartType = document.querySelector('.chart-type-btn.active')?.dataset.type || 'bar';
        
        analysisChartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '微信添加',
                        data: wechatData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '样品发出',
                        data: samplesData,
                        backgroundColor: 'rgba(255, 206, 86, 0.5)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '销售额',
                        data: salesAmountData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // 创建关联分析图表
    const corrCtx = document.getElementById('correlation-chart');
    if (corrCtx) {
        // 计算样品转化率
        const conversionData = [];
        for (let i = 0; i < samplesData.length; i++) {
            const conversion = samplesData[i] > 0 ? (salesAmountData[i] / samplesData[i]).toFixed(2) : 0;
            conversionData.push(conversion);
        }
        
        correlationChartInstance = new Chart(corrCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '样品转化率',
                        data: conversionData,
                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '每份样品平均销售额'
                        }
                    }
                }
            }
        });
    }
}

// 更新分析摘要
function updateAnalysisSummary(wechatData, samplesData, salesData) {
    // 计算总数
    const totalWechat = wechatData.reduce((sum, val) => sum + val, 0);
    const totalSamples = samplesData.reduce((sum, val) => sum + val, 0);
    const totalSales = salesData.reduce((sum, val) => sum + val, 0);
    
    // 计算转化率
    const conversionRate = totalSamples > 0 ? ((totalSales / totalSamples) * 100).toFixed(1) : 0;
    
    // 计算趋势
    let salesTrend = 0;
    if (salesData.length >= 2) {
        const firstHalf = salesData.slice(0, Math.floor(salesData.length / 2));
        const secondHalf = salesData.slice(Math.floor(salesData.length / 2));
        
        const firstHalfTotal = firstHalf.reduce((sum, val) => sum + val, 0);
        const secondHalfTotal = secondHalf.reduce((sum, val) => sum + val, 0);
        
        if (firstHalfTotal > 0) {
            salesTrend = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal * 100).toFixed(1);
        }
    }
    
    // 更新UI
    document.getElementById('analysis-trend').innerHTML = `销售额增长率 <span class="${salesTrend >= 0 ? 'positive' : 'negative'}">${salesTrend >= 0 ? '+' : ''}${salesTrend}%</span>`;
    document.getElementById('analysis-conversion').innerHTML = `样品转化率 <span>${conversionRate}%</span>`;
}

// 刷新总览
function refreshDashboard() {
    // 刷新按钮旋转动画
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        setTimeout(() => {
            refreshBtn.classList.remove('rotating');
        }, 1000);
    }
    
    // 重新加载数据
    refreshData();
    
    // 显示通知
    showNotification('数据已刷新');
} 