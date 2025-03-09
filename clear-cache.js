// 清除PWA缓存的辅助脚本
async function clearPWACache() {
    if ('caches' in window) {
        try {
            // 获取所有缓存名称
            const cacheNames = await caches.keys();
            console.log('找到以下缓存:', cacheNames);
            
            // 删除所有缓存
            const deletePromises = cacheNames.map(cacheName => {
                console.log('正在删除缓存:', cacheName);
                return caches.delete(cacheName);
            });
            
            await Promise.all(deletePromises);
            console.log('所有缓存已清除');
            
            // 注销Service Worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                const unregisterPromises = registrations.map(registration => {
                    console.log('注销Service Worker:', registration);
                    return registration.unregister();
                });
                
                await Promise.all(unregisterPromises);
                console.log('所有Service Worker已注销');
            }
            
            alert('缓存已清除，请刷新页面查看新图标');
            
            // 可选: 重新加载页面
            // location.reload(true);
        } catch (error) {
            console.error('清除缓存时出错:', error);
            alert('清除缓存时出错: ' + error.message);
        }
    } else {
        console.log('浏览器不支持Cache API');
        alert('您的浏览器不支持缓存清除功能');
    }
} 