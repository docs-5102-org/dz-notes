# Java Concurrency Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the long mixed Java concurrency sidebar with seven semantic topic groups while preserving every technical article and updating all navigation and URLs.

**Architecture:** The migration renames the three legacy topic directories (`concurrent`, `queue`, `thread`) into semantic destinations, distributes their articles across seven domain folders, and adds six net-new topic index/meta pairs. A structure test defines the target navigation contract before files move, then repository-wide link and type checks validate the result.

**Tech Stack:** Fumadocs MDX, JSON navigation metadata, Node.js `node:test`, PowerShell filesystem moves, Next.js/TypeScript validation.

## Global Constraints

- Work only in `content/docs/languages/java/core-foundations/concurrent-programming` and files containing affected paths.
- Use English kebab-case for physical paths and Chinese topic titles for navigation.
- Preserve every technical article body and every existing uncommitted user edit.
- Only change the eleven article frontmatter titles listed in the approved specification.
- Do not create redirects or old URL compatibility pages.
- Do not stage or commit migrated content because the current worktree contains user-owned changes.
- Target subtree inventory: 70 MDX files, 13 JSON files, and 0 other files.
- Target complete Java inventory: 256 MDX files, 47 JSON files, and 4 other files.

---

## File Structure

**Root navigation**

- Modify `content/docs/languages/java/core-foundations/concurrent-programming/meta.json` to declare the seven topic directories.
- Modify `content/docs/languages/java/core-foundations/concurrent-programming/index.mdx` to link to those topics.

**Topic navigation pairs**

- Create or rewrite `fundamentals/{index.mdx,meta.json}`.
- Move and rewrite `threads/{index.mdx,meta.json}`.
- Move and rewrite `async-tasks/{index.mdx,meta.json}`.
- Create `thread-pools/{index.mdx,meta.json}` and `thread-pools/executors/{index.mdx,meta.json}`.
- Create `concurrent-collections/{index.mdx,meta.json}` and move/rewrite `concurrent-collections/blocking-queues/{index.mdx,meta.json}`.
- Create `locks-and-synchronizers/{index.mdx,meta.json}` and move/rewrite `locks-and-synchronizers/locks/{index.mdx,meta.json}`.
- Create `practice-and-resources/{index.mdx,meta.json}`.
- Move and rewrite `threads/thread-local/{index.mdx,meta.json}` and `threads/thread-groups/{index.mdx,meta.json}`.

**Tests**

- Modify `tests/java-doc-structure.test.mjs` to assert the new topic tree, inventory, and removal of legacy paths.

### Task 1: Define the target concurrency tree in a failing test

**Files:**

- Modify: `tests/java-doc-structure.test.mjs`

**Interfaces:**

- Consumes: the concurrency subtree rooted at `core-foundations/concurrent-programming`.
- Produces: assertions for topic order, key page ownership, legacy-path removal, and the new inventory.

- [x] **Step 1: Add the target topic map**

Add this constant below `expectedDomains`:

```js
const expectedConcurrencyTopics = {
  fundamentals: [
    'index',
    'intro',
    'atomic-variables',
    'cas',
    'volatile',
    'synchronized',
  ],
  threads: [
    'index',
    'intro',
    'thread-class',
    'runnable',
    'thread-status',
    'daemon-thread',
    'thread-interrupt',
    'safe-stop',
    'thread-sleep',
    'thread-join',
    'thread-is-alive',
    'thread-priority',
    'thread-set-name',
    'thread-wait-notify',
    'thread-local',
    'thread-groups',
  ],
  'async-tasks': [
    'index',
    'callable-vs-future',
    'future',
    'completable-future',
    'completion-service',
    'ffcc-difference',
  ],
  'thread-pools': [
    'index',
    'executor-service',
    'scheduled-executor-service',
    'executors',
    'rejected-execution-exception',
    'singleton-thread-pool-manager',
    'spring-boot-thread-pool',
  ],
  'concurrent-collections': [
    'index',
    'concurrent-map',
    'concurrent-hash-map',
    'blocking-queues',
  ],
  'locks-and-synchronizers': [
    'index',
    'locks',
    'count-down-latch',
  ],
  'practice-and-resources': [
    'index',
    'multithreaded-database',
    'grobo-utils',
    'reference',
  ],
};
```

