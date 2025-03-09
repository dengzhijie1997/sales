// 清除PWA缓存
function clearPWACache() {
    if ('caches' in window) {
        // 清除所有缓存
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

// 显示通知
function showPageNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : 
                                        type === 'warning' ? '#ff9800' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '10000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// 为已有的通知函数提供备用
function showNotification(message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        showPageNotification(message, type);
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