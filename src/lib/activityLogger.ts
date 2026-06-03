import { supabase } from './supabase'

export const ActivityActions = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  SCAN_STARTED: 'scan_started',
  SCAN_COMPLETED: 'scan_completed',
  RECOMMENDATION_APPLIED: 'recommendation_applied',
  RECOMMENDATION_DISMISSED: 'recommendation_dismissed',
  AZURE_CONNECTED: 'azure_connected',
  AZURE_DISCONNECTED: 'azure_disconnected',
  SUBSCRIPTION_ADDED: 'subscription_added',
  SUBSCRIPTION_REMOVED: 'subscription_removed',
  SETTINGS_UPDATED: 'settings_updated',
  REPORT_EXPORTED: 'report_exported',
  BUDGET_UPDATED: 'budget_updated',
  PAGE_VISIT: 'page_visit',
} as const

export async function logActivity(
  action: string,
  details: Record<string, any> = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: session.access_token,
        action,
        details,
      }),
    })
  } catch (err) {
    console.error('Activity log error:', err)
  }
}