- [x] **Step 2: Replace the old four-article ownership test with the full tree contract**

Replace `Java 8 concurrency articles belong to concurrent programming` with:

```js
test('Java concurrency documentation uses semantic topic groups', () => {
  const concurrencyRoot = join(
    javaRoot,
    'core-foundations',
    'concurrent-programming',
  );
  const rootMeta = JSON.parse(
    readFileSync(join(concurrencyRoot, 'meta.json'), 'utf8'),
  );

  assert.deepEqual(rootMeta.pages, [
    'index',
    'fundamentals',
    'threads',
    'async-tasks',
    'thread-pools',
    'concurrent-collections',
    'locks-and-synchronizers',
    'practice-and-resources',
  ]);

  for (const [topic, pages] of Object.entries(expectedConcurrencyTopics)) {
    const directory = join(concurrencyRoot, topic);
    const meta = JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, pages, `${topic}/meta.json page order`);
  }

  assert.deepEqual(
    JSON.parse(
      readFileSync(join(concurrencyRoot, 'thread-pools', 'executors', 'meta.json'), 'utf8'),
    ).pages,
    [
      'index',
      'cached-thread-pool',
      'fixed-thread-pool',
      'scheduled-thread-pool',
      'single-thread-executor',
    ],
  );
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        join(concurrencyRoot, 'concurrent-collections', 'blocking-queues', 'meta.json'),
        'utf8',
      ),
    ).pages,
    ['index', 'intro', 'principle', 'application'],
  );
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        join(concurrencyRoot, 'locks-and-synchronizers', 'locks', 'meta.json'),
        'utf8',
      ),
    ).pages,
    ['index', 'intro', 'reentrant-lock'],
  );

  for (const legacy of [
    'concurrent',
    'queue',
    'thread',
    'concurrent-1.mdx',
    'concurrent-2.mdx',
    'concurrent-3.mdx',
    'concurrent-4.mdx',
  ]) {
    assert.equal(existsSync(join(concurrencyRoot, legacy)), false, legacy);
  }
});
```

- [x] **Step 3: Update inventory expectations**

In `Java migration preserves the complete content inventory`, change:

```js
assert.equal(count('.mdx'), 256);
assert.equal(count('.json'), 47);
assert.equal(files.length - count('.mdx') - count('.json'), 4);
```

- [x] **Step 4: Run the structure test and verify RED**

Run:

```powershell
node --test tests/java-doc-structure.test.mjs
```

Expected: FAIL because `concurrent-programming/meta.json` still lists direct articles and legacy directories.

### Task 2: Move every existing article into its semantic destination

**Files:**

- Move: all current files under `concurrent/`, `queue/`, `thread/`, and the four root `concurrent-N.mdx` files.
- Create as destinations: the seven topic directories and required nested directories.

**Interfaces:**

- Consumes: 64 current MDX files, 7 current JSON files, and no other files.
- Produces: the approved physical article locations without changing article bodies.

- [x] **Step 1: Verify the source tree and target paths**

Run:

```powershell
$root = (Resolve-Path 'content\docs\languages\java\core-foundations\concurrent-programming').Path
$required = @('concurrent', 'queue', 'thread', 'concurrent-1.mdx', 'concurrent-2.mdx', 'concurrent-3.mdx', 'concurrent-4.mdx')
foreach ($relative in $required) {
  $source = (Resolve-Path (Join-Path $root $relative)).Path
  if (-not $source.StartsWith($root + '\')) { throw "Outside concurrency root: $source" }
  $source
}
```

Expected: seven existing source paths, all under the concurrency root.

- [x] **Step 2: Rename the three legacy directory trunks**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
Move-Item "$root\concurrent" "$root\async-tasks"
Move-Item "$root\thread" "$root\threads"
New-Item -ItemType Directory -Path "$root\concurrent-collections" -Force | Out-Null
Move-Item "$root\queue" "$root\concurrent-collections\blocking-queues"
```

Expected: `async-tasks`, `threads`, and `concurrent-collections/blocking-queues` exist; `concurrent`, `thread`, and `queue` do not.

- [x] **Step 3: Create the remaining destination directories**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
@(
  'fundamentals',
  'thread-pools',
  'thread-pools\executors',
  'locks-and-synchronizers',
  'practice-and-resources'
) | ForEach-Object {
  New-Item -ItemType Directory -Path (Join-Path $root $_) -Force | Out-Null
}
Move-Item "$root\async-tasks\lock" "$root\locks-and-synchronizers\locks"
Move-Item "$root\threads\threadlocal" "$root\threads\thread-local"
Move-Item "$root\threads\thread-group" "$root\threads\thread-groups"
```

