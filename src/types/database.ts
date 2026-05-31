export type Plan = 'free' | 'pro' | 'enterprise'
export type UserRole = 'owner' | 'admin' | 'viewer'
export type RecommendationType =
  | 'idle_vm'
  | 'underused_disk'
  | 'orphan_ip'
  | 'overprovisioned'
  | 'unused_resource'
  | 'rightsizing'
export type RecommendationStatus = 'open' | 'applied' | 'dismissed'
export type ScanStatus = 'running' | 'success' | 'failed'
export type NotificationStatus = 'sent' | 'failed'

export interface Tenant {
  id: string
  name: string
  slug: string
  azure_subscription_id: string | null
  azure_tenant_id: string | null
  azure_client_id: string | null
  azure_client_secret: string | null
  is_active: boolean
  plan: Plan
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Resource {
  id: string
  tenant_id: string
  azure_resource_id: string
  name: string
  resource_type: string
  resource_group: string
  location: string | null
  subscription_id: string | null
  tags: Record<string, string>
  is_active: boolean
  last_seen_at: string
  created_at: string
}

export interface CostSnapshot {
  id: string
  tenant_id: string
  resource_id: string
  period_start: string
  period_end: string
  cost_usd: number
  currency: string
  scanned_at: string
}

export interface Recommendation {
  id: string
  tenant_id: string
  resource_id: string
  type: RecommendationType
  title: string
  description: string | null
  estimated_monthly_saving: number
  status: RecommendationStatus
  created_at: string
  updated_at: string
}

export interface ScanLog {
  id: string
  tenant_id: string
  status: ScanStatus
  resources_scanned: number
  recommendations_found: number
  total_cost_usd: number
  error_message: string | null
  started_at: string
  finished_at: string | null
}

export interface NotificationLog {
  id: string
  tenant_id: string
  type: string
  recipient_email: string
  subject: string | null
  status: NotificationStatus
  sent_at: string
}