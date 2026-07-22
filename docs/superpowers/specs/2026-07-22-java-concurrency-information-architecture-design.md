# Java 并发编程目录重构设计

## 目标

重构 `content/docs/languages/java/core-foundations/concurrent-programming`，把当前直接文章、`Concurrent`、`Queue`、`Thread` 混合组成的长列表改成按知识领域组织的中文导航。

本次调整同步修改物理目录、URL、`meta.json`、`index.mdx`、文章标题和测试。技术正文保持不变，工作区中已有的未提交修改不得覆盖或撤销。

## 设计原则

- 并发编程根目录只展示概览和七个稳定主题入口。
- 目录名和 URL 使用语义化英文 kebab-case。
- 导航分组使用中文名称，Java API 和专有名词保留英文。
- 移除 `Concurrent`、`Queue`、`Thread` 这类范围模糊或中英混用的一级导航名称。
- 将 `concurrent-1` 至 `concurrent-4` 改为可以从文件名判断内容的语义化名称。
- 每个主题目录提供 `index.mdx` 和 `meta.json`，文章顺序按学习路径排列。
- 最深导航层级控制在三层主题目录之内。
- 不创建旧 URL 兼容页；仓库内活动引用全部迁移到新 URL。

## 目标目录

```text
concurrent-programming/
├── index.mdx
├── meta.json
├── fundamentals/                         # 并发基础
│   ├── index.mdx
│   ├── meta.json
│   ├── intro.mdx                         # 并发编程概述
│   ├── atomic-variables.mdx              # 原子变量
│   ├── cas.mdx                           # CAS 原理详解
│   ├── volatile.mdx                      # volatile 关键字
│   └── synchronized.mdx                  # synchronized 同步机制
├── threads/                              # 线程基础
│   ├── index.mdx
│   ├── meta.json
│   ├── intro.mdx
│   ├── thread-class.mdx
│   ├── runnable.mdx
│   ├── thread-status.mdx
│   ├── daemon-thread.mdx
│   ├── thread-interrupt.mdx
│   ├── safe-stop.mdx
│   ├── thread-sleep.mdx
│   ├── thread-join.mdx
│   ├── thread-is-alive.mdx
│   ├── thread-priority.mdx
│   ├── thread-set-name.mdx
│   ├── thread-wait-notify.mdx
│   ├── thread-local/
│   │   ├── index.mdx
│   │   ├── meta.json
│   │   ├── intro.mdx
│   │   ├── initial-value.mdx
│   │   ├── get.mdx
│   │   ├── set.mdx
│   │   └── remove.mdx
│   └── thread-groups/
│       ├── index.mdx
│       ├── meta.json
│       ├── intro.mdx
│       ├── active-count.mdx
│       ├── active-group-count.mdx
│       ├── enumerate.mdx
│       ├── get-max-priority.mdx
│       ├── get-name.mdx
│       ├── get-parent.mdx
│       ├── interrupt.mdx
│       └── list.mdx
├── async-tasks/                          # 异步任务
│   ├── index.mdx
│   ├── meta.json
│   ├── callable-vs-future.mdx
│   ├── future.mdx
│   ├── completable-future.mdx
│   ├── completion-service.mdx
│   └── ffcc-difference.mdx
├── thread-pools/                         # 线程池
│   ├── index.mdx
│   ├── meta.json
│   ├── executor-service.mdx
│   ├── scheduled-executor-service.mdx
│   ├── executors/                        # Executors 工厂方法
│   │   ├── index.mdx
│   │   ├── meta.json
│   │   ├── cached-thread-pool.mdx
│   │   ├── fixed-thread-pool.mdx
│   │   ├── scheduled-thread-pool.mdx
│   │   └── single-thread-executor.mdx
│   ├── rejected-execution-exception.mdx
│   ├── singleton-thread-pool-manager.mdx
│   └── spring-boot-thread-pool.mdx
├── concurrent-collections/               # 并发容器
│   ├── index.mdx
│   ├── meta.json
│   ├── concurrent-map.mdx
│   ├── concurrent-hash-map.mdx
│   └── blocking-queues/                  # 阻塞队列
│       ├── index.mdx
│       ├── meta.json
│       ├── intro.mdx
│       ├── principle.mdx
│       └── application.mdx
├── locks-and-synchronizers/              # 锁与同步器
│   ├── index.mdx
│   ├── meta.json
│   ├── count-down-latch.mdx
│   └── locks/
│       ├── index.mdx
│       ├── meta.json
│       ├── intro.mdx
│       └── reentrant-lock.mdx
└── practice-and-resources/               # 实战与资料
    ├── index.mdx
    ├── meta.json
    ├── multithreaded-database.mdx
    ├── grobo-utils.mdx
    └── reference.mdx
```

