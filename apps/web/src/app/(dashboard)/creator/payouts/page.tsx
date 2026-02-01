"use client";

/**
 * 创作者提现设置页面
 *
 * Supabase 风格：简约、专业、财务管理
 */

import { useState } from "react";
import {
  Wallet,
  CreditCard,

  Building,

  Plus,

  Check,

  AlertCircle,

  Clock,

  DollarSign,

  FileText,

  ChevronRight,

  Shield,

  Trash2,

  Edit,

  HelpCircle,

  ExternalLink,

  CheckCircle,

  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// 提现账户类型

const accountTypes = [

  {
    id: "bank",

    name: "银行卡",

    icon: Building,

    description: "支持国内所有银行",

    fee: "免手续费",

  },

  {
    id: "alipay",

    name: "支付宝",

    icon: CreditCard,

    description: "快速到账",

    fee: "免手续费",

  },

  {
    id: "wechat",

    name: "微信支付",

    icon: CreditCard,

    description: "便捷提现",

    fee: "免手续费",

  },

];

// 模拟已绑定账户

const boundAccounts = [

  {
    id: "1",

    type: "bank",

    name: "招商银行",

    account: "**** **** **** 6789",

    isDefault: true,

    verified: true,

  },

  {
    id: "2",

    type: "alipay",

    name: "支付宝",

    account: "138****5678",

    isDefault: false,

    verified: true,

  },

];

// 提现记录

const payoutHistory = [

  {
    id: "p1",

    amount: 1500,

    status: "completed",

    account: "招商银行 ****6789",

    createdAt: "2026-01-28 14:30",

    completedAt: "2026-01-28 16:45",

  },

  {
    id: "p2",

    amount: 2800,

    status: "completed",

    account: "支付宝 138****5678",

    createdAt: "2026-01-20 10:15",

    completedAt: "2026-01-20 10:18",

  },

  {
    id: "p3",

    amount: 1200,

    status: "pending",

    account: "招商银行 ****6789",

    createdAt: "2026-01-30 09:00",

    completedAt: null,

  },

];

// 提现规则

const payoutRules = [

  { label: "最低提现金额", value: "¥100" },

  { label: "单笔最高金额", value: "¥50,000" },

  { label: "每日提现次数", value: "3 次" },

  { label: "到账时间", value: "1-3 个工作日" },

  { label: "手续费", value: "免费" },

];

export default function PayoutsPage() {
  const [showAddAccount, setShowAddAccount] = useState(false);

  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);

  const [showWithdraw, setShowWithdraw] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [selectedAccount, setSelectedAccount] = useState(boundAccounts[0]?.id || "");

  // 可提现余额

  const availableBalance = 3256.78;

  // 处理提现

  const handleWithdraw = () => {
    // 模拟提现

    setShowWithdraw(false);

    setWithdrawAmount("");

  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-brand-200/60 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-brand-500" />
          </div>
          <div className="page-caption">Creator</div>
        </div>
        <PageHeader
          title="提现管理"
          backHref="/creator/earnings"
          backLabel="返回"
          actions={(
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => setShowWithdraw(true)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              申请提现
            </Button>
          )}
        />

        <div className="page-divider" />

        {/* Content */}

        <div className="space-y-6">

        {/* Balance Card */}

        <div className="p-6 rounded-md bg-brand-200/60 border border-brand-500/30 text-foreground mb-8">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-foreground-light text-[13px] mb-1">可提现余额</div>

              <div className="text-2xl font-semibold text-foreground">{availableBalance.toLocaleString()}</div>

              <div className="text-xs text-foreground-muted mt-2">

                累计提现: ¥15,500.00  待入账: ¥1,200.00

              </div>

            </div>

            <div className="text-right">

              <Button

                variant="outline"

                className="border-brand-500/40 text-brand-500 hover:bg-brand-200/40"

                onClick={() => setShowWithdraw(true)}

              >

                立即提现

              </Button>

            </div>

          </div>

        </div>

        {/* Bound Accounts */}

        <div className="mb-8">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-sm font-medium text-foreground">提现账户</h2>

            <Button

              variant="outline"

              size="sm"

              onClick={() => setShowAddAccount(true)}

              className="border-border text-foreground-light"

            >

              <Plus className="w-4 h-4 mr-2" />

              添加账户

            </Button>

          </div>

          <div className="space-y-3">

            {boundAccounts.map((account) => {
              const accountType = accountTypes.find((t) => t.id === account.type);

              return (
                <div

                  key={account.id}

                  className={cn(
                    "p-4 rounded-md border flex items-center gap-4",

                    account.isDefault

                      ? "bg-brand-200 border-brand-400/30"

                      : "bg-surface-100 border-border"

                  )}

                >

                  <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">

                    {accountType && <accountType.icon className="w-5 h-5 text-foreground-muted" />}

                  </div>

                  <div className="flex-1">

                    <div className="flex items-center gap-2">

                      <span className="text-[13px] font-medium text-foreground">{account.name}</span>

                      {account.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-brand-200 text-brand-500 text-xs">

                          默认

                        </span>

                      )}

                      {account.verified && (
                        <CheckCircle className="w-4 h-4 text-brand-500" />

                      )}

                    </div>

                    <div className="text-xs text-foreground-muted">{account.account}</div>

                  </div>

                  <div className="flex items-center gap-2">

                    <Button variant="ghost" size="sm">

                      <Edit className="w-4 h-4" />

                    </Button>

                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive-200">

                      <Trash2 className="w-4 h-4" />

                    </Button>

                  </div>

                </div>

              );

            })}

            {boundAccounts.length === 0 && (
              <div className="p-8 rounded-md bg-surface-75 text-center">

                <Wallet className="w-10 h-10 text-foreground-muted mx-auto mb-4" />

                <h3 className="text-[13px] font-medium text-foreground mb-2">暂无提现账户</h3>

                <p className="text-xs text-foreground-muted mb-4">

                  添加银行卡或第三方支付账户以进行提现

                </p>

                <Button onClick={() => setShowAddAccount(true)} className="bg-brand-500 hover:bg-brand-600 text-background">

                  <Plus className="w-4 h-4 mr-2" />

                  添加账户

                </Button>

              </div>

            )}

          </div>

        </div>

        {/* Payout History */}

        <div className="mb-8">

          <h2 className="text-sm font-medium text-foreground mb-4">提现记录</h2>

          <div className="rounded-md border border-border overflow-hidden">

            <table className="w-full">

              <thead className="bg-surface-75">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground">金额</th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground">状态</th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground">账户</th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground">时间</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-border">

                {payoutHistory.map((payout) => (
                  <tr key={payout.id} className="bg-surface-100">

                    <td className="px-4 py-3">

                      <span className="text-[13px] font-medium text-foreground">

                        {payout.amount.toLocaleString()}

                      </span>

                    </td>

                    <td className="px-4 py-3">

                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",

                        payout.status === "completed"

                          ? "bg-brand-200 text-brand-500"

                          : payout.status === "pending"

                          ? "bg-warning-200 text-warning"

                          : "bg-destructive-200 text-destructive"

                      )}>

                        {payout.status === "completed" && <CheckCircle className="w-3 h-3" />}

                        {payout.status === "pending" && <Clock className="w-3 h-3" />}

                        {payout.status === "completed" ? "已完成" : payout.status === "pending" ? "处理中" : "失败"}

                      </span>

                    </td>

                    <td className="px-4 py-3 text-xs text-foreground-muted">

                      {payout.account}

                    </td>

                    <td className="px-4 py-3 text-xs text-foreground-muted">

                      {payout.createdAt}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="text-center mt-4">

            <Button variant="ghost" size="sm" className="text-foreground-light">

              查看更多记录

              <ChevronRight className="w-4 h-4 ml-1" />

            </Button>

          </div>

        </div>

        {/* Payout Rules */}

        <div className="page-panel p-6">

          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">

            <FileText className="w-4 h-4 text-brand-500" />

            提现规则

          </h2>

          <div className="page-grid sm:grid-cols-2">

            {payoutRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between p-3 rounded-md bg-surface-75">

                <span className="text-xs text-foreground-muted">{rule.label}</span>

                <span className="text-xs font-medium text-foreground">{rule.value}</span>

              </div>

            ))}

          </div>

          <div className="mt-4 p-4 rounded-md bg-brand-200 border border-brand-400/30">

            <div className="flex items-start gap-3">

              <Shield className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />

              <div>

                <h4 className="text-[13px] font-medium text-foreground mb-1">安全提示</h4>

                <p className="text-xs text-foreground-light">

                  为了保障您的资金安全，提现前请确认账户信息正确。如遇问题请联系客服。

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Add Account Modal */}

      {showAddAccount && (
        <div className="fixed inset-0 z-50 bg-background-overlay flex items-center justify-center p-4">

          <div className="w-full max-w-md page-panel p-6">

            <h3 className="text-sm font-medium text-foreground mb-4">添加提现账户</h3>

            {!selectedAccountType ? (
              <div className="space-y-3">

                {accountTypes.map((type) => (
                  <button

                    key={type.id}

                    onClick={() => setSelectedAccountType(type.id)}

                    className="w-full p-4 rounded-md bg-surface-75 hover:bg-surface-200 border border-border hover:border-border-strong text-left transition-all"

                  >

                    <div className="flex items-center gap-4">

                      <type.icon className="w-6 h-6 text-foreground-muted" />

                      <div className="flex-1">

                        <div className="text-[13px] font-medium text-foreground">{type.name}</div>

                        <div className="text-xs text-foreground-muted">{type.description}</div>

                      </div>

                      <span className="text-xs text-brand-500">{type.fee}</span>

                    </div>

                  </button>

                ))}

              </div>

            ) : (
              <div className="space-y-4">

                {selectedAccountType === "bank" && (
                  <>

                    <div>

                      <label className="block text-[13px] font-medium text-foreground mb-2">

                        开户银行

                      </label>

                      <Input placeholder="请选择银行" className="h-9 bg-surface-200 border-border" />

                    </div>

                    <div>

                      <label className="block text-[13px] font-medium text-foreground mb-2">

                        银行卡号

                      </label>

                      <Input placeholder="请输入银行卡号" className="h-9 bg-surface-200 border-border" />

                    </div>

                    <div>

                      <label className="block text-[13px] font-medium text-foreground mb-2">

                        开户人姓名

                      </label>

                      <Input placeholder="请输入开户人姓名" className="h-9 bg-surface-200 border-border" />

                    </div>

                  </>

                )}

                {(selectedAccountType === "alipay" || selectedAccountType === "wechat") && (
                  <>

                    <div>

                      <label className="block text-[13px] font-medium text-foreground mb-2">

                        账户名称

                      </label>

                      <Input placeholder="请输入真实姓名" className="h-9 bg-surface-200 border-border" />

                    </div>

                    <div>

                      <label className="block text-[13px] font-medium text-foreground mb-2">

                        {selectedAccountType === "alipay" ? "支付宝账号" : "微信账号"}

                      </label>

                      <Input placeholder="请输入手机号或邮箱" className="h-9 bg-surface-200 border-border" />

                    </div>

                  </>

                )}

              </div>

            )}

            <div className="flex gap-3 mt-6">

              <Button

                variant="outline"

                className="flex-1 border-border text-foreground-light"

                onClick={() => {
                  setShowAddAccount(false);

                  setSelectedAccountType(null);

                }}

              >

                取消

              </Button>

              {selectedAccountType && (
                <Button className="flex-1 bg-brand-500 hover:bg-brand-600 text-background">

                  确认添加

                </Button>

              )}

            </div>

          </div>

        </div>

      )}

      {/* Withdraw Modal */}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 bg-background-overlay flex items-center justify-center p-4">

          <div className="w-full max-w-md page-panel p-6">

            <h3 className="text-sm font-medium text-foreground mb-4">申请提现</h3>

            <div className="space-y-4">

              <div>

                <label className="block text-[13px] font-medium text-foreground mb-2">

                  提现金额

                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">

                    

                  </span>

                  <Input

                    type="number"

                    value={withdrawAmount}

                    onChange={(e) => setWithdrawAmount(e.target.value)}

                    placeholder="0.00"

                    className="h-10 pl-8 text-base bg-surface-200 border-border"

                  />

                </div>

                <div className="flex items-center justify-between mt-2 text-xs">

                  <span className="text-foreground-muted">

                    可提现: {availableBalance.toLocaleString()}

                  </span>

                  <button

                    onClick={() => setWithdrawAmount(availableBalance.toString())}

                    className="text-brand-500 hover:underline"

                  >

                    全部提现

                  </button>

                </div>

              </div>

              <div>

                <label className="block text-[13px] font-medium text-foreground mb-2">

                  提现账户

                </label>

                <div className="space-y-2">

                  {boundAccounts.map((account) => (
                    <button

                      key={account.id}

                      onClick={() => setSelectedAccount(account.id)}

                      className={cn(
                        "w-full p-3 rounded-md border text-left transition-all",

                        selectedAccount === account.id

                          ? "bg-brand-200 border-brand-500"

                          : "bg-surface-75 border-border hover:border-border-strong"

                      )}

                    >

                      <div className="flex items-center gap-3">

                        <div className={cn(
                          "w-4 h-4 rounded-full border-2",

                          selectedAccount === account.id

                            ? "border-brand-500 bg-brand-500"

                            : "border-border"

                        )}>

                          {selectedAccount === account.id && (
                            <Check className="w-3 h-3 text-background" />

                          )}

                        </div>

                        <div>

                          <div className="text-[13px] font-medium text-foreground">{account.name}</div>

                          <div className="text-xs text-foreground-muted">{account.account}</div>

                        </div>

                      </div>

                    </button>

                  ))}

                </div>

              </div>

              <div className="p-3 rounded-md bg-surface-75 text-xs text-foreground-muted">

                <div className="flex items-center gap-2 mb-1">

                  <Clock className="w-4 h-4" />

                  预计 1-3 个工作日到账

                </div>

                <div className="flex items-center gap-2">

                  <Shield className="w-4 h-4" />

                  本次提现免手续费

                </div>

              </div>

            </div>

            <div className="flex gap-3 mt-6">

              <Button

                variant="outline"

                className="flex-1 border-border text-foreground-light"

                onClick={() => setShowWithdraw(false)}

              >

                取消

              </Button>

              <Button

                className="flex-1 bg-brand-500 hover:bg-brand-600 text-background"

                onClick={handleWithdraw}

                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}

              >

                确认提现

              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
    </PageContainer>

  );
}

