"use client";

/**
 * ROICalculator - InvestmentrateCalculateComponent

 * 

 * HelpUserEstimateUsage AgentFlow after'sCostSave
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
 Calculator,

 Users,

 Clock,

 DollarSign,

 TrendingUp,

 Sparkles,

 Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface CalculatorInputs {
 employees: number;

 hoursPerWeek: number;

 hourlyRate: number;

 automationRate: number;
}

export function ROICalculator() {
 const [inputs, setInputs] = useState<CalculatorInputs>({
 employees: 10,

 hoursPerWeek: 5,

 hourlyRate: 50,

 automationRate: 70,

 });

 const [showResults, setShowResults] = useState(false);

 const results = useMemo(() => {
 const weeklyHours = inputs.employees * inputs.hoursPerWeek;

 const weeklyLaborcost = weeklyHours * inputs.hourlyRate;

 const yearlyLaborCost = weeklyLaborcost * 52;

 const automatedHours = weeklyHours * (inputs.automationRate / 100);

 const savedCostPerYear = yearlyLaborCost * (inputs.automationRate / 100);

 // Estimated AgentFlow cost (Pro plan)

 const agentflowCost = inputs.employees * 49 * 12; // $49/user/month

 const netSavings = savedCostPerYear - agentflowCost;

 const roi = ((netSavings / agentflowCost) * 100);

 return {
 weeklyHours,

 automatedHours,

 yearlyLaborCost,

 savedCostPerYear,

 agentflowCost,

 netSavings,

 roi,

 hoursFreedPerYear: automatedHours * 52,

 };

 }, [inputs]);

 const handleInputChange = (key: keyofCalculatorInputs, value: number) => {
 setInputs(prev => ({ ...prev, [key]: value }));

 };

 return (
 <div className="w-full max-w-4xl mx-auto">

 <div className={cn(
 "rounded-2xl overflow-hidden",

 "bg-card border border-border",

 "shadow-lg"

 )}>

 {/* Header */}

 <div className="p-6 border-b border-border bg-muted/30">

 <div className="flex items-center gap-3">

 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">

 <Calculator className="w-5 h-5 text-primary" />

 </div>

 <div>

 <h3 className="font-semibold text-foreground">ROI Calculate</h3>

 <p className="text-sm text-muted-foreground">EstimateUsage AgentFlow after'sInvestment</p>

 </div>

 </div>

 </div>

 <div className="p-6">

 <div className="grid md:grid-cols-2 gap-8">

 {/* Inputs */}

 <div className="space-y-6">

 <h4 className="font-medium text-foreground flex items-center gap-2">

 <Info className="w-4 h-4 text-muted-foreground" />

 Inputyou'sData

 </h4>

 {/* Employees */}

 <div className="space-y-2">

 <label className="flex items-center justify-between text-sm">

 <span className="flex items-center gap-2 text-muted-foreground">

 <Users className="w-4 h-4" />

 Teampersoncount

 </span>

 <span className="font-semibold text-foreground">{inputs.employees} person</span>

 </label>

 <input

 type="range"

 min="1"

 max="100"

 value={inputs.employees}

 onChange={(e) => handleInputChange('employees', Number(e.target.value))}

 className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"

 />

 <div className="flex justify-between text-xs text-muted-foreground">

 <span>1</span>

 <span>100</span>

 </div>

 </div>

 {/* Hours per week */}

 <div className="space-y-2">

 <label className="flex items-center justify-between text-sm">

 <span className="flex items-center gap-2 text-muted-foreground">

 <Clock className="w-4 h-4" />

 eachpersoneachweeksre-WorkTime

 </span>

 <span className="font-semibold text-foreground">{inputs.hoursPerWeek} h</span>

 </label>

 <input

 type="range"

 min="1"

 max="40"

 value={inputs.hoursPerWeek}

 onChange={(e) => handleInputChange('hoursPerWeek', Number(e.target.value))}

 className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"

 />

 <div className="flex justify-between text-xs text-muted-foreground">

 <span>1 h</span>

 <span>40 h</span>

 </div>

 </div>

 {/* Hourly rate */}

 <div className="space-y-2">

 <label className="flex items-center justify-between text-sm">

 <span className="flex items-center gap-2 text-muted-foreground">

 <DollarSign className="w-4 h-4" />

 AveragetimeCost

 </span>

 <span className="font-semibold text-foreground">{inputs.hourlyRate}/h</span>

 </label>

 <input

 type="range"

 min="20"

 max="200"

 step="10"

 value={inputs.hourlyRate}

 onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}

 className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"

 />

 <div className="flex justify-between text-xs text-muted-foreground">

 <span>¥20</span>

 <span>¥200</span>

 </div>

 </div>

 {/* Automation rate */}

 <div className="space-y-2">

 <label className="flex items-center justify-between text-sm">

 <span className="flex items-center gap-2 text-muted-foreground">

 <Sparkles className="w-4 h-4" />

 EstimatedcanAutomationcompareexample

 </span>

 <span className="font-semibold text-foreground">{inputs.automationRate}%</span>

 </label>

 <input

 type="range"

 min="30"

 max="90"

 step="5"

 value={inputs.automationRate}

 onChange={(e) => handleInputChange('automationRate', Number(e.target.value))}

 className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"

 />

 <div className="flex justify-between text-xs text-muted-foreground">

 <span> 30%</span>

 <span> 90%</span>

 </div>

 </div>

 <Button 

 onClick={() => setShowResults(true)}

 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"

 >

 <Calculator className="w-4 h-4 mr-2" />

 Calculate ROI

 </Button>

 </div>

 {/* Results */}

 <div className={cn(
 "space-y-4 transition-all duration-500",

 showResults ? "opacity-100" : "opacity-50"

 )}>

 <h4 className="font-medium text-foreground flex items-center gap-2">

 <TrendingUp className="w-4 h-4 text-primary" />

 EstimateRevenue

 </h4>

 {/* Main ROI Card */}

 <div className={cn(
 "p-6 rounded-xl text-center",

 "bg-gradient-to-br from-primary/20 to-primary/5",

 "border border-primary/30"

 )}>

 <p className="text-sm text-muted-foreground mb-2">yearsInvestmentrate</p>

 <p className="text-5xl font-bold text-primary">

 {results.roi > 0 ? `${results.roi.toFixed(0)}%` : '—'}

 </p>

 <p className="text-xs text-muted-foreground mt-2">

 Save {results.netSavings.toLocaleString()} / years

 </p>

 </div>

 {/* Breakdown */}

 <div className="grid grid-cols-2 gap-3">

 <div className="p-4 rounded-xl bg-muted/50 border border-border">

 <p className="text-xs text-muted-foreground mb-1">eachyearsSavetime</p>

 <p className="text-xl font-bold text-foreground">

 {results.hoursFreedPerYear.toLocaleString()}

 </p>

 <p className="text-xs text-muted-foreground">h</p>

 </div>

 <div className="p-4 rounded-xl bg-muted/50 border border-border">

 <p className="text-xs text-muted-foreground mb-1">SavepersonCost</p>

 <p className="text-xl font-bold text-foreground">

 {(results.savedCostPerYear / 10000).toFixed(1)}

 </p>

 <p className="text-xs text-muted-foreground">10000/years</p>

 </div>

 <div className="p-4 rounded-xl bg-muted/50 border border-border">

 <p className="text-xs text-muted-foreground mb-1">AgentFlow years</p>

 <p className="text-xl font-bold text-foreground">

 {(results.agentflowCost / 10000).toFixed(1)}

 </p>

 <p className="text-xs text-muted-foreground">10000/years</p>

 </div>

 <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">

 <p className="text-xs text-muted-foreground mb-1">Revenue</p>

 <p className="text-xl font-bold text-primary">

 {(results.netSavings / 10000).toFixed(1)}

 </p>

 <p className="text-xs text-muted-foreground">10000/years</p>

 </div>

 </div>

 <p className="text-xs text-muted-foreground text-center pt-2">

 * withonDataonlyReference, ActualRevenueatSpecificUsageScenario

 </p>

 </div>

 </div>

 </div>

 </div>

 </div>

 );
}

export default ROICalculator;