- [x] **Step 4: Move and rename root and fundamentals articles**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
Move-Item "$root\concurrent-2.mdx" "$root\fundamentals\atomic-variables.mdx"
Move-Item "$root\concurrent-4.mdx" "$root\fundamentals\cas.mdx"
Move-Item "$root\async-tasks\intro.mdx" "$root\fundamentals\intro.mdx"
Move-Item "$root\threads\volatile.mdx" "$root\fundamentals\volatile.mdx"
Move-Item "$root\threads\synchronized.mdx" "$root\fundamentals\synchronized.mdx"
Move-Item "$root\concurrent-1.mdx" "$root\async-tasks\completable-future.mdx"
Move-Item "$root\concurrent-3.mdx" "$root\concurrent-collections\concurrent-map.mdx"
```

- [x] **Step 5: Distribute legacy `async-tasks` articles**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
$async = "$root\async-tasks"
Move-Item "$async\callable-future.mdx" "$async\callable-vs-future.mdx"
Move-Item "$async\executor-service.mdx" "$root\thread-pools\executor-service.mdx"
Move-Item "$async\scheduled-executor-service.mdx" "$root\thread-pools\scheduled-executor-service.mdx"
Move-Item "$async\new-cached-threadpool.mdx" "$root\thread-pools\executors\cached-thread-pool.mdx"
Move-Item "$async\new-fixed-threadpool.mdx" "$root\thread-pools\executors\fixed-thread-pool.mdx"
Move-Item "$async\new-scheduled-threadpool.mdx" "$root\thread-pools\executors\scheduled-thread-pool.mdx"
Move-Item "$async\new-single-thread-executor.mdx" "$root\thread-pools\executors\single-thread-executor.mdx"
Move-Item "$async\rejected-execution-exception.mdx" "$root\thread-pools\rejected-execution-exception.mdx"
Move-Item "$async\signle-threadpoolmanager.mdx" "$root\thread-pools\singleton-thread-pool-manager.mdx"
Move-Item "$async\spring-boot-threadpool.mdx" "$root\thread-pools\spring-boot-thread-pool.mdx"
Move-Item "$async\concurrent-hashmap.mdx" "$root\concurrent-collections\concurrent-hash-map.mdx"
Move-Item "$async\count-down-latch.mdx" "$root\locks-and-synchronizers\count-down-latch.mdx"
Move-Item "$async\multithread-batch.mdx" "$root\practice-and-resources\multithreaded-database.mdx"
Move-Item "$async\grobo-utils-starter.mdx" "$root\practice-and-resources\grobo-utils.mdx"
Move-Item "$async\reference-manual.mdx" "$root\practice-and-resources\reference.mdx"
```

Files remaining directly in `async-tasks`: `index.mdx`, `meta.json`, `callable-vs-future.mdx`, `future.mdx`, `completable-future.mdx`, `completion-service.mdx`, and `ffcc-difference.mdx`.

- [x] **Step 6: Normalize thread, queue, and lock filenames**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
Move-Item "$root\threads\thread-starter.mdx" "$root\threads\thread-class.mdx"
Move-Item "$root\threads\daemon.mdx" "$root\threads\daemon-thread.mdx"
Move-Item "$root\threads\thread-isalive.mdx" "$root\threads\thread-is-alive.mdx"
Move-Item "$root\threads\thread-setname.mdx" "$root\threads\thread-set-name.mdx"
Move-Item "$root\concurrent-collections\blocking-queues\blocking-queue-principle.mdx" "$root\concurrent-collections\blocking-queues\principle.mdx"
Move-Item "$root\concurrent-collections\blocking-queues\blocking-queue-application.mdx" "$root\concurrent-collections\blocking-queues\application.mdx"
Move-Item "$root\locks-and-synchronizers\locks\kcrs.mdx" "$root\locks-and-synchronizers\locks\reentrant-lock.mdx"
```

- [x] **Step 7: Confirm technical article inventory is preserved before adding indexes**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
$files = Get-ChildItem -LiteralPath $root -Recurse -File
"MDX=$(@($files | Where-Object Extension -eq '.mdx').Count)"
"JSON=$(@($files | Where-Object Extension -eq '.json').Count)"
```