## 根导航顺序

`concurrent-programming/meta.json` 使用以下顺序：

1. `index`
2. `fundamentals`
3. `threads`
4. `async-tasks`
5. `thread-pools`
6. `concurrent-collections`
7. `locks-and-synchronizers`
8. `practice-and-resources`

对应侧边栏标题依次为：概览、并发基础、线程基础、异步任务、线程池、并发容器、锁与同步器、实战与资料。

## 现有内容映射

### 根目录文章

| 当前路径 | 目标路径 |
| --- | --- |
| `concurrent-1.mdx` | `async-tasks/completable-future.mdx` |
| `concurrent-2.mdx` | `fundamentals/atomic-variables.mdx` |
| `concurrent-3.mdx` | `concurrent-collections/concurrent-map.mdx` |
| `concurrent-4.mdx` | `fundamentals/cas.mdx` |

### 当前 `concurrent` 目录

| 当前路径 | 目标路径 |
| --- | --- |
| `concurrent/intro.mdx` | `fundamentals/intro.mdx` |
| `concurrent/callable-future.mdx` | `async-tasks/callable-vs-future.mdx` |
| `concurrent/future.mdx` | `async-tasks/future.mdx` |
| `concurrent/completion-service.mdx` | `async-tasks/completion-service.mdx` |
| `concurrent/ffcc-difference.mdx` | `async-tasks/ffcc-difference.mdx` |
| `concurrent/executor-service.mdx` | `thread-pools/executor-service.mdx` |
| `concurrent/scheduled-executor-service.mdx` | `thread-pools/scheduled-executor-service.mdx` |
| `concurrent/new-cached-threadpool.mdx` | `thread-pools/executors/cached-thread-pool.mdx` |
| `concurrent/new-fixed-threadpool.mdx` | `thread-pools/executors/fixed-thread-pool.mdx` |
| `concurrent/new-scheduled-threadpool.mdx` | `thread-pools/executors/scheduled-thread-pool.mdx` |
| `concurrent/new-single-thread-executor.mdx` | `thread-pools/executors/single-thread-executor.mdx` |
| `concurrent/rejected-execution-exception.mdx` | `thread-pools/rejected-execution-exception.mdx` |
| `concurrent/signle-threadpoolmanager.mdx` | `thread-pools/singleton-thread-pool-manager.mdx` |
| `concurrent/spring-boot-threadpool.mdx` | `thread-pools/spring-boot-thread-pool.mdx` |
| `concurrent/concurrent-hashmap.mdx` | `concurrent-collections/concurrent-hash-map.mdx` |
| `concurrent/count-down-latch.mdx` | `locks-and-synchronizers/count-down-latch.mdx` |
| `concurrent/lock/` | `locks-and-synchronizers/locks/` |
| `concurrent/multithread-batch.mdx` | `practice-and-resources/multithreaded-database.mdx` |
| `concurrent/grobo-utils-starter.mdx` | `practice-and-resources/grobo-utils.mdx` |
| `concurrent/reference-manual.mdx` | `practice-and-resources/reference.mdx` |

`concurrent/index.mdx` 与 `concurrent/meta.json` 属于旧导航结构，不迁移为文章；新主题概览替代其导航职责。

### 当前 `queue` 目录

| 当前路径 | 目标路径 |
| --- | --- |
| `queue/index.mdx` | `concurrent-collections/blocking-queues/index.mdx` |
| `queue/meta.json` | `concurrent-collections/blocking-queues/meta.json` |
| `queue/intro.mdx` | `concurrent-collections/blocking-queues/intro.mdx` |
| `queue/blocking-queue-principle.mdx` | `concurrent-collections/blocking-queues/principle.mdx` |
| `queue/blocking-queue-application.mdx` | `concurrent-collections/blocking-queues/application.mdx` |

### 当前 `thread` 目录

