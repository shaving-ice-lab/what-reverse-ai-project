/**
 * NodeVersionandCompatiblePolicy
 */

export interface Semver {
 major: number;
 minor: number;
 patch: number;
 prerelease?: string;
}

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export const DEFAULT_NODE_SDK_VERSION =
 process.env.NEXT_PUBLIC_NODE_SDK_VERSION || "0.1.0";

export function isSemver(version: string): boolean {
 return SEMVER_REGEX.test(version);
}

export function parseSemver(version: string): Semver | null {
 const match = version.match(SEMVER_REGEX);
 if (!match) return null;

 return {
 major: Number(match[1]),
 minor: Number(match[2]),
 patch: Number(match[3]),
 prerelease: match[4],
 };
}

export function compareSemver(a: string, b: string): number {
 const parsedA = parseSemver(a);
 const parsedB = parseSemver(b);

 if (!parsedA || !parsedB) {
 return a.localeCompare(b);
 }

 if (parsedA.major !== parsedB.major) return parsedA.major > parsedB.major ? 1 : -1;
 if (parsedA.minor !== parsedB.minor) return parsedA.minor > parsedB.minor ? 1 : -1;
 if (parsedA.patch !== parsedB.patch) return parsedA.patch > parsedB.patch ? 1 : -1;

 if (parsedA.prerelease && !parsedB.prerelease) return -1;
 if (!parsedA.prerelease && parsedB.prerelease) return 1;
 if (parsedA.prerelease && parsedB.prerelease) {
 return parsedA.prerelease.localeCompare(parsedB.prerelease);
 }

 return 0;
}

export type NodeUpgradeType = "major" | "minor" | "patch" | "prerelease" | "unknown";

export function getNodeUpgradeType(fromVersion: string, toVersion: string): NodeUpgradeType {
 const from = parseSemver(fromVersion);
 const to = parseSemver(toVersion);

 if (!from || !to) return "unknown";
 if (to.major > from.major) return "major";
 if (to.minor > from.minor) return "minor";
 if (to.patch > from.patch) return "patch";
 if (to.prerelease && to.prerelease !== from.prerelease) return "prerelease";

 return "unknown";
}

export function shouldAutoUpgrade(upgradeType: NodeUpgradeType): boolean {
 return upgradeType === "patch" || upgradeType === "minor";
}

export interface NodeCompatibilityIssue {
 type: "sdk" | "app";
 severity: "error" | "warning";
 message: string;
}

export interface NodeCompatibilityResult {
 compatible: boolean;
 issues: NodeCompatibilityIssue[];
}

export interface NodeCompatibilityContext {
 sdkVersion?: string;
 appVersion?: string;
}

export interface NodeCompatibilityInput {
 minSdkVersion?: string;
 maxSdkVersion?: string | null;
 minAppVersion?: string;
 maxAppVersion?: string | null;
}

export function checkNodeCompatibility(
 node: NodeCompatibilityInput,
 context: NodeCompatibilityContext
): NodeCompatibilityResult {
 const issues: NodeCompatibilityIssue[] = [];

 if ((node.minSdkVersion || node.maxSdkVersion) && !context.sdkVersion) {
 issues.push({
 type: "sdk",
 severity: "warning",
 message: "No SDK version context available, unable to verify compatibility",
 });
 }

 if (context.sdkVersion) {
 if (node.minSdkVersion && compareSemver(context.sdkVersion, node.minSdkVersion) < 0) {
 issues.push({
 type: "sdk",
 severity: "error",
 message: `Current SDK version is below the minimum required by this node (min ${node.minSdkVersion})`,
 });
 }
 if (node.maxSdkVersion && compareSemver(context.sdkVersion, node.maxSdkVersion) > 0) {
 issues.push({
 type: "sdk",
 severity: "error",
 message: `Current SDK version exceeds the maximum supported by this node (max ${node.maxSdkVersion})`,
 });
 }
 }

 if ((node.minAppVersion || node.maxAppVersion) && !context.appVersion) {
 issues.push({
 type: "app",
 severity: "warning",
 message: "No app version context available, unable to verify compatibility",
 });
 }

 if (context.appVersion) {
 if (node.minAppVersion && compareSemver(context.appVersion, node.minAppVersion) < 0) {
 issues.push({
 type: "app",
 severity: "error",
 message: `Current app version is below the minimum required by this node (min ${node.minAppVersion})`,
 });
 }
 if (node.maxAppVersion && compareSemver(context.appVersion, node.maxAppVersion) > 0) {
 issues.push({
 type: "app",
 severity: "error",
 message: `Current app version exceeds the maximum supported by this node (max ${node.maxAppVersion})`,
 });
 }
 }

 return {
 compatible: !issues.some((issue) => issue.severity === "error"),
 issues,
 };
}