Expected at this intermediate point: `MDX=64`, `JSON=7`.

### Task 3: Build the seven-topic navigation hierarchy

**Files:**

- Rewrite: all 13 target `meta.json` files.
- Create or rewrite: all 13 target `index.mdx` files.

**Interfaces:**

- Consumes: the physical article paths from Task 2.
- Produces: a complete Fumadocs navigation graph with Chinese topic labels.

- [x] **Step 1: Write the exact `meta.json` page arrays**

Use the titles and arrays below, with two-space JSON indentation and a trailing newline:

```text
concurrent-programming: 并发编程
[index, fundamentals, threads, async-tasks, thread-pools, concurrent-collections, locks-and-synchronizers, practice-and-resources]

fundamentals: 并发基础
[index, intro, atomic-variables, cas, volatile, synchronized]

threads: 线程基础
[index, intro, thread-class, runnable, thread-status, daemon-thread, thread-interrupt, safe-stop, thread-sleep, thread-join, thread-is-alive, thread-priority, thread-set-name, thread-wait-notify, thread-local, thread-groups]

threads/thread-local: ThreadLocal
[index, intro, initial-value, get, set, remove]

threads/thread-groups: 线程组
[index, intro, active-count, active-group-count, enumerate, get-max-priority, get-name, get-parent, interrupt, list]

async-tasks: 异步任务
[index, callable-vs-future, future, completable-future, completion-service, ffcc-difference]

thread-pools: 线程池
[index, executor-service, scheduled-executor-service, executors, rejected-execution-exception, singleton-thread-pool-manager, spring-boot-thread-pool]

thread-pools/executors: Executors 工厂方法
[index, cached-thread-pool, fixed-thread-pool, scheduled-thread-pool, single-thread-executor]

concurrent-collections: 并发容器
[index, concurrent-map, concurrent-hash-map, blocking-queues]

concurrent-collections/blocking-queues: 阻塞队列
[index, intro, principle, application]

locks-and-synchronizers: 锁与同步器
[index, locks, count-down-latch]

locks-and-synchronizers/locks: 锁
[index, intro, reentrant-lock]

practice-and-resources: 实战与资料
[index, multithreaded-database, grobo-utils, reference]
```

- [x] **Step 2: Write topic overview pages with exact copy and link order**

Every topic `index.mdx` uses `title: 概览`, the topic title as both `subTitle` and H1, then the description, introduction, heading, and links specified below.

Use these exact copy values:

| Path | Topic title | Description | Introduction | List heading |
| --- | --- | --- | --- | --- |
| root | 并发编程 | Java 并发编程与线程模型笔记 | 这里整理 Java 并发编程的基础概念、线程模型、异步任务、线程池、并发容器、锁与工程实践。 | 主题目录 |
| `fundamentals` | 并发基础 | Java 并发模型与同步基础 | 这里整理并发编程概念、原子操作、CAS、内存可见性与同步机制。 | 文档 |
| `threads` | 线程基础 | Java 线程创建、生命周期与协作 | 这里整理 Thread、Runnable、线程状态、生命周期控制、ThreadLocal 与线程组。 | 文档与子目录 |
| `async-tasks` | 异步任务 | Java Future 与异步任务模型 | 这里整理 Callable、Future、CompletableFuture 与 CompletionService。 | 文档 |
| `thread-pools` | 线程池 | Java 线程池接口、创建方式与应用 | 这里整理线程池核心接口、Executors 工厂方法、拒绝异常和 Spring Boot 集成。 | 文档与子目录 |
| `thread-pools/executors` | Executors 工厂方法 | Java Executors 线程池创建方式 | 这里整理 Executors 提供的四种常用线程池工厂方法。 | 文档 |
| `concurrent-collections` | 并发容器 | Java 并发集合与阻塞队列 | 这里整理 ConcurrentMap、ConcurrentHashMap 与 BlockingQueue。 | 文档与子目录 |
| `concurrent-collections/blocking-queues` | 阻塞队列 | Java 阻塞队列原理与应用 | 这里整理阻塞队列的基本概念、实现原理与典型应用。 | 文档 |
| `locks-and-synchronizers` | 锁与同步器 | Java 锁机制与并发同步工具 | 这里整理 Java 锁、可重入锁与 CountDownLatch。 | 文档与子目录 |
| `locks-and-synchronizers/locks` | 锁 | Java 锁机制笔记 | 这里整理 Java 锁的基础概念与可重入锁实现原理。 | 文档 |
| `practice-and-resources` | 实战与资料 | Java 并发实践与参考资料 | 这里整理多线程工程实践、测试工具和学习资料。 | 文档 |

