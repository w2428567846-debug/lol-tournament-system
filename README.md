# Rift Command

面向私人英雄联盟社区的赛事报名与管理系统。微信是长期主要身份；邮箱认证只作为显式开启的开发测试适配器。

## 已实现

- provider-neutral `accounts` 身份层，微信 OpenID／UnionID 唯一约束
- 微信 OAuth adapter 边界与服务端账户绑定函数
- `/login`、`/register` 微信优先界面，以及可选开发邮箱入口
- `/account` 单一选手档案与我的报名
- `/tournaments/[slug]` 数据库赛事详情与参与者预览
- `/tournaments/[slug]/register` SOLO 个人报名
- 私人赛事邀请码在 PostgreSQL 服务端验证
- 重复报名唯一约束、报名时段与名额检查
- `/admin/tournaments`、`/admin/players`、`/admin/registrations`
- 管理员服务端授权与 Supabase Row Level Security
- 未完成后台模块使用独立 Coming Soon 路由

## Supabase 设置

请参考 [`supabase/README.md`](supabase/README.md)。项目只需要浏览器可公开的 Supabase URL 与 anon/publishable key；不要添加 service-role key。

```bash
cp .env.example .env.local
```

依次执行 `supabase/migrations/` 中的全部文件后，填入环境变量即可启用数据层。生产微信登录仍需要开放平台凭据与可信服务端会话桥接；未配置时按钮会保持禁用，不会使用用户手填微信号代替验证。

## 本地运行与检查

```bash
pnpm install
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## 暂未实现

自动赛程、积分计算、比赛结果、淘汰赛晋级、Riot API、BP 与实时比赛数据均不在 Phase 2 范围内。
