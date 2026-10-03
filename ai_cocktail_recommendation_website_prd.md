# AI Cocktail Recommendation Web App
# AI 调酒推荐网站

## 1. Product Goal / 产品目标

Build a modern web application that answers:

> “Given the ingredients I currently have, what cocktails can I make?”

构建一个现代化 Web 应用，核心回答：

> “根据我现在手头已有的材料，我可以调什么酒？”

The product should combine:

1. Structured cocktail and ingredient database
2. Deterministic ingredient matching
3. Personalized ranking
4. LLM-powered natural-language ingredient parsing
5. LLM-powered ingredient substitution
6. LLM-powered creative cocktail generation
7. Chinese / English bilingual interface

产品应结合：

1. 结构化鸡尾酒与原料数据库
2. 确定性的材料匹配
3. 个性化排序
4. LLM 自然语言材料解析
5. LLM 材料替代建议
6. LLM 创意鸡尾酒生成
7. 中英文双语界面

The LLM must NOT be the primary source of truth for whether a classic cocktail is valid. Classic cocktails should be generated from the structured database and deterministic matching engine.

LLM 不应作为经典鸡尾酒是否有效的唯一依据。经典鸡尾酒应主要来自结构化数据库和确定性匹配引擎。

---

# 2. Core User Flow / 核心用户流程

## Step 1: Add ingredients / 添加材料

Users can add ingredients through:

- Search
- Category browsing
- Common ingredient shortcuts
- Natural language input

用户可以通过以下方式添加材料：

- 搜索
- 分类浏览
- 常用材料快捷按钮
- 自然语言输入

Example / 示例：

> “I have gin, tonic water, two lemons and simple syrup.”

The system should normalize this into canonical ingredient IDs.

系统应将自然语言自动解析并标准化为 canonical ingredient ID。

---

## Step 2: Optional preferences / 可选偏好

Users may specify:

- Flavor: sour / sweet / bitter / fresh / smoky / fruity / herbal
- Alcohol strength: none / low / medium / high
- Difficulty: easy / medium / advanced
- Preparation time
- Maximum number of missing ingredients

用户可以设置：

- 风味：酸 / 甜 / 苦 / 清爽 / 烟熏 / 果香 / 草本
- 酒精强度：无酒精 / 低 / 中 / 高
- 难度：简单 / 中等 / 进阶
- 调制时间
- 最多允许缺少几种材料

These preferences are optional. The application must still work if the user provides only ingredients.

这些偏好均为可选项。即使用户只输入材料，也必须能够正常获得推荐结果。

---

# 3. Recommendation / 推荐系统

Results must be separated into:

推荐结果分为：

### Available now / 现在就能做

Cocktails for which the user owns all required ingredients.

用户已经拥有全部必要材料的鸡尾酒。

### Almost available / 差一点就能做

Cocktails for which one or more ingredients are missing.

用户缺少一到少量材料即可完成的鸡尾酒。

Show the missing ingredients explicitly.

必须明确显示缺少的材料。

### AI Creative / AI 创意调酒

Only use this category when the structured database cannot provide enough useful results.

只有在结构化数据库无法提供足够有效结果时，才进入这一类别。

Clearly label these recipes as AI-generated rather than classic recipes.

必须明确标记为 AI 生成配方，而不是经典鸡尾酒。

---

# 4. Recommendation Algorithm / 推荐算法

Do not directly ask the LLM to rank the entire cocktail database.

不要直接让 LLM 对整个鸡尾酒数据库进行自由排序。

First perform deterministic matching.

首先执行确定性的数据库匹配。

For each cocktail:

```text
ingredient_match =
number_of_available_required_ingredients /
number_of_required_ingredients
```

Then calculate:

```text
score =
0.40 * ingredient_match
+ 0.20 * preference_match
+ 0.15 * difficulty_match
+ 0.15 * popularity
+ 0.10 * novelty
```

The exact weights should be configurable.

权重必须设计成可配置，而不是硬编码在业务逻辑中。

Fully available cocktails should normally appear before cocktails requiring missing ingredients.

材料完全满足的鸡尾酒通常应优先于需要额外材料的鸡尾酒。

---

# 5. Cocktail Detail Page / 鸡尾酒详情页

Each cocktail should display:

每个鸡尾酒详情页应展示：

