# 网络安全文档目录重构设计

## 目标

将 `content/docs/network-security` 从当前的混合工具目录，整理为按网络安全主题划分、可持续扩展的文档结构。重构后导航应直接表达文章用途，并修复当前存在的空目录、缺失目录登记和文件名拼写问题。

## 设计原则

- 一级目录按安全主题划分，不按零散工具名称划分。
- 只有存在实际内容的主题才建立目录，不创建无正文的占位文章。
- 每个目录都包含 `index.mdx` 和 `meta.json`。
- `index.mdx` 负责简介和文章导航，`meta.json` 负责侧边栏标题与顺序。
- 同步更新站内链接，不保留旧目录的重复文档。
- 公共资源继续使用现有 `/assets/...` 路径，不迁移 `public/assets`。

## 目标目录

```text
network-security/
├── index.mdx
├── meta.json
├── fundamentals/
│   ├── index.mdx
│   └── meta.json
├── reconnaissance/
│   ├── index.mdx
│   ├── meta.json
│   ├── crawler/
│   │   ├── index.mdx
│   │   ├── meta.json
│   │   ├── bilibili.mdx
│   │   ├── douyin-ranking-api.mdx
│   │   ├── douyin-kuaishou-resources.mdx
│   │   └── chrome-event-listener.mdx
│   └── verification-services/
│       ├── index.mdx
│       ├── meta.json
│       └── code-reception.mdx
├── proxy-and-anonymity/
│   ├── index.mdx
│   ├── meta.json
│   ├── proxy-tools.mdx
│   ├── socks5-vs-http.mdx
│   └── socks5-http-https.mdx
├── traffic-analysis/
│   ├── index.mdx
│   ├── meta.json
│   ├── packet-capture-tools.mdx
│   └── android-ca-capture.mdx
├── reverse-engineering/
│   ├── index.mdx
│   ├── meta.json
│   ├── mobile/
│   │   ├── index.mdx
│   │   ├── meta.json
│   │   ├── android-tuoke.mdx
│   │   └── frida.mdx
│   ├── web-and-api/
│   │   ├── index.mdx
│   │   ├── meta.json
│   │   ├── baidu-ai-tts-analyze.mdx
│   │   ├── douyin-creator-analyze.mdx
│   │   ├── douyin-upload-analyze.mdx
│   │   └── xiaohongshu-web-analyze.mdx
│   └── mini-program/
│       ├── index.mdx
│       ├── meta.json
│       └── automotive-mini-program-analyze.mdx
├── penetration-testing/
│   ├── index.mdx
│   └── meta.json
└── malware-and-phishing/
    ├── index.mdx
    └── meta.json
```

当前只有模拟器外部链接，没有对应 MDX 正文，因此不创建 `emulator-and-proxy.mdx` 占位文件。相关链接收录到 `traffic-analysis/index.mdx` 的“模拟器与环境”分组。

## 旧路径到新路径映射

### 基础知识

| 旧路径 | 新路径 |
| --- | --- |
| `comprehensive-knowledge/index.mdx` | `fundamentals/index.mdx` |
| `comprehensive-knowledge/meta.json` | `fundamentals/meta.json` |

### 信息收集与爬虫

| 旧路径 | 新路径 |
| --- | --- |
| `information-gathering-and-tools/crawler/bilili.mdx` | `reconnaissance/crawler/bilibili.mdx` |
| `information-gathering-and-tools/crawler/douyin-bandan-simple1.mdx` | `reconnaissance/crawler/douyin-ranking-api.mdx` |
| `information-gathering-and-tools/crawler/learn.mdx` | `reconnaissance/crawler/douyin-kuaishou-resources.mdx` |
| `information-gathering-and-tools/crawler/chrome-query-event.mdx` | `reconnaissance/crawler/chrome-event-listener.mdx` |
| `information-gathering-and-tools/code-reception.mdx` | `reconnaissance/verification-services/code-reception.mdx` |

