# 官方内置插件补充（第二期）

## 目标

在第一期内容型插件之外，把当前官方安装资产中可按 MIT 或 Apache-2.0 许可随开源版分发的插件接入同一套 discovery、filesystem seed、SEA 资产和 MCP 配置路径。

## 本期范围

- `android-emulator@zcode-plugins-official`：MIT；本地 MCP，运行时依赖 Android SDK、JDK、ADB 和可用的 AVD/设备。
- `ios-simulator@zcode-plugins-official`：MIT；本地 MCP，运行时仅支持 macOS/Xcode/iOS Simulator。
- `image-search@zcode-plugins-official`：Apache-2.0；HTTP MCP，依赖 `ZCODE_BASE_URL` 对应的官方服务和登录态。
- `computer-use@zcode-plugins-official`：MIT 技能/SDK 资产；复用现有 `node_repl` 宿主，不复制 `node_modules` 或平台原生 Helper。

第一期的 `browser-use`、`node-repl-host`、`plugin-creator`、`skill-creator`、`zcode-guide` 和 `restore-legacy-sessions` 保持不变。

## 不纳入

- `documents`、`pdf`、`presentations`、`spreadsheets`：官方安装资产中的技能许可证仅允许个人、教育和非商业使用，取得重新分发授权前不得复制到 Apache-2.0 仓库。
- Android SDK、JDK、Xcode、模拟器镜像、设备数据和 Computer Use 原生 Helper：它们属于用户或平台环境，不作为插件资产提交。
- 任何 `node_modules`、凭据、缓存、临时文件和机器特定路径。

## 所有权与运行边界

- `official-plugin-definitions.ts` 是插件名称、版本、默认启用状态、平台/远程说明和必需 seed 路径的唯一产品定义。
- `bundled-plugins.ts` 负责 discovery、哈希校验、filesystem/SEA seed 和缓存原子刷新；它不负责安装 Android/iOS SDK，也不负责远程服务鉴权。
- `sea-official-plugin-assets.mjs` 只嵌入插件自身的静态文件；本地 MCP 的 `dist/mcp/server.js` 必须存在，远程 Image Search 只嵌入 manifest。
- `official-plugin-runtime.ts` 继续负责带 stdio MCP 的官方 manifest 重写；Image Search 的 HTTP MCP 保持官方鉴权声明，由现有 official MCP credential path 注入登录态。
- `node_repl` 仍只有 `node-repl-host` 一个宿主。Computer Use 只提供 SDK/技能和现有宿主桥接，不新增第二个 node_repl server。
- Android、iOS、Computer Use 默认关闭；用户显式启用后才进入 discovery/MCP 工具池。Image Search 是否可用由现有登录态和官方 endpoint 决定。

## 事件顺序

```text
源码/SEA 插件资产
  → definition 与 SEA manifest 版本匹配
  → requiredSeedPaths / runtime 入口校验
  → ~/.zcode/cli/plugins/cache 原子刷新
  → plugin.json 读取与官方 MCP 归属
  → 用户显式启用本地/桌面能力，或登录态允许远程 MCP
  → MCP server 启动 / HTTP MCP 请求
```

## 不变量

1. definition、plugin manifest、package version 和 SEA manifest 的名称/版本必须一致。
2. 任何缺少 required seed 或本地 MCP runtime 的插件都不能生成可用的残缺缓存。
3. SEA 与 filesystem seed 都跳过 `node_modules`，不提交平台二进制、SDK、模拟器镜像或凭据。
4. 本地 MCP 的命令统一经官方 plugin host 启动；Image Search 不被误改写为 stdio。
5. node_repl 只有一个宿主；Browser Use 和 Computer Use 共享宿主，不重复注册。
6. Windows 开发态可以发现 Android/Image Search/Computer Use 资产，但 iOS MCP 只有在 macOS/Xcode 环境中才具备执行前提。

## 验收场景

| 场景         | 预期                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| 开发态 seed  | 四个第二期插件进入官方缓存，缺失资产会按插件单独降级并给出名称/路径               |
| SEA 构建     | manifest 包含第二期插件及第一期插件，不包含任何 `node_modules`                    |
| Android 启用 | 无 SDK/AVD 时插件仍能列出，但 MCP preflight 明确报告环境缺失，不阻断 ZCode 启动   |
| iOS 启用     | Windows 上不声称可执行；macOS + Xcode 环境才允许实际调用                          |
| Image Search | 未登录或官方服务不可达时只报告 MCP 不可用，不内置 token、不改写远程 URL           |
| Computer Use | 复用 `node_repl`，不产生第二个 node_repl server；缺少原生 Helper 时保持显式不可用 |

## 验证

- `node --test apps/zcode-cli/packages/cli/scripts/sea-official-plugin-assets.test.mjs`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm architecture:check --changed`
- Windows 本地启动验证：官方缓存生成、插件列表和默认关闭状态；不把 Android/iOS 真机或官方远程服务可用性冒充为本机测试结果。
