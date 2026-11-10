# v0.2.0-alpha.1 — 完整素材与双平台安装包

此版本为预发布。按作者要求先发布，再做 Mac 实机验收。

- Windows：安装到当前用户目录，生成名为 Codex 的桌面快捷方式；附带运行时，不要求单独安装 Node.js。
- macOS：安装为 ~/Applications/Codex Pearl.app，可拖到 Dock；附带 Apple Silicon（M 系列） 运行时，通过系统 AppKit + WebKit 播放开场。
- 两端共享同一时间线、全部实际使用图片、原始语音、混音和生成提示词。
- 不替换官方 Codex，不自动退出或重启现有 Codex。新聊天使用官方 codex://threads/new 链接。

## 验证边界

Windows 的原始开场和窗口过渡已在作者电脑运行；本版打包安装器需用户确认路径与环境。
本版通过 JavaScript、PowerShell 静态检查，以及无需打开 Codex 的回环认证、播放状态与正常退出流程测试。
Mac 代码在 Windows 进行了静态检查，但尚未在 Mac 执行，原生 WebKit、声音、窗口层级、Dock 启动和新聊天跳转均待实机验收。
Mac 应用未签名、未 notarize；首次打开按系统提示由用户确认，不移除隔离属性、不关闭 Gatekeeper。
图片皮肤为实验附加功能，当前自动连接脚本依赖 Windows 上已安装的 Dream Skin 辅助脚本；Mac 首版以开场和新聊天跳转为验收范围，皮肤接入尚未验证。

请对照 SHA256SUMS.txt 检查下载文件。素材权利范围见 ASSETS.md。

