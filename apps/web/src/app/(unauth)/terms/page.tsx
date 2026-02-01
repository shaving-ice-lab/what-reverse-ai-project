"use client";

/**
 * 服务条款页面
 */

import { SiteHeader } from "@/components/layout/site-header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">服务条款</h1>
          <p className="text-muted-foreground mb-8">最后更新：2026 年 1 月 1 日</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. 服务说明</h2>
              <p className="text-muted-foreground">
                AgentFlow 是一个 AI 驱动的工作流自动化平台，提供可视化编辑器、AI Agent、
                第三方服务集成等功能。使用本服务即表示您同意遵守这些条款。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. 账户注册</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>您必须提供真实、准确的注册信息</li>
                <li>您负责保管账户凭据的安全</li>
                <li>您应对账户下的所有活动负责</li>
                <li>发现未授权使用应立即通知我们</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. 可接受的使用</h2>
              <p className="text-muted-foreground mb-4">您同意不会：</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>违反任何适用法律法规</li>
                <li>侵犯他人知识产权或隐私权</li>
                <li>传播恶意软件或进行网络攻击</li>
                <li>发送垃圾邮件或进行欺诈活动</li>
                <li>干扰或破坏服务的正常运行</li>
                <li>未经授权访问其他用户的数据</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. 知识产权</h2>
              <p className="text-muted-foreground">
                AgentFlow 平台及其内容的知识产权归我们所有。您创建的工作流和内容的知识产权归您所有。
                您授予我们运营服务所需的有限许可。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. 付费服务</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>付费订阅按选定的计费周期收费</li>
                <li>价格可能会变更，我们会提前 30 天通知</li>
                <li>取消订阅后，服务持续到当前周期结束</li>
                <li>退款政策详见定价页面</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. 服务变更</h2>
              <p className="text-muted-foreground">
                我们可能会不时更新、修改或终止服务的某些功能。对于重大变更，我们会提前通知用户。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. 免责声明</h2>
              <p className="text-muted-foreground">
                服务按"现状"提供，不提供任何明示或暗示的保证。我们不保证服务不会中断或无错误。
                在法律允许的最大范围内，我们不对任何间接、附带或后果性损害承担责任。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">8. 责任限制</h2>
              <p className="text-muted-foreground">
                我们对您的最大责任不超过您在过去 12 个月内支付给我们的费用总额。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">9. 条款修改</h2>
              <p className="text-muted-foreground">
                我们保留修改这些条款的权利。重大修改将提前 30 天通知。
                继续使用服务即表示您接受修改后的条款。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">10. 联系方式</h2>
              <p className="text-muted-foreground">
                如有任何问题，请联系我们：
              </p>
              <ul className="list-none text-muted-foreground mt-2 space-y-1">
                <li>邮箱：legal@agentflow.ai</li>
                <li>电话：400-888-8888</li>
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
