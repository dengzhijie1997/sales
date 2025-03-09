/**
 * 清除PWA缓存和服务工作器
 * 这个脚本用于帮助用户解决缓存问题
 */

// 清除PWA缓存
function clearPWACache() {
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    console.log('清除缓存:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            console.log('所有缓存已清除');
            showNotification('所有缓存已清除，请刷新页面', 'success');
        }).catch(function(error) {
            console.error('清除缓存失败:', error);
            showNotification('清除缓存失败: ' + error.message, 'error');
        });
    } else {
        console.log('浏览器不支持缓存API');
        showNotification('浏览器不支持缓存API', 'warning');
    }
}

// 计算缓存大小
async function calculateCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (let cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (let request of requests) {
                const response = await cache.match(request);
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
        
        // 转换为可读格式
        let sizeDisplay = '';
        if (totalSize < 1024) {
            sizeDisplay = totalSize + ' B';
        } else if (totalSize < 1024 * 1024) {
            sizeDisplay = (totalSize / 1024).toFixed(2) + ' KB';
        } else {
            sizeDisplay = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
        }
        
        // 更新显示
        const cacheSizeElement = document.getElementById('cache-size');
        if (cacheSizeElement) {
            cacheSizeElement.textContent = sizeDisplay;
        }
        
        return sizeDisplay;
    } catch (error) {
        console.error('计算缓存大小时出错:', error);
        return '计算失败';
    }
}

// 页面加载时计算缓存大小
window.addEventListener('load', () => {
    calculateCacheSize();
});

// 显示通知
function showNotification(message, type) {
    // 如果主应用中已经有showNotification函数，则使用主应用的函数
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // 否则使用简单的alert
        alert(message);
    }
}

// 页面加载完成后自动运行
window.addEventListener('load', function() {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('clear-cache')) {
        clearPWACache();
    }
    
    // 如果检测到页面出错，自动修复
    setTimeout(function() {
        // 检查日期输入框
        const dateInput = document.getElementById('date');
        if (dateInput && dateInput.type !== 'date') {
            dateInput.type = 'date';
            dateInput.style.display = 'block';
            
            // 隐藏转盘容器
            const wheelContainer = document.getElementById('wheel-date-picker');
            if (wheelContainer) {
                wheelContainer.style.display = 'none';
            }
            
            console.log('已修复日期输入框');
        }
    }, 1000);
}); 