"use client";

/**
 * Sign UpPage - Manus Style
 * Feature: SupportLight/Dark Mode, Layout, SocialSign InPriority, MinimalDesign
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
 Eye,
 EyeOff,
 Loader2,
 CheckCircle,
 ArrowRight,
 ChevronLeft,
 Workflow,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

// CalculatePasswordIntensity (1-3)
function getPasswordStrength(password: string): number {
 let strength = 0;
 if (password.length >= 8) strength++;
 if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
 if (/\d/.test(password)) strength++;
 return strength;
}

export default function RegisterPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const redirectTo = searchParams.get("redirect") || "/dashboard";
 
 const { register, isLoading, error, clearError } = useAuthStore();
 
 const [step, setStep] = useState<"social" | "email" | "details">("social");
 const [email, setEmail] = useState("");
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [agreedToTerms, setAgreedToTerms] = useState(false);
 const [formError, setFormError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const [mounted, setMounted] = useState(false);
 
 useEffect(() => {
 setMounted(true);
 }, []);
 
 // CalculatePasswordIntensity
 const passwordStrength = getPasswordStrength(password);
 
 const handleEmailContinue = () => {
 setFormError(null);
 clearError();
 
 if (!email) {
 setFormError("Please enterEmail Address");
 return;
 }
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
 setFormError("Please enterValid'sEmail Address");
 return;
 }
 
 setStep("details");
 };
 
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 
 if (step === "email") {
 handleEmailContinue();
 return;
 }
 
 setFormError(null);
 clearError();
 
 // UsernameVerify
 if (!username) {
 setFormError("Please enterUsername");
 return;
 }
 if (username.length < 3 || username.length > 20) {
 setFormError("Usernameneedneed 3-20 Character");
 return;
 }
 if (!/^[a-zA-Z0-9_]+$/.test(username)) {
 setFormError("UsernamecanContainschar, countcharanddownline");
 return;
 }
 
 // PasswordVerify
 if (!password) {
 setFormError("Please enterPassword");
 return;
 }
 if (password.length < 8) {
 setFormError("Passwordfewneedneed 8 Character");
 return;
 }
 if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
 setFormError("PasswordneedneedContainsSizechar");
 return;
 }
 if (!/\d/.test(password)) {
 setFormError("PasswordneedneedContainscountchar");
 return;
 }
 
 // Confirm PasswordVerify
 if (password !== confirmPassword) {
 setFormError("timesInput'sPasswordnot1");
 return;
 }
 
 // Terms of ServiceVerify
 if (!agreedToTerms) {
 setFormError("PleaseReadandAgreeTerms of ServiceandPrivacy Policy");
 return;
 }
 
 try {
 await register({ email, username, password });
 setSuccess(true);
 } catch {
 // Erroralreadyat store Process
 }
 };
 
 const handleBack = () => {
 if (step === "details") {
 setStep("email");
 } else if (step === "email") {
 setStep("social");
 }
 setFormError(null);
 clearError();
 };
 
 // Sign UpSuccessPage
 if (success) {
 return (
 <div className={cn(
 "w-full max-w-[400px] mx-auto transition-all duration-500",
 mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
 )}>
 {/* Logo */}
 <div className="flex justify-center mb-8">
 <div className="w-16 h-16 flex items-center justify-center">
 <Workflow className="w-12 h-12 text-foreground/90" />
 </div>
 </div>
 
 <div className="text-center">
 <div className="flex justify-center mb-6">
 <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
 <CheckCircle className="h-8 w-8 text-primary" />
 </div>
 </div>
 <h1 className="text-[24px] font-semibold text-foreground mb-2">Sign UpSuccess</h1>
 <p className="text-[15px] text-muted-foreground mb-8">
 VerifyEmailalreadySend
 <br />
 <span className="text-foreground font-medium">{email}</span>
 </p>
 <div className="space-y-3">
 <Link
 href="/login"
 className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl bg-primary text-primary-foreground font-medium text-[15px] hover:bg-primary/90 transition-all active:scale-[0.98]"
 >
 beforeSign In
 <ArrowRight className="h-4 w-4" />
 </Link>
 <button
 type="button"
 className="w-full h-[52px] rounded-xl bg-muted border border-border text-muted-foreground font-medium text-[15px] hover:bg-muted/80 transition-all cursor-pointer active:scale-[0.98]"
 >
 re-newSendVerifyEmail
 </button>
 </div>
 </div>
 </div>
 );
 }
 
 return (
 <div className={cn(
 "w-full max-w-[400px] mx-auto transition-all duration-500",
 mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
 )}>
 {/* Logo */}
 <div className="flex justify-center mb-8">
 <Link href="/" className="group">
 <div className="w-16 h-16 flex items-center justify-center">
 <Workflow className="w-12 h-12 text-foreground/90 group-hover:text-foreground transition-colors" />
 </div>
 </Link>
 </div>
 
 {/* Title */}
 <div className="text-center mb-8">
 <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
 {step === "social" ? "Sign InorSign Up": step === "email" ? "UsageEmailSign Up": "ImproveInfo"}
 </h1>
 <p className="mt-2 text-[15px] text-muted-foreground">
 {step === "social" ? "and AgentFlow 1StartCreative": step === "email" ? "Inputyou'sEmail Address": "Settingsyou'sAccountInfo"}
 </p>
 </div>
 
 {step === "social" && (
 <div className={cn(
 "transition-all duration-300",
 mounted ? "opacity-100" : "opacity-0"
 )}>
 {/* SocialSign InButton - ResponseTheme */}
 <div className="space-y-3 mb-6">
 {/* Google Button */}
 <button
 type="button"
 onClick={() => window.location.href = authApi.getOAuthUrl("google")}
 className="w-full h-[52px] rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98]"
 >
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
 </svg>
 Usage Google Sign In
 </button>
 
 {/* Microsoft Button */}
 <button
 type="button"
 onClick={() => window.location.href = authApi.getOAuthUrl("microsoft")}
 className="w-full h-[52px] rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98]"
 >
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path fill="#F25022" d="M1 1h10v10H1z"/>
 <path fill="#00A4EF" d="M1 13h10v10H1z"/>
 <path fill="#7FBA00" d="M13 1h10v10H13z"/>
 <path fill="#FFB900" d="M13 13h10v10H13z"/>
 </svg>
 Usage Microsoft Sign In
 </button>
 
 {/* Apple Button */}
 <button
 type="button"
 className="w-full h-[52px] rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98]"
 >
 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
 <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
 </svg>
 Usage Apple Sign In
 </button>
 </div>
 
 {/* Separatorline - ResponseTheme */}
 <div className="flex items-center gap-4 mb-6">
 <div className="flex-1 h-px bg-border" />
 <span className="text-[13px] text-muted-foreground">oruser</span>
 <div className="flex-1 h-px bg-border" />
 </div>
 
 {/* EmailSign UpButton */}
 <button
 type="button"
 onClick={() => setStep("email")}
 className="w-full h-[52px] rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]"
 >
 UsageEmailSign Up
 <ArrowRight className="w-4 h-4" />
 </button>
 
 {/* Sign InLink */}
 <div className="mt-8 text-center">
 <p className="text-[14px] text-muted-foreground">
 alreadyhasAccount?{""}
 <Link
 href={`/login${redirectTo !== '/workflows' ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
 className="text-foreground hover:text-primary font-medium transition-colors duration-200"
 >
 NowSign In
 </Link>
 </p>
 </div>
 </div>
 )}
 
 {step === "email" && (
 <div className={cn(
 "transition-all duration-300",
 mounted ? "opacity-100" : "opacity-0"
 )}>
 <button
 type="button"
 onClick={handleBack}
 className="mb-6 text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 cursor-pointer group"
 >
 <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
 Back
 </button>
 
 <form onSubmit={handleSubmit}>
 {(formError || error) && (
 <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[14px]">
 {formError || error}
 </div>
 )}
 
 <div className="space-y-4">
 <input
 type="email"
 placeholder="Please enteryou'sElectronicEmailAddress"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 autoComplete="email"
 autoFocus
 className="w-full h-[52px] px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
 />
 
 <button
 type="submit"
 disabled={!email}
 className={cn(
 "w-full h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]",
 email 
 ? "bg-primary text-primary-foreground hover:bg-primary/90" 
 : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
 )}
 >
 Continue
 {email && <ArrowRight className="w-4 h-4" />}
 </button>
 </div>
 </form>
 </div>
 )}
 
 {step === "details" && (
 <div className={cn(
 "transition-all duration-300",
 mounted ? "opacity-100" : "opacity-0"
 )}>
 <button
 type="button"
 onClick={handleBack}
 className="mb-6 text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 cursor-pointer group"
 >
 <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
 Back
 </button>
 
 <div className="mb-6 p-4 rounded-xl bg-muted border border-border">
 <p className="text-[13px] text-muted-foreground">Sign UpEmail</p>
 <p className="text-[15px] text-foreground font-medium mt-1">{email}</p>
 </div>
 
 <form onSubmit={handleSubmit}>
 {(formError || error) && (
 <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[14px]">
 {formError || error}
 </div>
 )}
 
 <div className="space-y-4">
 {/* Username */}
 <div>
 <label className="block text-[13px] text-muted-foreground mb-2">Username</label>
 <input
 type="text"
 placeholder="your-username"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 autoComplete="username"
 className="w-full h-[52px] px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
 />
 </div>
 
 {/* Password */}
 <div>
 <label className="block text-[13px] text-muted-foreground mb-2">Password</label>
 <div className="relative">
 <input
 type={showPassword ? "text" : "password"}
 placeholder="few 8 Character"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 autoComplete="new-password"
 className="w-full h-[52px] px-4 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
 tabIndex={-1}
 >
 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
 </button>
 </div>
 
 {/* PasswordIntensityIndicator */}
 {password && (
 <div className="mt-2">
 <div className="flex gap-1">
 <div className={cn(
 "h-1 flex-1 rounded transition-colors",
 passwordStrength >= 1 ? "bg-red-500" : "bg-muted-foreground/20"
 )} />
 <div className={cn(
 "h-1 flex-1 rounded transition-colors",
 passwordStrength >= 2 ? "bg-yellow-500" : "bg-muted-foreground/20"
 )} />
 <div className={cn(
 "h-1 flex-1 rounded transition-colors",
 passwordStrength >= 3 ? "bg-primary" : "bg-muted-foreground/20"
 )} />
 </div>
 <p className="text-[12px] text-muted-foreground mt-1">
 {passwordStrength === 1 && ""}
 {passwordStrength === 2 && ""}
 {passwordStrength === 3 && ""}
 </p>
 </div>
 )}
 </div>
 
 {/* Confirm Password */}
 <div>
 <label className="block text-[13px] text-muted-foreground mb-2">Confirm Password</label>
 <input
 type={showPassword ? "text" : "password"}
 placeholder="againtimesInputPassword"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 autoComplete="new-password"
 className="w-full h-[52px] px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
 />
 </div>
 
 {/* Terms of ServiceCheckbox */}
 <div className="flex items-start gap-3 pt-2">
 <input
 type="checkbox"
 id="terms"
 checked={agreedToTerms}
 onChange={(e) => setAgreedToTerms(e.target.checked)}
 className="mt-1 h-4 w-4 rounded border-border bg-transparent text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
 />
 <label htmlFor="terms" className="text-[13px] text-muted-foreground leading-relaxed cursor-pointer">
 IalreadyReadandAgree{""}
 <Link href="/terms" className="text-foreground/60 hover:text-foreground underline">
 Terms of Service
 </Link>{""}
 and{""}
 <Link href="/privacy" className="text-foreground/60 hover:text-foreground underline">
 Privacy Policy
 </Link>
 </label>
 </div>
 
 {/* SubmitButton */}
 <button
 type="submit"
 disabled={isLoading || !username || !password || !confirmPassword || !agreedToTerms}
 className={cn(
 "w-full h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]",
 username && password && confirmPassword && agreedToTerms
 ? "bg-primary text-primary-foreground hover:bg-primary/90" 
 : "bg-muted text-muted-foreground border border-border cursor-not-allowed",
 isLoading && "opacity-70 cursor-not-allowed"
 )}
 >
 {isLoading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 Create...
 </>
 ) : (
 <>
 CreateAccount
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 );
}