Use these exact Markdown links beneath each list heading:

```mdx
<!-- concurrent-programming/index.mdx -->
- [并发基础](/docs/languages/java/core-foundations/concurrent-programming/fundamentals)
- [线程基础](/docs/languages/java/core-foundations/concurrent-programming/threads)
- [异步任务](/docs/languages/java/core-foundations/concurrent-programming/async-tasks)
- [线程池](/docs/languages/java/core-foundations/concurrent-programming/thread-pools)
- [并发容器](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections)
- [锁与同步器](/docs/languages/java/core-foundations/concurrent-programming/locks-and-synchronizers)
- [实战与资料](/docs/languages/java/core-foundations/concurrent-programming/practice-and-resources)

<!-- fundamentals/index.mdx -->
- [并发编程概述](/docs/languages/java/core-foundations/concurrent-programming/fundamentals/intro)
- [原子变量](/docs/languages/java/core-foundations/concurrent-programming/fundamentals/atomic-variables)
- [CAS 原理详解](/docs/languages/java/core-foundations/concurrent-programming/fundamentals/cas)
- [volatile 关键字](/docs/languages/java/core-foundations/concurrent-programming/fundamentals/volatile)
- [synchronized 同步机制](/docs/languages/java/core-foundations/concurrent-programming/fundamentals/synchronized)

<!-- threads/index.mdx -->
- [线程概述](/docs/languages/java/core-foundations/concurrent-programming/threads/intro)
- [Thread 类](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-class)
- [Runnable 接口](/docs/languages/java/core-foundations/concurrent-programming/threads/runnable)
- [线程状态](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-status)
- [守护线程](/docs/languages/java/core-foundations/concurrent-programming/threads/daemon-thread)
- [线程中断](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-interrupt)
- [线程的安全终止](/docs/languages/java/core-foundations/concurrent-programming/threads/safe-stop)
- [sleep](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-sleep)
- [join](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-join)
- [isAlive](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-is-alive)
- [线程优先级](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-priority)
- [设置线程名](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-set-name)
- [wait / notify](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-wait-notify)
- [ThreadLocal](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-local)
- [线程组](/docs/languages/java/core-foundations/concurrent-programming/threads/thread-groups)

<!-- async-tasks/index.mdx -->
- [Callable 与 Future](/docs/languages/java/core-foundations/concurrent-programming/async-tasks/callable-vs-future)
- [Future 接口](/docs/languages/java/core-foundations/concurrent-programming/async-tasks/future)
- [CompletableFuture](/docs/languages/java/core-foundations/concurrent-programming/async-tasks/completable-future)
- [CompletionService](/docs/languages/java/core-foundations/concurrent-programming/async-tasks/completion-service)
- [FFCC 区别](/docs/languages/java/core-foundations/concurrent-programming/async-tasks/ffcc-difference)

<!-- thread-pools/index.mdx -->
- [ExecutorService](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executor-service)
- [ScheduledExecutorService](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/scheduled-executor-service)
- [Executors 工厂方法](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executors)
- [RejectedExecutionException](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/rejected-execution-exception)
- [线程池工具类（单例模式）](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/singleton-thread-pool-manager)
- [Spring Boot 线程池应用](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/spring-boot-thread-pool)

<!-- thread-pools/executors/index.mdx -->
- [CachedThreadPool](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executors/cached-thread-pool)
- [FixedThreadPool](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executors/fixed-thread-pool)
- [ScheduledThreadPool](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executors/scheduled-thread-pool)
- [SingleThreadExecutor](/docs/languages/java/core-foundations/concurrent-programming/thread-pools/executors/single-thread-executor)

<!-- concurrent-collections/index.mdx -->
- [ConcurrentMap](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/concurrent-map)
- [ConcurrentHashMap](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/concurrent-hash-map)
- [阻塞队列](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/blocking-queues)

<!-- concurrent-collections/blocking-queues/index.mdx -->
- [概述](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/blocking-queues/intro)
- [阻塞队列原理](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/blocking-queues/principle)
- [阻塞队列应用](/docs/languages/java/core-foundations/concurrent-programming/concurrent-collections/blocking-queues/application)

<!-- locks-and-synchronizers/index.mdx -->
- [锁](/docs/languages/java/core-foundations/concurrent-programming/locks-and-synchronizers/locks)
- [CountDownLatch](/docs/languages/java/core-foundations/concurrent-programming/locks-and-synchronizers/count-down-latch)

<!-- locks-and-synchronizers/locks/index.mdx -->
- [Java 中的锁](/docs/languages/java/core-foundations/concurrent-programming/locks-and-synchronizers/locks/intro)
- [可重入锁实现原理](/docs/languages/java/core-foundations/concurrent-programming/locks-and-synchronizers/locks/reentrant-lock)

<!-- practice-and-resources/index.mdx -->
- [多线程数据库操作方案](/docs/languages/java/core-foundations/concurrent-programming/practice-and-resources/multithreaded-database)
- [GroboUtils 多线程测试](/docs/languages/java/core-foundations/concurrent-programming/practice-and-resources/grobo-utils)
- [Java 并发编程参考资料](/docs/languages/java/core-foundations/concurrent-programming/practice-and-resources/reference)
```

