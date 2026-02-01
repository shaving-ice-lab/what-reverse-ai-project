"use client";

/**
 * 隐私政策页面
 */

import { SiteHeader } from "@/components/layout/site-header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">隐私政策</h1>
          <p className="text-muted-foreground mb-8">最后更新：2026 年 1 月 1 日</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. 信息收集</h2>
              <p className="text-muted-foreground mb-4">
                我们收集您在使用服务时提供的信息，包括：
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>账户信息：姓名、邮箱、密码</li>
                <li>使用数据：工作流配置、执行记录</li>
                <li>设备信息：浏览器类型、IP 地址、设备标识</li>
                <li>第三方集成数据：您授权连接的服务数据</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. 信息使用</h2>
              <p className="text-muted-foreground mb-4">
                我们使用收集的信息用于：
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>提供和维护服务</li>
                <li>改进用户体验</li>
                <li>发送服务通知和更新</li>
                <li>分析使用趋势和优化性能</li>
                <li>防止欺诈和滥用</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. 信息共享</h2>
              <p className="text-muted-foreground mb-4">
                我们不会出售您的个人信息。我们可能在以下情况下共享信息：
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>经您同意</li>
                <li>与服务提供商合作（如云服务、支付处理）</li>
                <li>法律要求或保护权利</li>
                <li>业务转让或合并</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. 数据安全</h2>
              <p className="text-muted-foreground mb-4">
                我们采取多层安全措施保护您的数据：
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>传输加密：所有数据传输使用 TLS 加密</li>
                <li>存储加密：敏感数据使用 AES-256 加密存储</li>
                <li>访问控制：严格的内部访问权限管理</li>
                <li>定期审计：安全审计和渗透测试</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. 数据保留</h2>
              <p className="text-muted-foreground">
                我们会在提供服务所需的期间内保留您的信息。账户删除后，我们会在 30 天内删除您的个人数据，
                但可能会保留匿名化的统计数据。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. 您的权利</h2>
              <p className="text-muted-foreground mb-4">您有权：</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>访问和获取您的数据副本</li>
                <li>更正不准确的信息</li>
                <li>请求删除您的账户和数据</li>
                <li>反对某些数据处理活动</li>
                <li>数据可携带性</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Cookie 政策</h2>
              <p className="text-muted-foreground">
                我们使用 Cookie 和类似技术来改善用户体验、分析使用情况和个性化内容。
                您可以通过浏览器设置管理 Cookie 偏好。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">8. 联系我们</h2>
              <p className="text-muted-foreground">
                如有任何隐私相关问题，请联系我们：
              </p>
              <ul className="list-none text-muted-foreground mt-2 space-y-1">
                <li>邮箱：privacy@agentflow.ai</li>
                <li>地址：北京市海淀区中关村科技园</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
