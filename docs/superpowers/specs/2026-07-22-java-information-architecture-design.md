# Java 文档目录重构设计

## 目标

重构 `content/docs/languages/java` 的物理目录、站点 URL 和导航结构，使 Java 笔记按领域组织，命名一致，并为后续扩展保留清晰边界。

本次重构同步修改目录、URL、各级 `meta.json`、各级 `index.mdx` 以及仓库内指向旧 Java 路径的链接。现有文档正文及工作区内尚未提交的正文修改必须保留。

## 设计原则

- 使用英文 kebab-case 作为物理目录名和 URL 片段。
- 使用简明中文作为分组导航标题。
- 一级目录表达领域，二级目录表达具体技术或主题。
- 每个一级分组均提供可点击的 `index.mdx` 概览页。
- 具体技术目录继续保留自身的 `index.mdx` 和 `meta.json`。
- 同一主题不在多个分组中重复出现。
- 不保留旧 URL；仓库内已知引用全部更新到新 URL。

## 目标目录

```text
content/docs/languages/java/
├── index.mdx
├── learning-resources.mdx
├── meta.json
├── core-foundations/
│   ├── index.mdx
│   ├── meta.json
│   ├── jvm/
│   ├── java-8/
│   ├── concurrent-programming/
│   ├── annotations/
│   └── regular-expressions/
├── template-engines/
│   ├── index.mdx
│   ├── meta.json
│   ├── freemarker/
│   ├── thymeleaf/
│   └── velocity/
├── persistence-frameworks/
│   ├── index.mdx
│   ├── meta.json
│   ├── jpa/
│   ├── hibernate/
│   └── mybatis/
├── web-frameworks/
│   ├── index.mdx
│   ├── meta.json
│   ├── struts2/
│   ├── spring/
│   ├── spring-boot/
│   ├── spring-cloud/
│   └── spring-webflux/
├── web-containers/
│   ├── index.mdx
│   ├── meta.json
│   ├── tomcat/
│   └── resin/
└── engineering-ecosystem/
    ├── index.mdx
    ├── meta.json
    ├── logging/
    ├── scheduling/
    ├── security-frameworks/
    ├── crawler-frameworks/
    └── font-processing/
        ├── index.mdx
        ├── meta.json
        └── ttf-fonts.mdx
```

## 路径映射

| 旧路径 | 新路径 |
| --- | --- |
| `intro.mdx` | `learning-resources.mdx` |
| `jvm/` | `core-foundations/jvm/` |
| `java8-tutorial/` | `core-foundations/java-8/` |
| `java-concurrent/` | `core-foundations/concurrent-programming/` |
| `annotation/` | `core-foundations/annotations/` |
| `regex/` | `core-foundations/regular-expressions/` |
| `freemarker/` | `template-engines/freemarker/` |
| `thymeleaf/` | `template-engines/thymeleaf/` |
| `velocity/` | `template-engines/velocity/` |
| `jpa/` | `persistence-frameworks/jpa/` |
| `hibernate/` | `persistence-frameworks/hibernate/` |
| `mybatis/` | `persistence-frameworks/mybatis/` |
| `struts2/` | `web-frameworks/struts2/` |
| `spring/` | `web-frameworks/spring/` |
| `spring-boot/` | `web-frameworks/spring-boot/` |
| `spring-cloud/` | `web-frameworks/spring-cloud/` |
| `spring-web-flux/` | `web-frameworks/spring-webflux/` |
| `tomcat/` | `web-containers/tomcat/` |
| `resin/` | `web-containers/resin/` |
| `log/` | `engineering-ecosystem/logging/` |
| `schedule/` | `engineering-ecosystem/scheduling/` |
| `security-framework/` | `engineering-ecosystem/security-frameworks/` |
| `crawler/` | `engineering-ecosystem/crawler-frameworks/` |
| `ttf.mdx` | `engineering-ecosystem/font-processing/ttf-fonts.mdx` |

## 导航设计

Java 根目录的 `meta.json` 按以下顺序展示：

1. 概览
2. Java 基础教程参考资料汇总
3. 核心基础
4. 模板引擎
5. 持久层框架
6. Web 框架
7. Web 容器
8. 工程与生态

每个一级分组的 `meta.json` 以 `index` 开头，随后按照目标目录中列出的技术顺序声明子目录。技术目录的页面次序原则上保持不变，只修改标题中不统一的分类名称。例如：

- `Java Concurrent` 改为“并发编程”。
- `Annotation` 改为“注解”。
- `Regex` 改为“正则表达式”。
- `Log` 改为“日志”。
- `Schedule` 改为“定时任务”。
- `Security Framework` 改为“安全认证框架”。
- `Crawler` 改为“爬虫框架”。

## 概览页设计

根 `index.mdx` 介绍 Java 笔记的总体范围，并分别链接到学习资源和六个领域分组。

每个一级分组的 `index.mdx` 包含：

- 与导航一致的中文标题和一句话说明。
- “子目录”列表，链接到分组中的具体技术目录。
- 不重复罗列具体技术目录内部的所有文章。

现有具体技术的 `index.mdx` 保留原有简介和文章列表，但所有绝对链接替换为新 URL。`web-frameworks/spring/index.mdx` 的文章列表和 `meta.json` 页面顺序保持一致。

`font-processing/index.mdx` 说明 Java 字体加载、处理和部署主题，并链接到 `ttf-fonts.mdx`；原 TTF 占位内容迁移到该页面，不扩写超出当前资料范围的技术内容。

## 链接迁移

迁移后，对整个仓库扫描以下引用并更新：

- MDX/Markdown 中以 `/docs/languages/java/` 开头的绝对链接。
- 源码、测试和设计文档中包含旧 Java 路径的字符串。
- Java 文档内引用同目录图片或资源的相对路径；目录整体移动时保持资源与引用的相对关系。

用户已明确允许 URL 随目录统一变更，因此不创建旧路径兼容页或重定向。

## 实施边界

- 只重构 `content/docs/languages/java` 及仓库内受新 URL 影响的引用。
- 不重写技术文章正文，不修正与目录迁移无关的内容问题。
- 不覆盖或撤销工作区中已有的未提交修改。
- 不修改与 Java 导航无关的站点功能。

## 验证标准

- 旧的 23 个 Java 一级主题均能在新结构中找到，且文档和资源文件数量没有意外减少。
- 所有目标目录都包含有效的 `meta.json` 和 `index.mdx`。
- 所有 `meta.json` 引用的页面或目录真实存在，且没有遗漏实际页面。
- 仓库中不存在指向旧 Java URL 或旧物理路径的活动引用；历史说明中如需保留旧路径，应明确标记为旧路径。
- MDX 生成和 TypeScript 类型检查通过。
- 相关测试中的文件路径同步更新并通过。
- `spring/meta.json` 与 `spring/index.mdx` 内容顺序一致，链接全部指向 `/docs/languages/java/web-frameworks/spring/...`。