- Name / 名称
- Image / 图片
- Description / 描述
- Classic / AI-generated label / 经典或 AI 生成标签
- Ingredients / 材料
- Amounts / 用量
- Glass / 杯型
- Preparation method / 调制方法
- Difficulty / 难度
- Alcohol strength / 酒精强度
- Flavor profile / 风味
- Preparation steps / 制作步骤
- User inventory match / 用户材料匹配情况
- Missing ingredients / 缺少材料
- Possible substitutions / 可替代材料

Clearly distinguish canonical recipe ingredients from AI-suggested substitutions.

必须明确区分标准配方中的材料和 AI 建议的替代材料。

---

# 6. Ingredient Data Model / 材料数据模型

Ingredients must have canonical IDs.

材料必须具有唯一的 canonical ID。

Example / 示例：

```json
{
  "id": "gin",
  "name": "Gin",
  "aliases": [
    "gin",
    "金酒",
    "琴酒",
    "杜松子酒"
  ],
  "category": "spirit",
  "flavor_profile": [
    "botanical",
    "juniper",
    "dry"
  ]
}
```

The system must normalize aliases to canonical ingredient IDs.

系统必须将不同语言、别名和写法统一映射到 canonical ingredient ID。

---

# 7. Database / 数据库

Use PostgreSQL.

使用 PostgreSQL。

Required tables:

```text
ingredients
cocktails
cocktail_ingredients
ingredient_aliases
users
user_inventory
favorites
```

Keep the schema extensible.

数据库结构需要考虑未来扩展。

---

# 8. API

Implement:

```http
POST /api/recommend
```

Request:

```json
{
  "ingredients": ["gin", "lemon", "simple_syrup"],
  "preferences": {
    "flavor": ["fresh", "sour"],
    "strength": "medium",
    "difficulty": "easy"
  },
  "missingIngredientLimit": 1
}
```

Return structured JSON containing:

返回结构化 JSON，至少包含：

- available cocktails
- almost available cocktails
- missing ingredients
- AI creative cocktails

---

# 9. LLM Integration / LLM 集成

Use the LLM only for:

LLM 主要负责：

1. Natural-language ingredient extraction / 自然语言材料提取
2. Ingredient normalization when deterministic matching fails / 确定性匹配失败时的材料标准化
3. Ingredient substitution / 材料替代
4. Recommendation explanations / 推荐解释
5. Creative cocktail generation / 创意鸡尾酒生成

LLM output must use a strict JSON schema.

LLM 输出必须使用严格的 JSON Schema。

Never parse arbitrary natural-language LLM output in the frontend.

前端禁止直接解析任意自然语言形式的 LLM 输出。

Validate all AI-generated recipes before displaying them.

所有 AI 生成的配方必须经过 Schema 校验后才能展示。

---

# 10. Frontend / 前端

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Use a modern cocktail-bar visual style.

采用现代鸡尾酒吧风格：

- dark / warm background
- cream typography
- amber / burgundy accent colors
- large cocktail photography
- elegant serif headings
- clean sans-serif body text
- rounded cards
- subtle animations

---

# 11. Bilingual Support / 中英文双语支持

The application must support both:

- 简体中文（zh-CN）
- English（en）

用户可以在网站中自由切换中文和英文。

## Language Switcher / 语言切换按钮

A visible language switcher must be included in the global navigation/header.

在全局导航栏或 Header 中提供明显的语言切换按钮。

Recommended UI:

```text
中文 | EN
```

or:

```text
🇨🇳 中文
🇺🇸 English
```

The button should be accessible from every major page.

用户在所有主要页面都应能够访问语言切换功能。

---

## Language Behavior / 语言行为

Default language should follow this priority:

默认语言按照以下优先级确定：

1. User's explicit saved language preference
2. Browser language
3. English fallback

优先级：

1. 用户主动设置并保存的语言
2. 浏览器语言
3. 默认使用 English

The selected language should persist across page navigation and future visits.

用户选择的语言应在页面跳转以及后续访问中保持。

For authenticated users, save the language preference in the user profile.

对于登录用户，将语言偏好保存到用户 Profile。

For anonymous users, use localStorage or an equivalent client-side persistence mechanism.

对于匿名用户，使用 localStorage 或等效的客户端持久化方式。

---

## Translation Architecture / 国际化架构

Do not hard-code UI strings directly into React components.

禁止将 UI 文本直接硬编码到 React Component 中。

Use an internationalization layer.