For `threads/thread-local` and `threads/thread-groups`, preserve their existing introductions, change links to their new prefixes, and change `subTitle`/H1 to `ThreadLocal` and `线程组` respectively.

- [x] **Step 3: Run the structure test**

Run:

```powershell
node --test tests/java-doc-structure.test.mjs
```

Expected after Task 3: navigation-target and inventory tests pass; tests that inspect old URLs may still fail until Task 4.

### Task 4: Update article titles and every affected URL

**Files:**

- Modify: eleven moved article frontmatter titles.
- Modify: every moved `index.mdx` containing legacy concurrency links.
- Modify: repository files returned by the old-path scan.

**Interfaces:**

- Consumes: final physical paths and navigation from Tasks 2–3.
- Produces: concise sidebar labels and links that resolve only to the new hierarchy.

- [x] **Step 1: Apply the approved frontmatter title changes**

Set these exact titles:

```text
threads/thread-class.mdx                         → Thread 类
threads/thread-status.mdx                        → 线程状态
threads/thread-wait-notify.mdx                   → wait / notify
async-tasks/callable-vs-future.mdx               → Callable 与 Future
async-tasks/ffcc-difference.mdx                   → FFCC 区别
thread-pools/executors/cached-thread-pool.mdx     → CachedThreadPool
thread-pools/executors/fixed-thread-pool.mdx      → FixedThreadPool
thread-pools/executors/scheduled-thread-pool.mdx  → ScheduledThreadPool
thread-pools/executors/single-thread-executor.mdx → SingleThreadExecutor
thread-pools/spring-boot-thread-pool.mdx           → Spring Boot 线程池应用
concurrent-collections/concurrent-hash-map.mdx    → ConcurrentHashMap
```

- [x] **Step 2: Replace old concurrency URL prefixes**

Apply this exact suffix map beneath `/docs/languages/java/core-foundations/concurrent-programming/`, longest source first. Restrict replacements to `content`, `tests`, `src`, and active documentation files; do not alter historical mapping tables in approved specifications.

