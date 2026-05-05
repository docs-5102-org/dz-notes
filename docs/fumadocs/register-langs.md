# Fumadocs 注册自定义标记语言

这篇文档整理当前项目里，如何给 `fumadocs-mdx + Shiki` 注册新的代码高亮语言。

适用场景：

- 代码块语言不被识别，出现 `ShikiError: Language 'xxx' is not included in this bundle`
- 需要新增 PlantUML 这类 Shiki 默认不内置的语言
- 需要把项目里常见别名统一映射到可识别语言，例如 `properties -> ini`、`gradle -> groovy`

当前项目已经有可复用脚本：

- `scripts/convert-grammar.mjs`

实际配置文件：

- `source.config.ts`

官方文档地址：`https://www.fumadocs.dev/docs/headless/mdx/rehype-code`

---

## 1. 原理

Fumadocs 的代码高亮底层走的是 Shiki。

项目里配置入口在 `source.config.ts`：

```ts
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: [
        'bash',
        'groovy',
        'ini',
        // 自定义 grammar
      ],
      langAlias: {
        cmd: 'bat',
        env: 'ini',
        dotenv: 'ini',
        properties: 'ini',
        gradle: 'groovy',
      },
    },
  },
});
```

可以把注册分成两类：

1. **内置语言别名映射**
   例如 `gradle` 实际映射到 `groovy`
2. **外部 TextMate grammar 注册**
   例如 PlantUML 这种需要先准备 grammar JSON

---

## 2. 只做别名映射

如果语言本身不需要额外 grammar，只是名字不标准，优先用 `langAlias`。

例如：

```ts
langAlias: {
  cmd: 'bat',
  dotenv: 'ini',
  env: 'ini',
  gradle: 'groovy',
  gitignore: 'ini',
  ignore: 'ini',
  properties: 'ini',
  shell: 'bash',
  redis: 'bash',
}
```

这类配置适合处理：

- ````md
  ```cmd
  ````
- ````md
  ```properties
  ````
- ````md
  ```gradle
  ````

这也是当前项目已经在使用的方式。

---

## 3. 注册外部 grammar

如果语言不是简单别名，而是需要完整高亮规则，就要提供 TextMate grammar。

典型例子：PlantUML。

### 3.1 准备 grammar 文件

很多社区 grammar 文件是：

- YAML 格式的 `.tmLanguage`
- 或 `.yaml-tmLanguage`

但 Shiki 更容易直接消费 JSON 格式，所以需要先转换成：

- `.tmLanguage.json`

---

## 4. 使用现有脚本转换 grammar

项目里已经有脚本：

```bash
node scripts/convert-grammar.mjs <input 或 URL> [output.json]
```

示例：

```bash
node scripts/convert-grammar.mjs plantuml.tmLanguage
```

或指定输出目录：

```bash
node scripts/convert-grammar.mjs plantuml.tmLanguage grammars/plantuml.tmLanguage.json
```

也支持直接传远程 raw URL：

```bash
node scripts/convert-grammar.mjs \
  https://raw.githubusercontent.com/qjebbs/vscode-plantuml/master/syntaxes/plantuml.yaml-tmLanguage \
  grammars/plantuml.tmLanguage.json
```

---

## 5. GitHub 地址要用 raw

下面这种地址不能直接给脚本当远程源：

```text
https://github.com/qjebbs/vscode-plantuml/blob/master/syntaxes/plantuml.yaml-tmLanguage
```

要改成：

```text
https://raw.githubusercontent.com/qjebbs/vscode-plantuml/master/syntaxes/plantuml.yaml-tmLanguage
```

转换规则：

- `github.com` -> `raw.githubusercontent.com`
- 去掉路径中的 `/blob`

---

## 6. 在 source.config.ts 里注册

当前项目已经按这个模式注册了 PlantUML。

示例结构：

```ts
import fs from 'node:fs';
import path from 'path/win32';

const plantumlGrammar = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'grammars/plantuml.tmLanguage.json'),
    'utf-8'
  )
);

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: [
        'bash',
        'groovy',
        'ini',
        {
          ...plantumlGrammar,
          name: 'plantuml',
          aliases: ['puml', 'pu', 'wsd'],
        },
      ],
    },
  },
});
```

关键点：

- `langs` 里可以混合字符串和对象
- 字符串表示 Shiki 已支持的语言
- 对象表示手动注入的 grammar
- `name` 是最终代码块语言名
- `aliases` 是可选别名

这样就能支持：

````md
```plantuml
@startuml
Alice -> Bob: Hello
@enduml
```
````

以及：

````md
```puml
@startuml
Alice -> Bob: Hello
@enduml
```
````

---

## 7. 当前项目里的实际状态

当前仓库已经具备：

- `grammars/plantuml.tmLanguage.json`
- `source.config.ts` 中的 PlantUML 注册
- `scripts/convert-grammar.mjs` 转换脚本

也就是说，PlantUML 这条链路已经通了。

如果你要继续加别的语言，流程直接复用：

1. 找到对应的 TextMate grammar
2. 转成 JSON
3. 放到 `grammars/`
4. 在 `source.config.ts` 的 `langs` 中注册
5. 如有别名，再补 `langAlias`

---

## 8. 常见错误

### 8.1 `Language 'xxx' is not included in this bundle`

原因通常有两种：

1. `langs` 里没注册
2. 代码块语言名和实际注册名不一致

排查顺序：

1. 看代码块写的是不是 `xxx`
2. 看 `langAlias` 里有没有映射
3. 看 `langs` 里有没有这个语言或 grammar 对象

---

### 8.2 传了 GitHub 页面地址，脚本报错

原因：

- 传的是 GitHub 页面 URL，不是 raw URL

处理：

- 换成 `raw.githubusercontent.com/...`

---

### 8.3 grammar 是 YAML，Shiki 不识别

原因：

- 直接把 YAML grammar 当 JSON 用了

处理：

- 先跑 `scripts/convert-grammar.mjs`

---

## 9. 推荐操作模板

如果以后再加一个新语言，直接按这个最小流程：

```bash
# 1. 下载或准备 grammar 源文件

# 2. 转成 JSON
node scripts/convert-grammar.mjs <input.tmLanguage or raw-url> grammars/<name>.tmLanguage.json

# 3. 在 source.config.ts 里引入并注册

# 4. 跑校验
pnpm types:check
```

---

## 10. 补充建议

- 能用 `langAlias` 解决的，不要上外部 grammar
- 外部 grammar 文件统一放 `grammars/`
- 语言别名统一在 `source.config.ts` 集中维护
- 新增语言后，至少用一个真实代码块验证渲染
- 如果只是为了兼容历史文档，优先做语言别名收敛，例如：
  - `properties -> ini`
  - `gradle -> groovy`
  - `cmd -> bat` 或按项目约定收敛为 `bash`

---

## 11. 相关文件

- `source.config.ts`
- `scripts/convert-grammar.mjs`
- `grammars/plantuml.tmLanguage.json`
