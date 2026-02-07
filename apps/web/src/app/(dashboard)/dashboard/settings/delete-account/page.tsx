"use client";

/**
 * DeleteAccountPage - Supabase Style
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
 AlertTriangle,
 Trash2,
 CheckCircle,
 XCircle,
 Loader2,
 Download,
 Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Deletebefore'sCheck
const preDeleteChecks = [
 {
 id: "workflows",
 title: "WorkflowData",
 description: "you'sAllWorkflowwillbyPermanentDelete",
 icon: Trash2,
 },
 {
 id: "templates",
 title: "TemplateandFavorite",
 description: "youCreateandFavorite'sTemplatewillbyRemove",
 icon: Trash2,
 },
 {
 id: "api-keys",
 title: "API Key",
 description: "All API KeywillExpire",
 icon: Shield,
 },
 {
 id: "billing",
 title: "SubscriptionandBilling",
 description: "SubscriptionwillbyCancel, notwillagainCost",
 icon: CheckCircle,
 },
];

export default function DeleteAccountPage() {
 const router = useRouter();
 const { user, logout } = useAuthStore();
 
 const [step, setStep] = useState(1);
 const [confirmText, setConfirmText] = useState("");
 const [password, setPassword] = useState("");
 const [reason, setReason] = useState("");
 const [isDeleting, setIsDeleting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const expectedText = "DeleteI'sAccount";
 const isConfirmValid = confirmText === expectedText;

 const handleDelete = async () => {
 if (!isConfirmValid || !password) return;
 
 setIsDeleting(true);
 setError(null);

 try {
 // Mock API Call
 await new Promise(resolve => setTimeout(resolve, 2000));
 
 // Sign OutandNavigate
 await logout();
 router.push("/?deleted=true");
 } catch (err) {
 setError("DeleteAccountFailed, Please try again laterRetry");
 setIsDeleting(false);
 }
 };

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 eyebrow="Settings"
 title="DeleteAccount"
 description="thisActionnotcan, PleaseCautionAction"
 backHref="/dashboard/settings"
 backLabel="BackSettings"
 />

 <div className="page-divider" />

 <div className="page-section">

 {/* StepIndicator */}
 <div className="flex items-center gap-2 mb-8">
 {[1, 2, 3].map((s) => (
 <div
 key={s}
 className={cn(
 "flex-1 h-1 rounded-full transition-colors",
 s <= step ? "bg-destructive" : "bg-surface-200"
 )}
 />
 ))}
 </div>

 {/* Step 1: afterresult */}
 {step === 1 && (
 <div className="space-y-6">
 <div className="p-5 rounded-md bg-destructive-200 border border-destructive/30">
 <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-destructive" />
 DeleteAccountwillCausewithdownafterresult
 </h3>
 <p className="text-[13px] text-foreground-light">
 PleaseReadwithdownContent, EnsureyouDeleteAccount'sImpact.
 </p>
 </div>

 <div className="space-y-3">
 {preDeleteChecks.map((check) => (
 <div
 key={check.id}
 className="flex items-start gap-4 p-4 rounded-md bg-surface-100 border border-border"
 >
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <check.icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h4 className="text-[13px] font-medium text-foreground">{check.title}</h4>
 <p className="text-xs text-foreground-muted">{check.description}</p>
 </div>
 </div>
 ))}
 </div>

 {/* ExportDataTip */}
 <div className="p-4 rounded-md bg-surface-100/60 border border-border">
 <div className="flex items-center gap-3">
 <Download className="w-4 h-4 text-foreground-muted" />
 <div className="flex-1">
 <p className="text-[13px] text-foreground">
 SuggestionatDeletebeforeExportyou'sData
 </p>
 <p className="text-xs text-foreground-muted">
 youcanwithatSettingsPageExportAllWorkflowandConfig
 </p>
 </div>
 <Link href="/dashboard/settings#data">
 <Button variant="outline" size="sm" className="border-border text-foreground-light">
 ExportData
 </Button>
 </Link>
 </div>
 </div>

 <div className="flex gap-4 pt-4">
 <Link href="/dashboard/settings" className="flex-1">
 <Button variant="outline" className="w-full border-border text-foreground-light">
 Cancel
 </Button>
 </Link>
 <Button
 onClick={() => setStep(2)}
 className="flex-1 bg-destructive hover:bg-destructive/90 text-background"
 >
 Ialready, Continue
 </Button>
 </div>
 </div>
 )}

 {/* Step 2: SelectReason */}
 {step === 2 && (
 <div className="space-y-6">
 <div className="p-5 rounded-md bg-surface-100 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-4">
 PleaseTellWeyouLeave'sReason
 </h3>
 <p className="text-[13px] text-foreground-light mb-4">
 you'sFeedbackwillHelpWeImproveProduct(Optional)
 </p>

 <div className="space-y-2">
 {[
 "ProductnotSatisfyI'sRequirements",
 "Price",
 "UsageotherheProduct",
 "Company/itemalreadyEnd",
 "otherheReason",
 ].map((r) => (
 <button
 key={r}
 onClick={() => setReason(r)}
 className={cn(
 "w-full text-left px-4 py-3 rounded-md border transition-colors text-[13px]",
 reason === r
 ? "border-border-strong bg-destructive-200 text-foreground"
 : "border-border hover:border-border-strong text-foreground-light hover:text-foreground"
 )}
 >
 {r}
 </button>
 ))}
 </div>

 {reason === "otherheReason" && (
 <textarea
 placeholder="PleaseTellWeSpecificReason..."
 className="w-full mt-4 p-3 rounded-md bg-surface-200 border border-border text-foreground text-[13px] resize-none h-24"
 />
 )}
 </div>

 <div className="flex gap-4">
 <Button
 variant="outline"
 onClick={() => setStep(1)}
 className="flex-1 border-border text-foreground-light"
 >
 Previous
 </Button>
 <Button
 onClick={() => setStep(3)}
 className="flex-1 bg-destructive hover:bg-destructive/90 text-background"
 >
 Continue
 </Button>
 </div>
 </div>
 )}

 {/* Step 3: ConfirmDelete */}
 {step === 3 && (
 <div className="space-y-6">
 <div className="p-5 rounded-md bg-destructive-200 border border-destructive/30">
 <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-destructive" />
 mostafterConfirm
 </h3>
 <p className="text-[13px] text-foreground-light">
 thisActionwillPermanentDeleteyou'sAccountandAllData, NoneRestore.
 </p>
 </div>

 {error && (
 <div className="p-3 rounded-md bg-destructive-200 border border-destructive/30 text-destructive text-[13px] flex items-center gap-2">
 <XCircle className="w-4 h-4 shrink-0" />
 {error}
 </div>
 )}

 <div className="space-y-4">
 <div>
 <Label className="text-[13px] text-foreground">
 Please enter <span className="font-mono text-destructive">"{expectedText}"</span> withConfirm
 </Label>
 <Input
 value={confirmText}
 onChange={(e) => setConfirmText(e.target.value)}
 placeholder={expectedText}
 className="mt-2 h-9 bg-surface-200 border-border"
 />
 </div>

 <div>
 <Label className="text-[13px] text-foreground">Please enteryou'sPassword</Label>
 <Input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="InputPasswordConfirm"
 className="mt-2 h-9 bg-surface-200 border-border"
 />
 </div>
 </div>

 <div className="flex gap-4 pt-4">
 <Button
 variant="outline"
 onClick={() => setStep(2)}
 className="flex-1 border-border text-foreground-light"
 disabled={isDeleting}
 >
 Previous
 </Button>
 <Button
 onClick={handleDelete}
 disabled={!isConfirmValid || !password || isDeleting}
 className="flex-1 bg-destructive hover:bg-destructive/90 text-background disabled:opacity-50"
 >
 {isDeleting ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Delete...
 </>
 ) : (
 <>
 <Trash2 className="w-4 h-4 mr-2" />
 PermanentDeleteAccount
 </>
 )}
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>
 </PageContainer>
 );
}
