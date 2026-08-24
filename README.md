# Rift Command

英雄联盟赛事管理系统的 V1 前端基础版本。

## 当前范围

- 响应式公共导航和电竞风首页
- 赛事列表与可复用赛事卡片
- 战队列表与可复用战队卡片
- 比赛卡片、近期结果和积分预览
- 管理后台布局与总览页面
- TypeScript 示例数据与基础领域类型

Supabase、身份认证和复杂赛事逻辑将在后续阶段接入。

## 本地运行

```bash
pnpm install
pnpm dev
```

然后打开 `http://localhost:3000`。

## 检查

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
