# Rift Command

面向私人英雄联盟社区的赛事报名与管理系统。微信是长期主要身份；邮箱认证只作为显式开启的开发测试适配器。

## 已实现

- provider-neutral `accounts` 身份层，微信 `(app_id, OpenID)` 与可用时的 UnionID 唯一约束
- 微信 OAuth adapter 边界与服务端账户绑定函数
- `/login`、`/register` 微信优先界面，以及可选开发邮箱入口
- `/account` 单一选手档案与我的报名
- `/tournaments/[slug]` 数据库赛事详情与参与者预览
- `/tournaments/[slug]/register` 无需预建档案的游戏 ID 直接报名与修改
- 每次报名保存游戏 ID、段位、位置与群昵称快照
- 私人赛事邀请码在 PostgreSQL 服务端验证
- 账户与游戏 ID 双重防重复、名单锁定与数据库审批容量限制
- 赛事时间按显式 `Asia/Shanghai` 时区输入和显示，并以 UTC `timestamptz` 保存
- 当前产品阶段从界面、接口与数据库限制为个人报名；历史 TEAM/BOTH 数据仍可读取
- 私人赛事仅管理员与状态为 PENDING、APPROVED 或 WAITLISTED 的有效报名玩家可查看参与者预览；匿名、未报名、REJECTED 与 CANCELLED 用户只看到人数
- 生产环境缺少 Supabase 配置时显示明确的服务设置状态，不使用开发示例冒充真实数据
- `/admin/tournaments/new`、`/admin/tournaments/[id]/edit` 赛事创建与生命周期操作
- `/admin/registrations` 搜索、筛选、带备注的合法状态转换、单笔与批量审核
- 首页与赛事列表共用报名窗口状态，赛事筛选可通过 URL 分享
- 被拒报名可在报名期内修改并重新提交，历史审核事件保留
- 管理员服务端授权与 Supabase Row Level Security
- 未完成后台模块使用独立 Coming Soon 路由

## Supabase 设置

请参考 [`supabase/README.md`](supabase/README.md)。项目只需要浏览器可公开的 Supabase URL 与 anon/publishable key；不要添加 service-role key。

```bash
cp .env.example .env.local
```

依次执行 `supabase/migrations/` 中的全部文件后，填入环境变量即可启用数据层。生产微信登录仍需要开放平台凭据与可信服务端会话桥接；未配置时按钮会保持禁用，不会使用用户手填微信号代替验证。

## 生产部署

生产架构、Cloudflare Workers 部署、全新 Supabase 项目初始化、临时封闭邮箱 beta、自定义域名和完整上线冒烟清单见 [`docs/PRODUCTION-DEPLOYMENT.md`](docs/PRODUCTION-DEPLOYMENT.md)。`/api/health` 只报告应用和数据库配置是否可用，不返回 URL、密钥或环境内容。

## 本地运行与检查

```bash
pnpm install
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
pnpm test:domain
pnpm build
pnpm test:integration
```

真实 PostgreSQL migration 与权限/行为整合检查见 [`docs/INTEGRATION-TESTS.md`](docs/INTEGRATION-TESTS.md)；数据库权限与函数审计见 [`docs/DATABASE-SECURITY.md`](docs/DATABASE-SECURITY.md)。

GitHub Actions 保持两个独立工作：`verify` 运行应用检查，`integration` 使用 PostgreSQL 17、Supabase 风格角色与默认授权，从 001 开始应用到最新 migration，再运行真实 schema 与行为验证。

## 暂未实现

队伍报名、混合报名、队伍分配、自动赛程、积分计算、比赛结果、淘汰赛晋级、账号绑定、BP 与实时比赛数据均不在当前范围内。