应使用统一的 i18n 国际化层。

Recommended structure:

```text
/locales
  /en
    common.json
    home.json
    recommendation.json
    cocktail.json
  /zh-CN
    common.json
    home.json
    recommendation.json
    cocktail.json
```

Example:

```json
{
  "hero.title": "WHAT CAN I MIX TONIGHT?",
  "hero.subtitle": "Tell us what you have. We'll find something worth drinking.",
  "actions.mix": "MIX IT"
}
```

Chinese:

```json
{
  "hero.title": "今晚喝什么？",
  "hero.subtitle": "告诉我你有什么，我们帮你找到值得喝的一杯。",
  "actions.mix": "开始调酒"
}
```

Do not duplicate business logic for different languages.

不同语言不应复制两套业务逻辑。

---

## Cocktail Content Localization / 鸡尾酒内容国际化

Ingredient and cocktail records should support localized names.

材料和鸡尾酒数据应支持多语言名称。

Recommended structure:

```text
cocktails
    id
    slug
    name_en
    name_zh
    description_en
    description_zh

ingredients
    id
    name_en
    name_zh
```

For larger-scale localization, use a separate translation table:

```text
translations
    entity_type
    entity_id
    language
    field
    value
```

Prefer the simpler approach for MVP and keep the schema extensible.

MVP 阶段优先使用简单方案，但数据库设计需要方便未来扩展。

---

## AI Language Behavior / AI 语言行为

When the UI is Chinese:

- AI explanations should be returned in Chinese.
- Ingredient names should preferably show Chinese names with English names where useful.
- AI-generated cocktail descriptions should be Chinese.

当 UI 使用中文时：

- AI 推荐解释使用中文。
- 材料优先显示中文名称，必要时附带英文名称。
- AI 创意鸡尾酒描述使用中文。

When the UI is English:

- AI explanations should be returned in English.
- Ingredient and cocktail names should use English names.
- AI-generated cocktail descriptions should be English.

当 UI 使用英文时：

- AI 推荐解释使用英文。
- 材料和鸡尾酒名称使用英文。
- AI 创意鸡尾酒描述使用英文。

The backend should receive the selected language explicitly:

```json
{
  "language": "zh-CN"
}
```

or:

```json
{
  "language": "en"
}
```

The AI prompt should instruct the model to respond in the requested language.

---

# 12. Main Pages / 主要页面

### `/`

Landing page and ingredient input.

首页和材料输入。

### `/recommend`

Recommendation results.

推荐结果。

### `/cocktail/[id]`

Cocktail detail page.

鸡尾酒详情页。

### `/cabinet`

User ingredient inventory.

我的酒柜。

### `/favorites`

Saved cocktails.

收藏。

---

# 13. Homepage / 首页

Hero:

> WHAT CAN I MIX TONIGHT?

Chinese:

> 今晚喝什么？

Subtitle:

> Tell us what you have. We'll find something worth drinking.

Chinese:

> 告诉我你有什么，我们帮你找到值得喝的一杯。

Ingredient input.

材料输入。

Quick ingredient buttons.

常用材料快捷按钮。

Display selected ingredients as removable chips.

已选择材料以可删除的 Chip 展示。

Primary CTA:

> MIX IT

Chinese:

> 开始调酒

Optional preference controls should be visually secondary.

可选偏好设置应作为次级功能，不应喧宾夺主。

---

# 14. Recommendation UI / 推荐结果 UI

Show:

> 12 DRINKS AVAILABLE

Chinese:

> 你现在可以调 12 杯酒

Sections:

### You can make now / 现在就能做

### Almost there / 差一点就能做

### AI creations / AI 创意

Each cocktail card should show:

- image
- name
- match percentage
- missing ingredients
- difficulty
- flavor tags
- preparation time

---

# 15. Important Product Rule / 重要产品规则

Never present an AI-generated cocktail as a canonical cocktail.

绝不能把 AI 生成的鸡尾酒伪装成经典标准鸡尾酒。

Use labels such as:

- Classic / 经典
- Verified Recipe / 已验证配方
- AI Creation / AI 创意

---

# 16. MVP Scope / MVP 范围

The first version should implement only:

第一版只实现：

