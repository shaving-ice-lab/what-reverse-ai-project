package service

import (
	"context"
	"errors"
)

// IdentityAccountPlan identity and account system plan.
type IdentityAccountPlan struct {
	Key                          string                       `json:"key"`
	Title                        string                       `json:"title"`
	Summary                      string                       `json:"summary"`
	AccountStrategy              IdentityAccountStrategy      `json:"account_strategy"`
	WorkspaceInviteFlow          WorkspaceInviteFlow          `json:"workspace_invite_flow"`
	WorkspaceSwitchingExperience WorkspaceSwitchingExperience `json:"workspace_switching_experience"`
	AccountLifecyclePolicy       AccountLifecyclePolicy       `json:"account_lifecycle_policy"`
	Notes                        []string                     `json:"notes,omitempty"`
}

// IdentityAccountStrategy account system strategy.
type IdentityAccountStrategy struct {
	Key              string   `json:"key"`
	Title            string   `json:"title"`
	LoginModes       []string `json:"login_modes"`
	SocialProviders  []string `json:"social_providers"`
	SSOProviders     []string `json:"sso_providers"`
	MFAOptions       []string `json:"mfa_options"`
	RecoveryOptions  []string `json:"recovery_options"`
	SecurityControls []string `json:"security_controls"`
	RiskSignals      []string `json:"risk_signals"`
	RolloutPlan      []string `json:"rollout_plan"`
	Notes            []string `json:"notes,omitempty"`
}

// WorkspaceInviteFlow workspace invite and join flow.
type WorkspaceInviteFlow struct {
	Key             string   `json:"key"`
	Title           string   `json:"title"`
	EntryPoints     []string `json:"entry_points"`
	InviteTypes     []string `json:"invite_types"`
	Steps           []string `json:"steps"`
	AcceptanceRules []string `json:"acceptance_rules"`
	Constraints     []string `json:"constraints"`
	AuditEvents     []string `json:"audit_events"`
	Notifications   []string `json:"notifications"`
	Notes           []string `json:"notes,omitempty"`
}

// WorkspaceSwitchingExperience multi-workspace switching experience.
type WorkspaceSwitchingExperience struct {
	Key             string   `json:"key"`
	Title           string   `json:"title"`
	EntryPoints     []string `json:"entry_points"`
	DefaultRules    []string `json:"default_rules"`
	RecentListRules []string `json:"recent_list_rules"`
	ContextSync     []string `json:"context_sync"`
	Guardrails      []string `json:"guardrails"`
	Fallbacks       []string `json:"fallbacks"`
	Notes           []string `json:"notes,omitempty"`
}

// AccountLifecyclePolicy account freeze and deletion policy.
type AccountLifecyclePolicy struct {
	Key             string   `json:"key"`
	Title           string   `json:"title"`
	Statuses        []string `json:"statuses"`
	FreezeTriggers  []string `json:"freeze_triggers"`
	FreezeActions   []string `json:"freeze_actions"`
	UnfreezeProcess []string `json:"unfreeze_process"`
	DeletionProcess []string `json:"deletion_process"`
	RetentionRules  []string `json:"retention_rules"`
	ComplianceNotes []string `json:"compliance_notes"`
	Notes           []string `json:"notes,omitempty"`
}

// PlanIdentityAccountService identity/account plan service interface.
type PlanIdentityAccountService interface {
	GetPlan(ctx context.Context) (*IdentityAccountPlan, error)
}

type planIdentityAccountService struct {
	plan IdentityAccountPlan
}

// ErrIdentityAccountPlanNotFound plan not found error.
var ErrIdentityAccountPlanNotFound = errors.New("identity account plan not found")

// NewPlanIdentityAccountService creates identity/account plan service.
func NewPlanIdentityAccountService() PlanIdentityAccountService {
	return &planIdentityAccountService{
		plan: defaultIdentityAccountPlan(),
	}
}

func (s *planIdentityAccountService) GetPlan(ctx context.Context) (*IdentityAccountPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrIdentityAccountPlanNotFound
	}
	plan := s.plan
	return &plan, nil
}

