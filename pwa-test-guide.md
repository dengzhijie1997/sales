# PWA图标问题修复和验证指南

我们已经对PWA配置进行了全面修改，特别是针对GitHub Pages的路径设置。以下是验证和测试的步骤：

## 1. 检查图标文件存在

请确认以下图标文件已正确上传到GitHub仓库的 `/sales/icons/` 目录：

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

您可以手动访问以下URL测试图标是否存在：
```
https://dengzhijie1997.github.io/sales/icons/icon-192x192.png
https://dengzhijie1997.github.io/sales/icons/icon-512x512.png
```

## 2. 清除浏览器缓存

### 电脑浏览器

1. 打开Chrome开发者工具 (F12)
2. 右键点击刷新按钮，选择"清空缓存并硬性重新加载"
3. 或者访问 `https://dengzhijie1997.github.io/sales/?debug=true` 使用页面上的"清除PWA缓存"按钮

### 移动设备

1. 删除现有的PWA安装
2. 进入浏览器设置，清除浏览记录和网站数据
3. 重新访问网站

## 3. 验证PWA配置

访问 `https://dengzhijie1997.github.io/sales/direct-test.html` 页面：

- 如果能看到图标正常显示，说明图标文件本身没问题
- 查看"测试图标路径"结果，确认所有图标都能正确获取
- 如果图标显示正常但PWA安装后仍无图标，可能是manifest解析问题

## 4. 使用Lighthouse验证

1. 在Chrome开发者工具中，选择Lighthouse选项卡
2. 勾选"Progressive Web App"项
3. 点击"Generate report"
4. 查看PWA相关问题，特别是与manifest和图标相关的部分

## 5. 重新安装PWA

清除缓存后，重新安装PWA应用：

### iOS (Safari)
1. 打开 `https://dengzhijie1997.github.io/sales/`
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 确认图标是否正确显示

### Android (Chrome)
1. 打开 `https://dengzhijie1997.github.io/sales/`
2. 从菜单中选择"安装应用"或等待安装提示出现
3. 确认图标是否正确显示

## 特别说明

如果以上步骤全部执行后仍有问题，请确认：

1. GitHub Pages是否已更新 (有时需要几分钟)
2. 尝试将图标文件直接放在根目录 (`/sales/` 而不是 `/sales/icons/`)
3. 检查图标文件格式是否为有效的PNG格式

修复路径后的主要变化：
- 所有路径现在以 `/sales/` 开头，匹配GitHub Pages的部署结构
- 增加了缓存版本号，强制刷新旧缓存
- 添加了直接测试工具，帮助排查问题 