```text
concurrent-1                                      → async-tasks/completable-future
concurrent-2                                      → fundamentals/atomic-variables
concurrent-3                                      → concurrent-collections/concurrent-map
concurrent-4                                      → fundamentals/cas
concurrent/callable-future                        → async-tasks/callable-vs-future
concurrent/future                                 → async-tasks/future
concurrent/completion-service                     → async-tasks/completion-service
concurrent/ffcc-difference                        → async-tasks/ffcc-difference
concurrent/intro                                  → fundamentals/intro
concurrent/executor-service                       → thread-pools/executor-service
concurrent/scheduled-executor-service             → thread-pools/scheduled-executor-service
concurrent/new-cached-threadpool                  → thread-pools/executors/cached-thread-pool
concurrent/new-fixed-threadpool                   → thread-pools/executors/fixed-thread-pool
concurrent/new-scheduled-threadpool               → thread-pools/executors/scheduled-thread-pool
concurrent/new-single-thread-executor             → thread-pools/executors/single-thread-executor
concurrent/rejected-execution-exception           → thread-pools/rejected-execution-exception
concurrent/signle-threadpoolmanager               → thread-pools/singleton-thread-pool-manager
concurrent/spring-boot-threadpool                 → thread-pools/spring-boot-thread-pool
concurrent/concurrent-hashmap                     → concurrent-collections/concurrent-hash-map
concurrent/count-down-latch                       → locks-and-synchronizers/count-down-latch
concurrent/lock/kcrs                              → locks-and-synchronizers/locks/reentrant-lock
concurrent/lock                                   → locks-and-synchronizers/locks
concurrent/multithread-batch                      → practice-and-resources/multithreaded-database
concurrent/grobo-utils-starter                    → practice-and-resources/grobo-utils
concurrent/reference-manual                       → practice-and-resources/reference
queue/blocking-queue-principle                    → concurrent-collections/blocking-queues/principle
queue/blocking-queue-application                  → concurrent-collections/blocking-queues/application
queue                                             → concurrent-collections/blocking-queues
thread/threadlocal                                → threads/thread-local
thread/thread-group                               → threads/thread-groups
thread/thread-starter                             → threads/thread-class
thread/daemon                                     → threads/daemon-thread
thread/thread-isalive                             → threads/thread-is-alive
thread/thread-setname                             → threads/thread-set-name
thread/volatile                                   → fundamentals/volatile
thread/synchronized                               → fundamentals/synchronized
thread                                            → threads
```

Run before and after replacement:

```powershell
rg -n '/docs/languages/java/core-foundations/concurrent-programming/(concurrent-[1-4]|concurrent|queue|thread)(/|\b)' content tests src
```

Expected before: current navigation references. Expected after: no results.

- [x] **Step 3: Verify every moved overview link follows its meta order**

Read each target `meta.json`, extract article links from its sibling `index.mdx`, and compare the slugs in order. Fix only index link order or paths; do not reorder article bodies.

- [x] **Step 4: Run the structure test and verify GREEN**

Run:

```powershell
node --test tests/java-doc-structure.test.mjs
```

Expected: every test passes, including semantic topic groups and `256/47/4` Java inventory.

### Task 5: Complete repository verification

**Files:**

- Verify: the full Java tree, Node tests, MDX generation, Next route types, and TypeScript types.

**Interfaces:**

- Consumes: all migrated content and updated links.
- Produces: completion evidence without staging user-owned changes.

- [x] **Step 1: Run every Node test**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: all tests pass with zero failures.

- [x] **Step 2: Run Fumadocs and TypeScript validation**

Run:

```powershell
npm.cmd run types:check
```

Expected: `fumadocs-mdx`, `next typegen`, and `tsc --noEmit` exit successfully.

- [x] **Step 3: Resolve every Java documentation URL**

Scan every Java MDX file for `/docs/languages/java/...` links. For each route, assert that either the matching `.mdx` file or directory exists beneath `content/docs/languages/java`.

Expected: zero unresolved Java links.

- [x] **Step 4: Confirm inventory and legacy-path removal**

Run:

```powershell
$root = 'content\docs\languages\java\core-foundations\concurrent-programming'
$files = Get-ChildItem -LiteralPath $root -Recurse -File
"MDX=$(@($files | Where-Object Extension -eq '.mdx').Count)"
"JSON=$(@($files | Where-Object Extension -eq '.json').Count)"
rg -n '/docs/languages/java/core-foundations/concurrent-programming/(concurrent-[1-4]|concurrent|queue|thread)(/|\b)' content tests src
```

Expected: `MDX=70`, `JSON=13`, and no old URL results.

- [x] **Step 5: Review whitespace and worktree state**

Run:

```powershell
git diff --check
git status --short -- 'content/docs/languages/java/core-foundations/concurrent-programming' tests
```

Expected: no whitespace errors. The status shows intended moves/additions plus preserved existing user modifications. Do not stage or commit migrated content.
