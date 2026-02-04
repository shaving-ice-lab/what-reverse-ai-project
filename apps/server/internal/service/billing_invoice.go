package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	defaultInvoiceLimit         = 6
	maxInvoiceLimit             = 24
	workspaceInvoiceSettingsKey = "billing_invoice_settings"
)

var invoiceStatusOptions = map[string]struct{}{
	"pending":  {},
	"paid":     {},
	"failed":   {},
	"refunded": {},
}

type InvoiceSettings struct {
	TaxRate        float64 `json:"tax_rate"`
	DiscountRate   float64 `json:"discount_rate"`
	DiscountAmount float64 `json:"discount_amount"`
}

type InvoiceSettingsUpdate struct {
	TaxRate        *float64 `json:"tax_rate"`
	DiscountRate   *float64 `json:"discount_rate"`
	DiscountAmount *float64 `json:"discount_amount"`
}

type InvoicePaymentSyncRequest struct {
	Status         string     `json:"status"`
	PaymentChannel *string    `json:"payment_channel,omitempty"`
	TransactionID  *string    `json:"transaction_id,omitempty"`
	PaidAt         *time.Time `json:"paid_at,omitempty"`
}

type InvoicePaymentStatus struct {
	Status         string  `json:"status"`
	PaymentChannel *string `json:"payment_channel,omitempty"`
	TransactionID  *string `json:"transaction_id,omitempty"`
	PaidAt         *string `json:"paid_at,omitempty"`
	UpdatedAt      *string `json:"updated_at,omitempty"`
}

type InvoiceLineItem struct {
	Label     string   `json:"label"`
	Quantity  *float64 `json:"quantity,omitempty"`
	UnitPrice *float64 `json:"unit_price,omitempty"`
	Total     float64  `json:"total"`
}