1. Ingredient input / 材料输入
2. Ingredient normalization / 材料标准化
3. Cocktail database / 鸡尾酒数据库
4. Cocktail matching / 鸡尾酒匹配
5. Recommendation ranking / 推荐排序
6. Cocktail detail page / 鸡尾酒详情页
7. Natural-language ingredient parsing / 自然语言材料解析
8. AI creative cocktail generation / AI 创意鸡尾酒生成
9. Chinese / English language switching / 中英文语言切换

Do NOT implement:

第一版暂时不要实现：

- Social networking / 社交系统
- Ecommerce / 电商
- Mobile apps / 原生移动 App
- Complex subscription systems / 复杂会员体系
- Microservices / 微服务
- Unnecessary infrastructure / 不必要的基础设施

---

# 17. Development Requirements / 开发要求

Build the project so that:

- frontend and backend are strongly typed
- API schemas are validated
- database queries are typed
- AI output is schema validated
- loading states are implemented
- empty states are implemented
- error states are implemented
- mobile layout works
- bilingual UI works
- language preference persists
- no API secrets are exposed to the browser

项目必须保证：

- 前后端强类型
- API Schema 校验
- 数据库查询类型安全
- AI 输出 Schema 校验
- 完整 Loading 状态
- 完整 Empty 状态
- 完整 Error 状态
- 移动端适配
- 中英文双语正常工作
- 语言偏好可以持久化
- API Secret 不暴露到浏览器

Provide:

- README
- `.env.example`
- database migration
- seed script
- development commands
- production build command

Provide seed data so the application works immediately after installation.

---

# 18. Recommended Technology Stack / 推荐技术栈

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| i18n | next-intl or equivalent |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL |
| ORM | Prisma or Drizzle |
| Validation | Zod |
| AI | OpenAI API |
| AI Output | Structured Outputs |
| Cocktail Data | TheCocktailDB + custom normalized database |
| Auth | Optional for MVP |
| Deployment | Vercel + PostgreSQL |

---

# 19. Acceptance Criteria / 验收标准

A user should be able to:

用户应该能够：

1. Open the homepage.
2. Add Gin, Lemon and Sugar.
3. Click “Mix It”.
4. See cocktails that can be made immediately.
5. See cocktails that require additional ingredients.
6. Open a cocktail.
7. See its complete recipe.
8. Enter natural language such as:
   “I have gin, tonic, lemon and honey.”
9. Have the system correctly normalize those ingredients.
10. Request an AI-created cocktail when appropriate.
11. Clearly distinguish AI-created recipes from classic recipes.
12. Switch between Chinese and English using the global language switcher.
13. Refresh or revisit the page and retain the selected language.
14. Use the application comfortably on both desktop and mobile.

用户还必须能够：

1. 在首页添加金酒、柠檬和糖。
2. 点击“开始调酒”。
3. 看到现在可以直接制作的鸡尾酒。
4. 看到还缺哪些材料的鸡尾酒。
5. 打开鸡尾酒详情。
6. 查看完整配方。
7. 输入自然语言材料描述。
8. 系统正确识别并标准化材料。
9. 在适合时生成 AI 创意鸡尾酒。
10. 明确区分 AI 创意配方和经典鸡尾酒。
11. 通过全局语言按钮在中文和英文之间切换。
12. 刷新页面或再次访问后仍保持语言选择。
13. 在桌面端和移动端正常使用。

---

# 20. Product Direction / 产品方向

The long-term product should evolve from:

> “AI cocktail generator”

into:

> “Personal Cocktail Cabinet Assistant”

核心产品方向不是：

> “AI 帮你随机生成一杯酒”

而是：

> “根据我的酒柜，我现在能喝什么？”

Long-term features can include:

- What can I make now?
- What am I missing?
- What should I buy to unlock more cocktails?
- What can I make with one specific bottle?
- Help me use ingredients before they expire.
- Plan three different cocktails for tonight.
- Learn my taste preferences over time.

长期可以扩展：

- 我现在能调什么？
- 我还缺什么？
- 买什么材料最划算？
- 这瓶酒还能调什么？
- 帮我消耗快过期的材料。
- 给我安排今晚三杯不同风格的酒。
- 根据我的历史逐渐学习我的口味。

The core product loop should be:

```text
My Cabinet
    ↓
What Can I Make?
    ↓
Available Now / Almost There / AI Creative
    ↓
Choose a Cocktail
    ↓
Make It
    ↓
Favorite / History
    ↓
A Smarter Personal Cocktail Cabinet
```