原 `crawler/index.mdx` 中与抓包、证书和模拟器相关的导航迁移到 `traffic-analysis/index.mdx`；其余内容用于生成 `reconnaissance/index.mdx` 和 `reconnaissance/crawler/index.mdx`。

### 代理与匿名网络

| 旧路径 | 新路径 |
| --- | --- |
| `information-gathering-and-tools/proxy.mdx` | `proxy-and-anonymity/proxy-tools.mdx` |
| `information-gathering-and-tools/socks5-vs-http.mdx` | `proxy-and-anonymity/socks5-vs-http.mdx` |
| `information-gathering-and-tools/socks5-http-https.mdx` | `proxy-and-anonymity/socks5-http-https.mdx` |

### 流量分析与抓包

| 旧路径 | 新路径 |
| --- | --- |
| `information-gathering-and-tools/crawler/tools.mdx` | `traffic-analysis/packet-capture-tools.mdx` |
| `information-gathering-and-tools/crawler/android7-unknown-solution.mdx` | `traffic-analysis/android-ca-capture.mdx` |

### 逆向工程

| 旧路径 | 新路径 |
| --- | --- |
| `reverse-engineering/android-tuoke.mdx` | `reverse-engineering/mobile/android-tuoke.mdx` |
| `reverse-engineering/frida.mdx` | `reverse-engineering/mobile/frida.mdx` |
| `reverse-engineering/baidu-ai-tts-analyze.mdx` | `reverse-engineering/web-and-api/baidu-ai-tts-analyze.mdx` |
| `reverse-engineering/douyin-creator-analyze.mdx` | `reverse-engineering/web-and-api/douyin-creator-analyze.mdx` |
| `reverse-engineering/douyin-upload-analzye.mdx` | `reverse-engineering/web-and-api/douyin-upload-analyze.mdx` |
| `reverse-engineering/xhs-web-analze.mdx` | `reverse-engineering/web-and-api/xiaohongshu-web-analyze.mdx` |
| `reverse-engineering/mp-car-analyze.mdx` | `reverse-engineering/mini-program/automotive-mini-program-analyze.mdx` |

## 导航设计

顶层 `network-security/meta.json` 使用以下顺序：

1. `index`
2. `fundamentals`
3. `reconnaissance`
4. `proxy-and-anonymity`
5. `traffic-analysis`
6. `reverse-engineering`
7. `penetration-testing`
8. `malware-and-phishing`

对应中文标题：

- 网络安全基础
- 信息收集与爬虫
- 代理与匿名网络
- 流量分析与抓包
- 逆向工程
- 渗透测试
- 恶意软件与钓鱼

根目录页同步更新简介和分类入口，删除不存在的旧 `traffic-analysis` 登记后，以新建的实际目录重新登记。

## 链接与兼容策略

- 全仓库检索 `/docs/network-security/information-gathering-and-tools`、旧逆向工程文章路径和旧文件名，并更新为新路径。
- 不保留旧目录的重复 MDX 文件，也不新增旧路径重定向。
- 文档中的外部链接保持不变。
- `/assets/...` 公共资源路径保持不变。
- 迁移后删除已经为空的 `information-gathering-and-tools` 和 `comprehensive-knowledge` 目录。

## 内容整理范围

- 新建或重写各级 `index.mdx`，补齐 `title: 概览`、`subTitle`、`description` 和 `category`。
- 新建或更新各级 `meta.json`，保证 `pages` 与目录页顺序一致。
- 修正文档标题与文件名不一致、明显拼写错误和旧路径链接。
- 本次只调整结构、导航和必要的 MDX 元数据，不重写文章技术内容。

## 验证标准

- 所有 `meta.json` 都能被 JSON 解析。
- 每个实际目录都有 `index.mdx` 和 `meta.json`。
- `pages` 中登记的文件或目录全部存在。
- 全仓库不存在指向旧文档路径的内部链接。
- 目标目录不存在 `$withBase`、`:href=`、`:src=`、`v-bind:` 等旧 VuePress 语法。
- `pnpm.cmd types:check` 成功完成。
- 不运行完整生产构建；类型与 MDX 生成检查作为本次结构迁移的验证边界。
