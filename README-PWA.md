# PWA图标准备指南

为了使您的咖啡豆销售数据管理系统成为完整的PWA应用，您需要准备以下尺寸的图标。您已经有了一个非常好的图标设计（咖啡杯和数据表格），可以用作PWA图标的基础。

## GitHub Pages 部署注意事项

您的应用部署在 `https://dengzhijie1997.github.io/sales/`，所有PWA相关文件已调整为使用相对路径。上传以下文件到您的GitHub仓库：

- `manifest.json`
- `sw.js` 
- 所有图标文件 (放在icons目录)
- 更新后的`index.html`

## 所需的图标尺寸

请将您的图标裁剪/调整为以下尺寸并保存到`icons`目录：

1. icon-72x72.png (72×72像素)
2. icon-96x96.png (96×96像素)
3. icon-128x128.png (128×128像素)
4. icon-144x144.png (144×144像素)
5. icon-152x152.png (152×152像素)
6. icon-192x192.png (192×192像素)
7. icon-384x384.png (384×384像素)
8. icon-512x512.png (512×512像素)

## 如何创建这些图标

### 方法1：使用在线工具

1. 访问PWA图标生成器网站，如 [PWA Builder](https://www.pwabuilder.com/imageGenerator) 或 [App Icon Generator](https://appicon.co/)
2. 上传您的原始图片（建议使用高分辨率版本）
3. 生成所有所需尺寸的图标
4. 下载并将它们放在项目的`icons`目录中

### 方法2：使用图像编辑软件

如果您有Photoshop、GIMP或其他图像编辑软件，您可以：

1. 打开您的原始图标图像
2. 创建所需尺寸的副本
3. 确保图标在较小尺寸下仍然清晰可见
4. 导出为PNG格式并命名为上述文件名
5. 将它们放在项目的`icons`目录中

## 图标要求

- 所有图标应为PNG格式，带透明背景
- 图标应居中，周围有适当的空白
- 图标设计应在小尺寸下仍然清晰可辨

## 验证PWA

部署后，您可以使用以下方法检查PWA是否工作正常：

1. 在Chrome中打开您的网站 `https://dengzhijie1997.github.io/sales/`
2. 打开开发者工具 (按F12)
3. 转到"应用程序" (Application) 选项卡
4. 检查"Service Workers"和"Manifest"部分是否正确显示
5. 如果一切配置正确，您应该能够在地址栏右侧看到"安装"图标

完成这些步骤后，您的PWA将拥有正确的图标，可以在各种设备上安装并显示您的品牌。 