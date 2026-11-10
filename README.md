# Codex Pearl Launcher

海祇通行仪式 → 心海描线、飘发与睁眼 → 平滑显露 Codex 新聊天。

完整源码和实际使用的图片、三条原始语音、混音、提示词、图标均随仓库提供。代码使用 MIT；第三方素材的权利范围和来源见 [ASSETS.md](ASSETS.md)。

## 一键安装

- **Windows x64**：先「全部解压」Windows 发行包，双击 `01 一键部署 Codex（Windows）.cmd`。安装到当前用户 AppData，完成后双击桌面的 **Codex** 快捷方式。
- **macOS Apple Silicon（M 系列）**：先完整解压 Mac 发行包，双击 `01 一键部署 Codex（macOS）.command`，在终端等待安装完成。若没有在终端打开，可右键选择「打开方式 → 终端」。完成后双击桌面的 **Codex Pearl.app**，也可在 Finder 中前往 `~/Applications` 打开它，再拖到 Dock。

两个平台的安装包顶层都只有三项，部署入口排在第一项：

```text
01 一键部署 Codex（对应平台）.cmd / .command
02 使用说明.txt
程序文件/
```

代码、素材、原始语音、混音、运行时及本机修复提示词均收进「程序文件」。请保留整个解压目录，安装前不要单独移走部署入口。源码包顶层只有「01 源码说明.txt」与「程序文件」，不含运行时；一键安装请下载对应平台安装包。

发行包自带 Node.js，不必额外安装开发工具。安装完成不自动启动或重启 Codex。原始 Codex 保留。

Mac 首版为预发布，已有「安装后点击无反应」反馈，尚未确认根因或修复；本次只调整发行包结构和说明。应用未签名、未 notarize，首次打开由用户按系统提示确认。项目不关闭 Gatekeeper，不移除隔离属性。具体测试范围见 [RELEASE_NOTES.md](RELEASE_NOTES.md)。

## 安装后没反应或需要适配

在发生问题的电脑上，用 Codex 打开解压目录内的「程序文件」文件夹，复制其中的 [本机修复与适配提示词](docs/REPAIR_PROMPT.zh-CN.md)，让它直接读取启动代码与本机日志、修复并验证。直接克隆仓库时，打开仓库根目录即可。无需跨电脑搬运日志。

该文档包含项目入口、各平台排查路径和真实验收要求；模拟测试通过不等于原生界面通过。它是排障兜底，当前 Mac 启动失败问题尚未确认根因或修复。

## Mac 如何启动

Dock 固定的是 **Codex Pearl.app** 启动器，而不是原始 Codex。启动器使用系统 AppKit/WebKit 显示开场，通过官方 `codex://threads/new` 打开新聊天，然后淡出自己的窗口。

直接点击原始 Codex 仍保持官方启动行为。我们不替换二进制，也不劫持系统的全部 Codex 入口。

## 开发与预览

```sh
npm run build
npm run check
npm test
npm run preview
```

源码开发需要 Node.js 22+。预览地址为 `http://127.0.0.1:4173`，只播放动画，不操作 Codex。

`assets/local` 保存认证背景、透明印记、闭眼/睁眼人物与混音；`assets/audio-source` 保存原始语音和来源；`assets/prompts` 是生成提示词；`skin-v1` 保存壁纸及实验性 CSS 皮肤。

换角色或镜头后，需要同步修改 `intro.template.html` 内的描线和眼睑坐标。构建会把素材内嵌到离线 HTML。

## 实现与边界

使用本机随机回环端口和每次独立随机令牌传递播放状态，暂停不会被固定倒计时截断。不提交聊天、不自动重启或强制结束 Codex。

Windows 主流程使用独立 Edge 窗口与原生透明度过渡；Mac 主流程使用独立 WebKit 窗口。Mac 主流程待实机验收。

图片皮肤为实验附加功能。当前自动连接脚本依赖 Windows 用户已安装的 Dream Skin 辅助脚本；Mac 首版以开场与新聊天跳转为验收范围，皮肤接入尚未验证。不要向外部网络暴露应用调试端口。

本项目与 OpenAI、游戏发行方没有隶属关系。下载后请对照 Release 中的 SHA256SUMS.txt 校验文件。
