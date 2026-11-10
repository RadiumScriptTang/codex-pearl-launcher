# v0.2.0-alpha.2 — 中文部署入口与简洁安装包

此版本为预发布，只调整发行包结构、部署入口和说明。**Mac 已有安装后点击无反应的反馈，本版没有修复该启动问题。**

## 安装包现在怎么用

完整解压对应平台 ZIP，顶层只有三项：

```text
01 一键部署 Codex（Windows）.cmd   或   01 一键部署 Codex（macOS）.command
02 使用说明.txt
程序文件/
```

- 部署入口排在最前面，双击即可运行安装；Mac 入口用终端打开。
- 图片、三条原始语音、混音、代码和平台运行时都收进「程序文件」，无需另装 Node.js。
- 安装完成后，Windows 打开桌面「Codex」；Mac 打开桌面「Codex Pearl.app」，或在 Finder 前往 `~/Applications` 找到它，可拖到 Dock。
- 安装不会自动启动或重启 Codex。使用前需已安装官方 Codex；ChatGPT 是另一个应用。
- Windows 仅 x64；Mac 仅 Apple Silicon（M 系列），不包含 Intel 版本。
- 源码 ZIP 顶层只有「01 源码说明.txt」和「程序文件」，没有平台运行时。需要一键安装请下载对应平台 ZIP。

## 本机排障

用出问题电脑上的 Codex 打开「程序文件」，复制其中 `docs/REPAIR_PROMPT.zh-CN.md` 的提示词，直接读取本机代码和日志、修复并验证。该文档已随安装包离线提供，也可 [在线查看](https://github.com/RadiumScriptTang/codex-pearl-launcher/blob/main/docs/REPAIR_PROMPT.zh-CN.md)。

## 验证边界

本版检查发行包顶层布局、中文路径、平台运行时、素材完整性及 Mac 脚本执行位。Windows 解压后的内置 Node、构建、语法和模拟交接流程在临时目录中验证，不会启动或重启 Codex。

Mac 原生 WebKit、声音、窗口过渡和新聊天跳转仍待本机修复与验收。应用未签名、未 notarize；首次打开按系统提示确认，不移除隔离属性、不关闭 Gatekeeper。

皮肤仍为实验附加功能，Windows 自动接入依赖已安装的 Dream Skin 辅助脚本；Mac 皮肤未验证。

请对照 SHA256SUMS.txt 校验下载文件。代码和素材权利范围见程序文件中的 ASSETS.md。
