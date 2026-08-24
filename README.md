# Rift Command

面向私人英雄联盟社区的赛事报名与管理系统。当前 Phase 2 已包含 Supabase 邮箱认证、选手档案、个人赛事报名、私人邀请码、账户报名状态与管理员审核。

## 已实现

- `/login`、`/register`、邮箱验证回调与退出登录
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

执行 `supabase/migrations/202608240001_phase2_registration.sql` 后，填入环境变量即可启用真实流程。未配置时，公共页面会显示明确的开发回退说明，登录、账户和后台不会伪装为已连接。

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
