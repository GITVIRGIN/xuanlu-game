# 《黑山酒馆》R20 运行说明

## Windows 一键打开（推荐）

1. 下载或克隆本分支，并完整保留目录结构。
2. 确保电脑已安装 Node.js，且 `node.exe` 可以从命令行运行。
3. 双击项目根目录的 `一键打开黑山酒馆.cmd`。

启动器会自动寻找可用本地端口、在后台启动静态服务并打开默认浏览器。项目使用
ES Module，请不要直接双击 `index.html`；`file://` 方式会被浏览器安全策略阻止。

## PowerShell 启动（备用）

在项目根目录执行：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\startHeishan.ps1
```

只启动并返回服务信息、不自动打开浏览器：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\startHeishan.ps1 -NoOpen -PassThru
```

默认从 `http://127.0.0.1:4173/` 开始寻找可用端口。

## 当前可玩内容

- 九名人物、六条路线，其中三名人物与三条路线需要逐步解锁。
- 人物、路线和关键物件均进入世界卷宗；未解锁档案提供非剧透追索线索。
- 一名主角与至多三名同行者；伙伴拥有独立行动、生命、倒地与复起状态。
- 普通、精锐和首领战斗；压力增减、破局目标和完整终局战报均为玩家可见机制。
- 27 节点单局流程，包含抉择、战利、酒馆、普通战、精锐战、首领与结算。
- 本地离线存档，不含账号、远程 API、广告、分析或支付 SDK。

## 常见问题

### 打开后黑屏

确认地址栏是 `http://127.0.0.1:端口/`，而不是 `file:///.../index.html`。关闭直接打开的
页面后，重新运行 `一键打开黑山酒馆.cmd`。

### 提示找不到 Node.js

安装 Node.js 后重新打开命令行，执行 `node --version` 确认可以识别，再运行启动器。

### 端口 4173 被占用

启动器会自动尝试后续端口，无需手工修改文件。

## 权利与发布边界

本分支是可玩工程快照，不代表外部法律、商标、原生硬件或商业发行接受已经完成。
公开或商业使用前，请阅读 `LEGAL_REVIEW_REQUIRED.md` 与 `THIRD_PARTY_NOTICES.md`，并由
项目所有者完成相应审查。