func defaultIdentityAccountPlan() IdentityAccountPlan {
	return IdentityAccountPlan{
		Key:     "identity_account_plan",
		Title:   "Identity and Account System",
		Summary: "Defines login methods, workspace invite flows, multi-workspace switching, and account lifecycle policies.",
		AccountStrategy: IdentityAccountStrategy{
			Key:             "account_strategy",
			Title:           "Account system strategy",
			LoginModes:      []string{"email_password", "email_magic_link", "social_login", "sso"},
			SocialProviders: []string{"google", "github", "apple", "microsoft"},
			SSOProviders:    []string{"saml", "oidc"},
			MFAOptions:      []string{"totp", "passkey", "recovery_codes"},
			RecoveryOptions: []string{"email_reset", "recovery_codes", "admin_recovery"},
			SecurityControls: []string{
				"credential hashing + rate limit on auth endpoints",
				"session device binding and refresh token rotation",
				"login anomaly detection with step-up verification",
			},
			RiskSignals: []string{
				"impossible travel",
				"suspicious IP reputation",
				"high failure rate",
			},
			RolloutPlan: []string{
				"phase 1: email/password + magic link",
				"phase 2: social login and MFA",
				"phase 3: enterprise SSO and SCIM",
			},
			Notes: []string{
				"Account linking should keep a stable user_id across identity providers.",
			},
		},
		WorkspaceInviteFlow: WorkspaceInviteFlow{
			Key:         "workspace_invite_flow",
			Title:       "Workspace invite and join flow",
			EntryPoints: []string{"workspace settings > members", "invite link", "domain auto-join"},
			InviteTypes: []string{"email_invite", "invite_link", "domain_join"},
			Steps: []string{
				"owner/admin creates invite with role and optional expiry",
				"invite token sent via email or shareable link",
				"recipient signs in or creates account",
				"membership created and role assigned",
				"audit event recorded and inviter notified",
			},
			AcceptanceRules: []string{
				"email invite requires matching email",
				"invite token expires in 7 days by default",
				"domain join requires verified domain and plan allows it",
			},
			Constraints: []string{
				"workspace seat limits enforced",
				"pending invite count capped per workspace",
			},
			AuditEvents: []string{
				"workspace_invite_created",
				"workspace_invite_accepted",
				"workspace_invite_expired",
				"workspace_member_removed",
			},
			Notifications: []string{
				"invite email with join link",
				"owner notification on acceptance",
			},
			Notes: []string{
				"Invite links should be single-use for high-risk workspaces.",
			},
		},
		WorkspaceSwitchingExperience: WorkspaceSwitchingExperience{
			Key:         "workspace_switching_experience",
			Title:       "Multi-workspace switching experience",
			EntryPoints: []string{"global workspace switcher", "sidebar app list", "deep link by slug"},
			DefaultRules: []string{
				"first workspace after signup is default",
				"last active workspace is preselected",
				"switching updates app list and permissions instantly",
			},
			RecentListRules: []string{
				"show last 5 workspaces ordered by recent activity",
				"pin favorite workspaces",
			},
			ContextSync: []string{
				"clear cross-workspace caches on switch",
				"refresh permissions and feature flags",
			},
			Guardrails: []string{
				"block switch when user loses membership",
				"show read-only banner for limited roles",
			},
			Fallbacks: []string{
				"fallback to default workspace when slug is invalid",
				"redirect to workspace picker when no memberships",
			},
			Notes: []string{
				"Switching should not leak data across workspaces.",
			},
		},
		AccountLifecyclePolicy: AccountLifecyclePolicy{
			Key:      "account_lifecycle_policy",
			Title:    "Account freeze and deletion policy",
			Statuses: []string{"active", "suspended", "locked", "deactivated", "deleted"},
			FreezeTriggers: []string{
				"manual_admin_action",
				"security_anomaly",
				"policy_violation",
				"payment_overdue",
			},
			FreezeActions: []string{
				"block login and API access",
				"invalidate active sessions",
				"notify user and workspace owners",
			},
			UnfreezeProcess: []string{
				"verify ownership or support ticket",
				"clear risk flags and restore access",
			},
			DeletionProcess: []string{
				"soft delete account and revoke tokens",
				"start retention timer and anonymize logs",
				"hard delete after retention window",
			},
			RetentionRules: []string{
				"default retention: 30 days",
				"retain audit logs per compliance policy",
			},
			ComplianceNotes: []string{
				"support GDPR export and deletion requests",
				"preserve billing records as required by law",
			},
			Notes: []string{
				"Account deletion should not remove workspace data without owner approval.",
			},
		},
		Notes: []string{
			"Identity plan aligns with workspace-level access control and audit logging.",
		},
	}
}
