# Codex Pearl Launcher

海祇通行仪式 → 心海描线、飘发与睁眼 → 平滑显露 Codex 新聊天。

完整源码和实际使用的图片、三条原始语音、混音、提示词、图标均随仓库提供。代码使用 MIT；第三方素材的权利范围和来源见 [ASSETS.md](ASSETS.md)。

## 一键安装

- **Windows x64**：解压 Windows 发行包，双击根目录 `Install Windows.cmd`。安装到当前用户 AppData，创建名为 **Codex** 的桌面快捷方式。
- **macOS Apple Silicon（M 系列）**：解压 Mac 发行包，双击 `Install macOS.command`。安装到 `~/Applications/Codex Pearl.app`，桌面也会生成入口；将这个 App 拖到 Dock。

发行包自带 Node.js，不必额外安装开发工具。安装完成不自动启动或重启 Codex。原始 Codex 保留。

Mac 首版为预发布，尚未实机验收；未签名、未 notarize，首次打开由用户按系统提示确认。项目不关闭 Gatekeeper，不移除隔离属性。具体测试范围见 [RELEASE_NOTES.md](RELEASE_NOTES.md)。

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
