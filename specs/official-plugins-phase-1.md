# 官方内置插件补充（第一期）

## 目标

让开源版在开发运行和 SEA 打包运行时都能发现并加载第一期官方内置插件，同时保留现有 Browser Use 与 Node REPL 的单一 seed、缓存和 MCP 注入路径。

## 本期范围

纳入以下 MIT 许可的内容型插件：

- `plugin-creator@zcode-plugins-official`
- `skill-creator@zcode-plugins-official`
- `zcode-guide@zcode-plugins-official`
- `restore-legacy-sessions@zcode-plugins-official`

Browser Use 与 `node-repl-host` 已存在于源码，本期只验证它们仍随 SEA 资产发布，不复制官方安装包中的 `node_modules` 或原生运行时。

## 明确不纳入

- `image-search`：HTTP MCP，连接 ZCode 官方服务，需单独的远程服务和隐私选择。
- `android-emulator`：本地 MCP，但依赖 Android SDK、JDK、ADB 和模拟器环境。
- `ios-simulator`：依赖 macOS/Xcode，不能作为 Windows 开源版默认能力。
- `computer-use`：当前开源 `zcode-cua` 是占位实现，缺少匹配 Electron/平台的原生 Helper。
- `documents`、`pdf`、`presentations`、`spreadsheets`：官方安装资产中的许可证仅允许个人、教育和非商业使用；在取得重新分发授权前不复制到 Apache-2.0 仓库。

## 所有权与边界

- 插件定义和默认启用规则由 `apps/zcode-cli/packages/bootstrap/src/app/official-plugin-definitions.ts` 负责。
- 插件文件的发现、哈希校验、缓存 seed 和 marketplace 分区由 `bundled-plugins.ts` 负责。
- SEA 构建只负责把已声明的插件文件嵌入发布物；不得在 SEA 构建阶段引入 `node_modules`、凭据或工作区文件。
- 插件自身的 `plugin.json` 是技能、命令和 MCP 声明的唯一来源；宿主不得另建一份 MCP 注册表。
- 内容型插件不新增协议状态、不写入会话数据库；`restore-legacy-sessions` 的写入行为仅由用户显式调用其命令/技能负责。

## 事件顺序

```text
源码/SEA 插件资产
  → 官方插件 seed 来源解析
  → requiredSeedPaths 校验与 SHA-256 计算
  → ~/.zcode/cli/plugins/cache 原子刷新
  → marketplace 分区投影
  → discovery 读取 plugin.json
  → 技能/命令进入对应会话
```

## 不变量

1. 定义中的插件名、版本、manifest 名称和 SEA 清单必须一致；不一致时构建或 seed 失败。
2. seed 只允许 `bundled-plugins.ts` 的顶层白名单，不得携带 `node_modules`、`.git`、凭据或临时文件。
3. 缺少任何 `requiredSeedPaths` 时，不生成残缺缓存，也不让残缺插件进入 discovery。
4. Browser Use 的 `node_repl` 仍由 `node-repl-host` 单独携带并由 `built-in-node-repl.ts` 注入，不在内容插件中重复注册。
5. 第一期开源版不默认启用远程 MCP 或需要平台原生运行时的插件。

## 验收场景

| 场景          | 预期                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| 开发态启动    | 四个 MIT 内容插件被 seed 到官方缓存并出现在 discovery 中                   |
| SEA 构建      | SEA manifest 包含四个插件、Browser Use 和 Node REPL；不包含 `node_modules` |
| 资产缺失      | 构建/seed 报出插件名和缺失路径，不生成可用的残缺插件                       |
| 版本不一致    | definition、manifest、SEA 清单无法静默混用旧缓存                           |
| Browser Use   | `node_repl` 仍只注册一个宿主 MCP，不因新增内容插件重复注册                 |
| 远程/原生插件 | 本期不被自动打包或默认启用                                                 |

## 验证

- `node --test apps/zcode-cli/packages/cli/scripts/sea-official-plugin-assets.test.mjs`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm architecture:check --changed`