type InvoiceSummary struct {
	ID             string  `json:"id"`
	InvoiceNo      string  `json:"invoice_no"`
	PeriodStart    string  `json:"period_start"`
	PeriodEnd      string  `json:"period_end"`
	Description    string  `json:"description"`
	Subtotal       float64 `json:"subtotal"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`
	TotalAmount    float64 `json:"total_amount"`
	TaxRate        float64 `json:"tax_rate"`
	DiscountRate   float64 `json:"discount_rate"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Status         string  `json:"status"`
	IssuedAt       string  `json:"issued_at"`
	PaidAt         *string `json:"paid_at,omitempty"`
	PaymentChannel *string `json:"payment_channel,omitempty"`
	TransactionID  *string `json:"transaction_id,omitempty"`
	PaymentUpdated *string `json:"payment_updated_at,omitempty"`
	DownloadURL    string  `json:"download_url"`
}

type InvoiceDetail struct {
	InvoiceSummary
	LineItems []InvoiceLineItem `json:"line_items"`
}

func (s *billingService) ListInvoices(ctx context.Context, ownerID, workspaceID uuid.UUID, limit int) ([]InvoiceSummary, error) {
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, err
	}
	if _, err := s.ensureActiveQuota(ctx, workspace.ID, plan, time.Now()); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = defaultInvoiceLimit
	}
	if limit > maxInvoiceLimit {
		limit = maxInvoiceLimit
	}
	quotas, err := s.quotaRepo.ListByWorkspace(ctx, workspace.ID, limit)
	if err != nil {
		return nil, err
	}
	invoices := make([]InvoiceSummary, 0, len(quotas))
	for _, quota := range quotas {
		summary, _, _, err := s.buildInvoiceSummary(ctx, workspace, &quota)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, summary)
	}
	return invoices, nil
}

func (s *billingService) GetInvoiceDetail(ctx context.Context, ownerID, workspaceID, invoiceID uuid.UUID) (*InvoiceDetail, error) {
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	quota, err := s.quotaRepo.GetByID(ctx, invoiceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBillingInvoiceNotFound
		}
		return nil, err
	}
	if quota.WorkspaceID != workspace.ID {
		return nil, ErrWorkspaceUnauthorized
	}
	summary, usageCost, plan, err := s.buildInvoiceSummary(ctx, workspace, quota)
	if err != nil {
		return nil, err
	}
	lineItems := buildInvoiceLineItems(plan, usageCost, summary)
	return &InvoiceDetail{
		InvoiceSummary: summary,
		LineItems:      lineItems,
	}, nil
}

func (s *billingService) buildInvoiceSummary(
	ctx context.Context,
	workspace *entity.Workspace,
	quota *entity.WorkspaceQuota,
) (InvoiceSummary, float64, *entity.BillingPlan, error) {
	plan, err := s.resolvePlanForQuota(ctx, workspace, quota)
	if err != nil {
		return InvoiceSummary{}, 0, nil, err
	}
	usageCost, err := s.usageRepo.SumCostByWorkspace(ctx, workspace.ID, quota.PeriodStart, quota.PeriodEnd)
	if err != nil {
		return InvoiceSummary{}, 0, nil, err
	}
	settings := getInvoiceSettings(workspace.Settings)
	baseFee := 0.0
	if plan != nil {
		baseFee = plan.PriceMonthly
	}
	subtotal := roundCurrency(baseFee + usageCost)
	discountAmount := calculateInvoiceDiscount(subtotal, settings)
	taxable := subtotal - discountAmount
	if taxable < 0 {
		taxable = 0
	}
	taxAmount := roundCurrency(taxable * settings.TaxRate)
	total := roundCurrency(taxable + taxAmount)
	currency := costCurrency(plan)
	invoiceNo := buildInvoiceNumber(workspace.ID, quota.PeriodStart)
	description := buildInvoiceDescription(plan, quota.PeriodStart)
	now := time.Now().UTC()
	status := "pending"
	var paidAt *string
	var paymentChannel *string
	var transactionID *string
	var paymentUpdated *string
	if s.invoicePayRepo != nil {
		payment, err := s.invoicePayRepo.GetByInvoiceID(ctx, quota.ID)
		if err != nil {
			return InvoiceSummary{}, 0, nil, err
		}
		if payment != nil {
			if normalized, ok := normalizeInvoiceStatus(payment.Status); ok {
				status = normalized
			}
			if payment.PaidAt != nil {
				paidAtValue := formatDateOnly(*payment.PaidAt)
				paidAt = &paidAtValue
			}
			if payment.PaymentChannel != nil {
				paymentChannel = payment.PaymentChannel
			}
			if payment.TransactionID != nil {
				transactionID = payment.TransactionID
			}
			paymentUpdatedValue := formatDateOnly(payment.UpdatedAt)
			paymentUpdated = &paymentUpdatedValue
		}
	}
	if paymentUpdated == nil && !quota.PeriodEnd.After(now) {
		status = "paid"
		paidAtValue := formatDateOnly(quota.PeriodEnd)
		paidAt = &paidAtValue
	}
	issuedAt := formatDateOnly(quota.PeriodEnd)
	return InvoiceSummary{
		ID:             quota.ID.String(),
		InvoiceNo:      invoiceNo,
		PeriodStart:    formatDateOnly(quota.PeriodStart),
		PeriodEnd:      formatDateOnly(quota.PeriodEnd),
		Description:    description,
		Subtotal:       subtotal,
		DiscountAmount: discountAmount,
		TaxAmount:      taxAmount,
		TotalAmount:    total,
		TaxRate:        settings.TaxRate,
		DiscountRate:   settings.DiscountRate,
		Amount:         total,
		Currency:       currency,
		Status:         status,
		IssuedAt:       issuedAt,
		PaidAt:         paidAt,
		PaymentChannel: paymentChannel,
		TransactionID:  transactionID,
		PaymentUpdated: paymentUpdated,
		DownloadURL:    fmt.Sprintf("/billing/workspaces/%s/invoices/%s/download", workspace.ID, quota.ID),
	}, usageCost, plan, nil
}

func (s *billingService) resolvePlanForQuota(
	ctx context.Context,
	workspace *entity.Workspace,
	quota *entity.WorkspaceQuota,
) (*entity.BillingPlan, error) {
	if quota != nil && quota.PlanID != uuid.Nil {
		plan, err := s.planRepo.GetByID(ctx, quota.PlanID)
		if err == nil {
			return plan, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}
	return s.getPlanByCode(ctx, workspace.Plan)
}

func buildInvoiceLineItems(plan *entity.BillingPlan, usageCost float64, summary InvoiceSummary) []InvoiceLineItem {
	baseFee := 0.0
	label := "订阅费用"
	if plan != nil {
		baseFee = plan.PriceMonthly
		if strings.TrimSpace(plan.Name) != "" {
			label = fmt.Sprintf("%s订阅", plan.Name)
		}
	}
	items := []InvoiceLineItem{
		{
			Label:     label,
			Quantity:  floatPtr(1),
			UnitPrice: floatPtr(roundCurrency(baseFee)),
			Total:     roundCurrency(baseFee),
		},
		{
			Label: "按量计费",
			Total: roundCurrency(usageCost),
		},
	}
	if summary.DiscountAmount > 0 {
		items = append(items, InvoiceLineItem{
			Label: "优惠抵扣",
			Total: roundCurrency(-summary.DiscountAmount),
		})
	}
	if summary.TaxAmount > 0 {
		items = append(items, InvoiceLineItem{
			Label: "税费",
			Total: roundCurrency(summary.TaxAmount),
		})
	}
	return items
}

func buildInvoiceDescription(plan *entity.BillingPlan, periodStart time.Time) string {
	label := "套餐"
	if plan != nil && strings.TrimSpace(plan.Name) != "" {
		label = plan.Name
	}
	return fmt.Sprintf("%s订阅 - %d年%02d月", label, periodStart.Year(), periodStart.Month())
}

func buildInvoiceNumber(workspaceID uuid.UUID, periodStart time.Time) string {
	raw := strings.ReplaceAll(workspaceID.String(), "-", "")
	suffix := strings.ToUpper(raw[:6])
	return fmt.Sprintf("INV-%s-%s", periodStart.Format("200601"), suffix)
}

func formatDateOnly(input time.Time) string {
	return input.UTC().Format("2006-01-02")
}

func floatPtr(value float64) *float64 {
	return &value
}

func (s *billingService) GetInvoiceSettings(ctx context.Context, ownerID, workspaceID uuid.UUID) (*InvoiceSettings, error) {
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	settings := getInvoiceSettings(workspace.Settings)
	return &settings, nil
}

func (s *billingService) UpdateInvoiceSettings(ctx context.Context, ownerID, workspaceID uuid.UUID, req InvoiceSettingsUpdate) (*InvoiceSettings, error) {
	workspace, err := s.authorizeBillingManage(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	current := getInvoiceSettings(workspace.Settings)
	updated := mergeInvoiceSettings(current, req)
	workspace.Settings = applyInvoiceSettings(workspace.Settings, updated)
	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}
	return &updated, nil
}

func (s *billingService) SyncInvoicePayment(ctx context.Context, ownerID, workspaceID, invoiceID uuid.UUID, req InvoicePaymentSyncRequest) (*InvoicePaymentStatus, error) {
	workspace, err := s.authorizeBillingManage(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if s.invoicePayRepo == nil {
		return nil, ErrBillingInvoiceInvalid
	}
	status, ok := normalizeInvoiceStatus(req.Status)
	if !ok {
		return nil, ErrBillingInvoiceInvalid
	}
	quota, err := s.quotaRepo.GetByID(ctx, invoiceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBillingInvoiceNotFound
		}
		return nil, err
	}
	if quota.WorkspaceID != workspace.ID {
		return nil, ErrWorkspaceUnauthorized
	}
	if status == "paid" && req.PaidAt == nil {
		now := time.Now().UTC()
		req.PaidAt = &now
	}
	existing, err := s.invoicePayRepo.GetByInvoiceID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		payment := &entity.BillingInvoicePayment{
			WorkspaceID:    workspace.ID,
			InvoiceID:      invoiceID,
			Status:         status,
			PaymentChannel: req.PaymentChannel,
			TransactionID:  req.TransactionID,
			PaidAt:         req.PaidAt,
		}
		if err := s.invoicePayRepo.Create(ctx, payment); err != nil {
			return nil, err
		}
		return buildInvoicePaymentStatus(payment), nil
	}
	existing.Status = status
	existing.PaymentChannel = req.PaymentChannel
	existing.TransactionID = req.TransactionID
	existing.PaidAt = req.PaidAt
	if err := s.invoicePayRepo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return buildInvoicePaymentStatus(existing), nil
}

func buildInvoicePaymentStatus(payment *entity.BillingInvoicePayment) *InvoicePaymentStatus {
	if payment == nil {
		return nil
	}
	var paidAt *string
	if payment.PaidAt != nil {
		value := formatDateOnly(*payment.PaidAt)
		paidAt = &value
	}
	updatedAt := formatDateOnly(payment.UpdatedAt)
	return &InvoicePaymentStatus{
		Status:         payment.Status,
		PaymentChannel: payment.PaymentChannel,
		TransactionID:  payment.TransactionID,
		PaidAt:         paidAt,
		UpdatedAt:      &updatedAt,
	}
}

func getInvoiceSettings(settings entity.JSON) InvoiceSettings {
	result := InvoiceSettings{
		TaxRate:        0,
		DiscountRate:   0,
		DiscountAmount: 0,
	}
	if settings == nil {
		return result
	}
	raw, ok := settings[workspaceInvoiceSettingsKey]
	if !ok || raw == nil {
		return result
	}
	data, ok := raw.(map[string]interface{})
	if !ok {
		if casted, ok := raw.(entity.JSON); ok {
			data = casted
		}
	}
	if data == nil {
		return result
	}
	if value, ok := toFloat(data["tax_rate"]); ok {
		result.TaxRate = sanitizeRate(value)
	}
	if value, ok := toFloat(data["discount_rate"]); ok {
		result.DiscountRate = sanitizeRate(value)
	}
	if value, ok := toFloat(data["discount_amount"]); ok && value > 0 {
		result.DiscountAmount = value
	}
	return normalizeInvoiceSettings(result)
}

func applyInvoiceSettings(settings entity.JSON, invoice InvoiceSettings) entity.JSON {
	if settings == nil {
		settings = entity.JSON{}
	}
	settings[workspaceInvoiceSettingsKey] = entity.JSON{
		"tax_rate":        invoice.TaxRate,
		"discount_rate":   invoice.DiscountRate,
		"discount_amount": invoice.DiscountAmount,
	}
	return settings
}

func mergeInvoiceSettings(current InvoiceSettings, update InvoiceSettingsUpdate) InvoiceSettings {
	if update.TaxRate != nil {
		current.TaxRate = *update.TaxRate
	}
	if update.DiscountRate != nil {
		current.DiscountRate = *update.DiscountRate
	}
	if update.DiscountAmount != nil {
		current.DiscountAmount = *update.DiscountAmount
	}
	return normalizeInvoiceSettings(current)
}

func normalizeInvoiceSettings(settings InvoiceSettings) InvoiceSettings {
	settings.TaxRate = sanitizeRate(settings.TaxRate)
	settings.DiscountRate = sanitizeRate(settings.DiscountRate)
	if settings.DiscountAmount < 0 {
		settings.DiscountAmount = 0
	}
	return settings
}

func sanitizeRate(value float64) float64 {
	if value <= 0 {
		return 0
	}
	if value > 1 {
		return 1
	}
	return value
}

func calculateInvoiceDiscount(subtotal float64, settings InvoiceSettings) float64 {
	if subtotal <= 0 {
		return 0
	}
	rateAmount := subtotal * settings.DiscountRate
	discount := roundCurrency(rateAmount + settings.DiscountAmount)
	if discount > subtotal {
		return subtotal
	}
	if discount < 0 {
		return 0
	}
	return discount
}

func normalizeInvoiceStatus(status string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(status))
	if normalized == "" {
		return "", false
	}
	if _, ok := invoiceStatusOptions[normalized]; ok {
		return normalized, true
	}
	return "", false
}
