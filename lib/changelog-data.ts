export interface ChangelogRelease {
  version: string
  date: string
  isLatest?: boolean
  tagline: string
  summary: string
  features: string[]
  improvements: string[]
}

export const changelogData: ChangelogRelease[] = [
  {
    version: 'v1.3.0',
    date: '2026-10-18',
    isLatest: true,
    tagline: '智能化运维、可观测性与企业级中枢平台成熟',
    summary: '引入 1Panel 外部定时同步鉴权体系、全生命周期崩溃监控、多平台 Webhook 机器人告警、DAU/MAU 深度留存漏斗、统一公告中枢与真 CSV 导出。',
    features: [
      '1Panel / Linux crontab 外部计划任务鉴权：新增专用 Cron Secret，支持 Bearer / Header / Query 多重验证与防刷测试',
      '系统设置中枢全自动化：1Panel 定时执行 Shell 脚本指令依据当前实际域名动态生成，支持一键复制与密钥随机生成',
      '多平台 Webhook 机器人告警：覆盖钉钉、企业微信、飞书与自定义 Webhook，实时通知可疑登录、VIP激活、系统错误',
      '邮件通知引擎集成：支持 Resend API 与 QQ、163、Gmail、阿里云 SMTP 快捷预设及实时发信测试',
      '统一公告管理中心 (/admin/announcements)：集中聚合与调度网站站点公告与软件客户端系统公告',
      '网站画像主页 (/admin/websites/[id])：聚合横幅与公告指标，支持站点资料原位编辑与级联管理',
      '网站公告独立运维页面：支持置顶、四级状态类型（通知/警告/紧急/成功）、排序与发布状态快捷切换',
      '客户端崩溃日志监控系统 (/admin/crash-reports)：异常堆栈精准捕捉、设备型号与操作系统分布透视',
      '深度用户行为与留存分析：今日活跃设备 (DAU)、月活粘性比 (DAU/MAU)、24小时时段分布热力图、多步漏斗转化',
      '全站真 CSV 数据导出：封装 UTF-8 BOM 通用导出，解决 Excel 中文乱码，实装软件库列表、设备明细与使用流水导出',
      '生态矩阵公开展示页 (/aboutus)：上线 Apple-Craft 极简生态官网，公开展示旗下项目、分站、社群与联络渠道'
    ],
    improvements: [
      '全站 404 死链彻底清零：修复仪表板「管理公告」404、网站列表「查看详情」404、软件列表「统计数据」404',
      '侧边栏导航规范化：左侧导航正式挂载「公告中心」与「登录日志」，右上角醒目标记当前版本号 v1.3.0',
      '清理废弃历史空文件夹：彻底删除 app/admin/database-sync 与 app/admin/settings',
      'CORS 跨域扩展：支持 admtapk.lacs.cc 与 *.lacs.cc 全系子域名安全调用'
    ]
  },
  {
    version: 'v1.2.3',
    date: '2026-09-05',
    tagline: '软件版本管理查询增强与稳定性调优',
    summary: '优化软件版本管理列表的排序逻辑与查询性能，修复软件详情页在特定异常数据下的空指针兜底防护。',
    features: [
      '增强软件历史版本查询与下载地址回溯',
      '提升版本历史切换与多网盘链接展示稳定性'
    ],
    improvements: [
      '优化软件详情页空数据防护机制',
      '微调管理端骨架屏过渡动画'
    ]
  },
  {
    version: 'v1.2.2',
    date: '2026-07-17',
    tagline: '移动端响应式体验与表格交互优化',
    summary: '优化管理员后台数据表格在小屏移动端的横向滑动与卡片自适应呈现，提升激活码列表批量操作与防抖查询效率。',
    features: [
      '移动端卡片式自适应视图切换',
      '激活码防抖即时搜索'
    ],
    improvements: [
      '优化表格分页组件交互细节',
      '减少不必要的重渲染以提高加载速度'
    ]
  },
  {
    version: 'v1.2.1',
    date: '2026-07-15',
    tagline: '设备行为记录合规脱敏与隐私保护',
    summary: '强化设备指纹脱敏机制，确保使用记录流水遵循个人隐私合规标准，优化敏感配置掩码显示策略。',
    features: [
      '设备硬件序列号动态掩码展示与一键显隐切换',
      '敏感配置项脱敏保护'
    ],
    improvements: [
      '提高用户行为接口入库吞吐量',
      '精简未使用的依赖包体积'
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-07-12',
    tagline: '生态矩阵信息管理、爱心捐赠与 API 文档体系',
    summary: '上线信息管理中心，涵盖官方联系方式、自媒体矩阵、交流群、项目与分站数据库模型与后台配置，集成爱心捐赠与 API 交互文档。',
    features: [
      '信息管理中心 (/admin/info-management)：全生命周期配置团队、社群、分站与自媒体',
      '捐赠人员管理 (/admin/donors)：爱心名单维护，支持纯文本 JSON 数组批量导入',
      '交互式 API 文档 (/admin/api-docs)：后台集成自动化 API 检索与在线调试文档'
    ],
    improvements: [
      '重构统一导航菜单结构，支持折叠与状态记忆',
      '统一 API 响应格式标准'
    ]
  },
  {
    version: 'v1.1.2',
    date: '2026-02-10',
    tagline: '激活码统计组件与系统审计安全拦截',
    summary: '完善激活码数据统计分析组件与系统操作审计日志链路，优化黑名单设备校验与拦截过滤规则。',
    features: [
      '激活码状态实时图表统计',
      '黑名单设备数据库级拦截'
    ],
    improvements: [
      '完善系统操作审计日志链路',
      '优化错误捕获提示'
    ]
  },
  {
    version: 'v1.1.1',
    date: '2026-02-10',
    tagline: '激活码详情页面渲染与客户端错误处理热修复',
    summary: '修复管理员激活码详情页面在空数据状态下的渲染异常，完善激活码 API 客户端请求错误捕获机制。',
    features: [
      '激活码详情状态色彩徽标高亮',
      '优化 API 客户端超时重试'
    ],
    improvements: [
      '修复空指针异常导致的页面白屏',
      '完善表单验证错误反馈'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-02-10',
    tagline: '管理后台全面现代化重构与深色模式支持',
    summary: '全站迁移至 Tailwind CSS + Radix UI 现代交互规范，支持深色/明亮主题平滑切换，上线独立系统设置与登录审计日志。',
    features: [
      '全新设计系统：迁移至现代极简设计语言与 Radix UI',
      '深色主题模式 (Dark Mode)：一键切换并记忆用户偏好',
      '独立系统设置库：远程动态下发参数无需重启服务',
      '登录审计流水：记录登录 IP、设备型号、浏览器与时间戳'
    ],
    improvements: [
      '全面优化移动端侧边栏抽屉与头部自适应',
      '重构权限校验，部分公开路由解耦'
    ]
  },
  {
    version: 'v1.0.2',
    date: '2025-09-30',
    tagline: '统一数据库连接池重构与站点多维元数据扩展',
    summary: '合并异构数据库连接为统一 PostgreSQL/Neon 连接池，为托管网站扩展分类、描述、Logo 等富元数据，统一中国时区。',
    features: [
      '网站多维元数据：新增 Logo、分类与详细描述字段',
      '统一连接池：整合分散的 Drizzle 客户端连接'
    ],
    improvements: [
      '统一 Asia/Shanghai 时间戳规范化入库',
      '优化数据库断线自动重连策略'
    ]
  },
  {
    version: 'v1.0.1',
    date: '2025-08-29',
    tagline: '全局 CORS 跨域重构与行为频率限制微调',
    summary: '重构统一跨域资源共享 (CORS) 拦截器，解决多端调用头信息丢失问题，调整用户行为记录 API 的频率限制阈值。',
    features: [
      '动态 Origin 识别与 OPTIONS 预检高效响应',
      '行为记录 API 动态频控'
    ],
    improvements: [
      '修复特定反向代理场景下的请求头过滤异常',
      '精简返回体中的冗余字段'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2025-08-21',
    tagline: '全栈核心业务架构正式落地与首发版本发布',
    summary: '基于 Hono + Next.js App Router 混合架构构建核心服务，落地 GitHub OAuth 登录、软件库版本管理、激活码鉴权与基础行为统计闭环。',
    features: [
      '双重鉴权中枢：支持 GitHub OAuth 与 API Key 鉴权',
      '核心软件库：软件基本资料、版本发布历史、多渠道下载链接',
      '激活码兑换系统：一键批量生成、核销验证与有效期管控',
      '设备连接流水：设备唯一性标识接入与连接频次初级统计'
    ],
    improvements: [
      '统一统一的 API 路由分发标准',
      '奠定 Neon Serverless PostgreSQL 数据底座'
    ]
  }
]
