"use client";

/**
 * Add API Key Dialog - Enhanced
 */

import { useState } from "react";
import { 
 Plus, 
 Eye, 
 EyeOff, 
 AlertCircle, 
 CheckCircle2, 
 Loader2,
 Key,
 Shield,
 Sparkles,
 Zap,
} from "lucide-react";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiKeysApi } from "@/lib/api/api-keys";
import { PROVIDER_CONFIGS, type ApiKeyProvider } from "@/types/api-key";

interface AddApiKeyDialogProps {
 trigger?: React.ReactNode;
 onSuccess?: () => void;
}

export function AddApiKeyDialog({ trigger, onSuccess }: AddApiKeyDialogProps) {
 const [open, setOpen] = useState(false);
 const [provider, setProvider] = useState<ApiKeyProvider>("openai");
 const [name, setName] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [isTesting, setIsTesting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [testResult, setTestResult] = useState<{
 valid: boolean;
 message: string;
 } | null>(null);
 
 const providerConfig = PROVIDER_CONFIGS[provider];
 
 // Validate key format
 const validateKey = (): boolean => {
 if (!apiKey.trim()) {
 setError("Please enter API Key");
 return false;
 }
 
 if (providerConfig.keyPattern && !providerConfig.keyPattern.test(apiKey)) {
 setError(`Invalid key format. Please check if this is a valid ${providerConfig.name} key.`);
 return false;
 }
 
 return true;
 };
 
 // Test key
 const handleTest = async () => {
 if (!validateKey()) return;
 
 setIsTesting(true);
 setTestResult(null);
 setError(null);
 
 try {
 const result = await apiKeysApi.testValue(provider, apiKey.trim());
 setTestResult({
 valid: result.valid,
 message: result.message || (result.valid ? "Key is valid": "Key is invalid"),
 });
 } catch (err) {
 setTestResult({
 valid: false,
 message: err instanceof Error ? err.message: "Test failed",
 });
 } finally {
 setIsTesting(false);
 }
 };
 
 // Submit key
 const handleSubmit = async () => {
 if (!validateKey()) return;
 
 if (!name.trim()) {
 setError("Please enter a key name");
 return;
 }
 
 setIsLoading(true);
 setError(null);
 
 try {
 await apiKeysApi.create({
 name: name.trim(),
 provider,
 key: apiKey.trim(),
 });
 
 setOpen(false);
 onSuccess?.();
 } catch (err) {
 setError(err instanceof Error ? err.message: "Failed to add key");
 } finally {
 setIsLoading(false);
 }
 };
 
 const handleOpenChange = (isOpen: boolean) => {
 setOpen(isOpen);
 if (!isOpen) {
 setProvider("openai");
 setName("");
 setApiKey("");
 setShowKey(false);
 setError(null);
 setTestResult(null);
 }
 };
 
 return (
 <Dialog open={open} onOpenChange={handleOpenChange}>
 <DialogTrigger asChild>
 {trigger || (
 <Button 
 size="sm"
 className={cn(
 "bg-gradient-to-r from-primary via-violet-500 to-indigo-500",
 "hover:from-primary/90 hover:to-indigo-400",
 "shadow-lg shadow-primary/20 hover:shadow-primary/30",
 "text-white font-medium",
 "transition-all duration-300"
 )}
 >
 <Plus className="mr-1.5 h-4 w-4" />
 Add Key
 </Button>
 )}
 </DialogTrigger>
 <DialogContent className={cn(
 "sm:max-w-[480px]",
 "border-border/50",
 "shadow-2xl"
 )}>
 {/* Top Decoration */}
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 rounded-t-lg" />
 
 <DialogHeader className="pt-2">
 <div className="flex items-center gap-3">
 <div className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center",
 "bg-gradient-to-br from-primary/20 to-violet-500/10",
 "border border-primary/20"
 )}>
 <Key className="w-6 h-6 text-primary" />
 </div>
 <div>
 <DialogTitle className="text-lg">Add API Key</DialogTitle>
 <DialogDescription className="flex items-center gap-1.5 mt-0.5">
 <Shield className="w-3 h-3" />
 Keys are encrypted with AES-256 for secure storage
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>
 
 <div className="space-y-5 py-4">
 {/* Provider Select - Enhanced */}
 <div className="space-y-3">
 <Label className="text-sm font-medium flex items-center gap-2">
 <Sparkles className="w-3.5 h-3.5 text-primary" />
 Select Provider
 </Label>
 <Select value={provider} onValueChange={(v) => setProvider(v as ApiKeyProvider)}>
 <SelectTrigger className={cn(
 "h-12 rounded-xl",
 "border-border/50 hover:border-primary/30",
 "transition-all duration-200"
 )}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl">
 {Object.values(PROVIDER_CONFIGS).map((config) => (
 <SelectItem 
 key={config.id} 
 value={config.id}
 className="rounded-lg py-3"
 >
 <div className="flex items-center gap-3">
 <span className="text-lg">{config.icon}</span>
 <div>
 <span className="font-medium">{config.name}</span>
 </div>
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 
 {/* Key Name - Enhanced */}
 <div className="space-y-3">
 <Label htmlFor="keyName" className="text-sm font-medium">
 Key Name
 </Label>
 <Input
 id="keyName"
 placeholder={`My ${providerConfig.name} Key`}
 value={name}
 onChange={(e) => setName(e.target.value)}
 className={cn(
 "h-12 rounded-xl",
 "border-border/50 focus:border-primary/50",
 "transition-all duration-200"
 )}
 />
 </div>
 
 {/* API Key - Enhanced */}
 <div className="space-y-3">
 <Label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
 API Key
 <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded">
 
 </span>
 </Label>
 <div className="relative group">
 <Input
 id="apiKey"
 type={showKey ? "text" : "password"}
 placeholder={providerConfig.keyPlaceholder}
 value={apiKey}
 onChange={(e) => {
 setApiKey(e.target.value);
 setTestResult(null);
 setError(null);
 }}
 className={cn(
 "h-12 pr-12 rounded-xl font-mono text-sm",
 "border-border/50 focus:border-primary/50",
 "transition-all duration-200"
 )}
 />
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className={cn(
 "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
 "text-muted-foreground hover:text-foreground",
 "transition-colors duration-200"
 )}
 onClick={() => setShowKey(!showKey)}
 >
 {showKey ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </Button>
 </div>
 <p className="text-xs text-muted-foreground">
 Keys are stored securely and only decrypted when executing workflows
 </p>
 </div>
 
 {/* Test Result - Enhanced */}
 {testResult && (
 <div
 className={cn(
 "flex items-center gap-3 p-4 rounded-xl",
 "animate-in slide-in-from-top-2 duration-300",
 testResult.valid
 ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
 : "bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent border border-destructive/20"
 )}
 >
 <div className={cn(
 "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
 testResult.valid ? "bg-emerald-500/20" : "bg-destructive/20"
 )}>
 {testResult.valid ? (
 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
 ) : (
 <AlertCircle className="h-4 w-4 text-destructive" />
 )}
 </div>
 <div>
 <p className={cn(
 "text-sm font-medium",
 testResult.valid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
 )}>
 {testResult.valid ? "Verification passed": "Verification failed"}
 </p>
 <p className="text-xs text-muted-foreground">{testResult.message}</p>
 </div>
 </div>
 )}
 
 {/* Error Tip - Enhanced */}
 {error && (
 <div className={cn(
 "flex items-center gap-3 p-4 rounded-xl",
 "bg-destructive/10 border border-destructive/20",
 "animate-in shake duration-300"
 )}>
 <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
 <AlertCircle className="h-4 w-4 text-destructive" />
 </div>
 <p className="text-sm text-destructive">{error}</p>
 </div>
 )}
 </div>
 
 <DialogFooter className="gap-3 pt-2">
 <Button
 type="button"
 variant="outline"
 onClick={handleTest}
 disabled={isTesting || !apiKey.trim()}
 className={cn(
 "h-11 px-5 rounded-xl",
 "border-border/50 hover:border-primary/30 hover:bg-primary/5",
 "transition-all duration-200"
 )}
 >
 {isTesting ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Verifying...
 </>
 ) : (
 <>
 <Zap className="mr-2 h-4 w-4" />
 Test Connection
 </>
 )}
 </Button>
 <Button 
 onClick={handleSubmit} 
 disabled={isLoading}
 className={cn(
 "h-11 px-6 rounded-xl",
 "bg-gradient-to-r from-primary via-violet-500 to-indigo-500",
 "hover:from-primary/90 hover:to-indigo-400",
 "shadow-lg shadow-primary/20 hover:shadow-primary/30",
 "text-white font-medium",
 "transition-all duration-300"
 )}
 >
 {isLoading ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Adding...
 </>
 ) : (
 <>
 <Plus className="mr-2 h-4 w-4" />
 Add Key
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