| 当前路径 | 目标路径 |
| --- | --- |
| `thread/index.mdx` | `threads/index.mdx` |
| `thread/meta.json` | `threads/meta.json` |
| `thread/intro.mdx` | `threads/intro.mdx` |
| `thread/thread-starter.mdx` | `threads/thread-class.mdx` |
| `thread/runnable.mdx` | `threads/runnable.mdx` |
| `thread/thread-status.mdx` | `threads/thread-status.mdx` |
| `thread/daemon.mdx` | `threads/daemon-thread.mdx` |
| `thread/thread-interrupt.mdx` | `threads/thread-interrupt.mdx` |
| `thread/safe-stop.mdx` | `threads/safe-stop.mdx` |
| `thread/thread-sleep.mdx` | `threads/thread-sleep.mdx` |
| `thread/thread-join.mdx` | `threads/thread-join.mdx` |
| `thread/thread-isalive.mdx` | `threads/thread-is-alive.mdx` |
| `thread/thread-priority.mdx` | `threads/thread-priority.mdx` |
| `thread/thread-setname.mdx` | `threads/thread-set-name.mdx` |
| `thread/thread-wait-notify.mdx` | `threads/thread-wait-notify.mdx` |
| `thread/volatile.mdx` | `fundamentals/volatile.mdx` |
| `thread/synchronized.mdx` | `fundamentals/synchronized.mdx` |
| `thread/threadlocal/` | `threads/thread-local/` |
| `thread/thread-group/` | `threads/thread-groups/` |

`thread/intro.mdx` 是包含示例代码的实质教程，迁移后保留为 `threads/intro.mdx`，导航标题使用“线程概述”。`threads/index.mdx` 只承担主题入口职责，不重复该教程正文。

## 页面标题优化

以下页面只调整 frontmatter `title` 和导航文案，不改技术正文：

| 目标页面 | 标题 |
| --- | --- |
| `threads/thread-class.mdx` | `Thread 类` |
| `threads/thread-status.mdx` | `线程状态` |
| `threads/thread-wait-notify.mdx` | `wait / notify` |
| `async-tasks/callable-vs-future.mdx` | `Callable 与 Future` |
| `async-tasks/ffcc-difference.mdx` | `FFCC 区别` |
| `thread-pools/executors/cached-thread-pool.mdx` | `CachedThreadPool` |
| `thread-pools/executors/fixed-thread-pool.mdx` | `FixedThreadPool` |
| `thread-pools/executors/scheduled-thread-pool.mdx` | `ScheduledThreadPool` |
| `thread-pools/executors/single-thread-executor.mdx` | `SingleThreadExecutor` |
| `thread-pools/spring-boot-thread-pool.mdx` | `Spring Boot 线程池应用` |
| `concurrent-collections/concurrent-hash-map.mdx` | `ConcurrentHashMap` |

## 概览页职责

- 根 `index.mdx` 只介绍七个主题并链接到主题概览。
- 主题 `index.mdx` 说明该主题的范围，并列出直属文章或子目录。
- `threads/index.mdx` 合并当前线程概览的有效说明，避免同时出现“概览”和“概述”。
- `blocking-queues/index.mdx`、`locks/index.mdx`、`thread-local/index.mdx`、`thread-groups/index.mdx` 保留各自的专题入口，但导航标题统一。
- `executors/index.mdx` 新增为四种 Executors 工厂方法的入口。

## URL 与链接迁移

- 所有 `/docs/languages/java/core-foundations/concurrent-programming/...` 旧 URL 更新为新主题路径。
- Java 并发目录内的绝对链接、相关测试文件路径和仓库内活动引用同步更新。
- 相对资源链接随文章移动保持可解析。
- 历史设计文档中的旧路径映射可以保留，但必须明确属于历史说明。

## 实施边界

- 只调整并发编程目录及受其 URL 影响的仓库内引用。
- 不改写技术文章正文，不扩充新的并发知识内容。
- 除明确列出的标题外，不统一润色文章标题。
- 不暂存或提交包含用户既有正文修改的迁移文件。

## 验证标准

- 并发编程根 `meta.json` 只包含 `index` 和七个主题目录。
- 每个 `meta.json` 条目均对应真实页面或目录，页面顺序与 `index.mdx` 一致。
- `concurrent-1` 至 `concurrent-4`、`concurrent/`、`queue/`、`thread/` 旧入口均不再存在于活动目录。
- 原有技术文章数量保持不变，所有正文文件均能在新结构中找到。
- 所有 Java 并发内部链接均可解析，仓库内不存在活动旧 URL。
- 结构测试覆盖根主题顺序、关键文件归属、导航目标和内容库存。
- 全量 Node 测试与 `npm.cmd run types:check` 通过。
