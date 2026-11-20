import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Check,
  CircleDollarSign,
  Info,
  Radio,
  RefreshCw,
  Save,
  ShieldAlert,
  Smartphone,
  Wrench,
} from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { errMsg } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import { Button, Card, ErrorBox, PageHeader, Spinner, inputCls, labelCls } from '../components/ui.jsx'

export default function AppControls() {
  const toast = useToast()
  const [configs, setConfigs] = useState({})
  const [savingKey, setSavingKey] = useState(null)

  const { data, loading, error, reload } = useAsync(async () => {
    const rows = await supabase.from('app_config').select('*').then(unwrap)
    const map = {}
    ;(rows || []).forEach((r) => {
      map[r.key] = r.value
    })
    return map
  }, [])

  useEffect(() => {
    if (data) {
      setConfigs(data)
    }
  }, [data])

  const updateSection = (key, patch) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...patch,
      },
    }))
  }

  const saveConfig = async (key) => {
    setSavingKey(key)
    try {
      const payload = {
        key,
        value: configs[key],
        updated_at: new Date().toISOString(),
      }
      await supabase.from('app_config').upsert(payload).then(unwrap)
      toast.success(`Updated ${key.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSavingKey(null)
    }
  }

  const mm = configs.maintenance_mode || { enabled: false, message: '' }
  const ver = configs.app_version || { latest_version: '6.0.5', min_supported_version: '6.0.0', force_update: false, release_notes: '' }
  const admob = configs.admob_controls || { ads_globally_enabled: true, banner_enabled: true, interstitial_enabled: true, rewarded_enabled: true }
  const ai = configs.ai_controls || { ai_enabled: true, daily_query_limit: 15, ai_greeting: 'How can I help you save today?' }

  return (
    <>
      <PageHeader
        title="App Controls"
        subtitle="Manage remote feature flags, AdMob switches, app versioning and maintenance mode in real-time."
        actions={
          <Button variant="ghost" onClick={reload} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}

      {loading && !data && (
        <div className="flex justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 1. Maintenance Mode */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mm.enabled ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Maintenance Mode</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lock app for emergency backend updates</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${mm.enabled ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400'}`}>
                  {mm.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(mm.enabled)}
                    onChange={(e) => updateSection('maintenance_mode', { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Enable Maintenance Mode
                  </span>
                </label>

                <div>
                  <label className={labelCls}>Notice Message for Users</label>
                  <textarea
                    rows={3}
                    value={mm.message || ''}
                    onChange={(e) => updateSection('maintenance_mode', { message: e.target.value })}
                    placeholder="Onyx is undergoing scheduled maintenance..."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-white/8 pt-4">
              <Button onClick={() => saveConfig('maintenance_mode')} loading={savingKey === 'maintenance_mode'}>
                <Save className="h-4 w-4" /> Save Maintenance
              </Button>
            </div>
          </Card>

          {/* 2. Version Management */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Version & Updates</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Control minimum versions and force updates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Latest Version</label>
                    <input
                      type="text"
                      value={ver.latest_version || ''}
                      onChange={(e) => updateSection('app_version', { latest_version: e.target.value })}
                      placeholder="6.0.5"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Min Supported</label>
                    <input
                      type="text"
                      value={ver.min_supported_version || ''}
                      onChange={(e) => updateSection('app_version', { min_supported_version: e.target.value })}
                      placeholder="6.0.0"
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(ver.force_update)}
                    onChange={(e) => updateSection('app_version', { force_update: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Force Update (Block access if below minimum version)
                  </span>
                </label>

                <div>
                  <label className={labelCls}>What's New / Release Notes</label>
                  <input
                    type="text"
                    value={ver.release_notes || ''}
                    onChange={(e) => updateSection('app_version', { release_notes: e.target.value })}
                    placeholder="New reports and chart improvements."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-white/8 pt-4">
              <Button onClick={() => saveConfig('app_version')} loading={savingKey === 'app_version'}>
                <Save className="h-4 w-4" /> Save Versioning
              </Button>
            </div>
          </Card>

          {/* 3. AdMob Remote Killswitch */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">AdMob Remote Controls</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Instantly pause or resume ads app-wide</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${admob.ads_globally_enabled ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'}`}>
                  {admob.ads_globally_enabled ? 'Ads Live' : 'Ads Disabled'}
                </span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={Boolean(admob.ads_globally_enabled)}
                    onChange={(e) => updateSection('admob_controls', { ads_globally_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Master Ads Killswitch</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Globally toggle all AdMob units</p>
                  </div>
                </label>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    ['banner_enabled', 'Banner Ads'],
                    ['interstitial_enabled', 'Interstitial'],
                    ['rewarded_enabled', 'Rewarded'],
                  ].map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(admob[k])}
                        onChange={(e) => updateSection('admob_controls', { [k]: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-white/8 pt-4">
              <Button onClick={() => saveConfig('admob_controls')} loading={savingKey === 'admob_controls'}>
                <Save className="h-4 w-4" /> Save Ads Config
              </Button>
            </div>
          </Card>

          {/* 4. AI Financial Engine Controls */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Onyx AI Assistant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage free AI daily limits and assistant state</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(ai.ai_enabled)}
                    onChange={(e) => updateSection('ai_controls', { ai_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Enable Onyx AI Chatbot
                  </span>
                </label>

                <div>
                  <label className={labelCls}>Daily Free Questions Per User</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ai.daily_query_limit ?? 15}
                    onChange={(e) => updateSection('ai_controls', { daily_query_limit: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Default Welcome Greeting</label>
                  <input
                    type="text"
                    value={ai.ai_greeting || ''}
                    onChange={(e) => updateSection('ai_controls', { ai_greeting: e.target.value })}
                    placeholder="How can I help you save today?"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-white/8 pt-4">
              <Button onClick={() => saveConfig('ai_controls')} loading={savingKey === 'ai_controls'}>
                <Save className="h-4 w-4" /> Save AI Config
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
