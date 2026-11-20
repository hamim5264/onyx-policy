import { useEffect, useState } from 'react'
import {
  ExternalLink,
  Globe,
  Radio,
  RefreshCw,
  Save,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { errMsg } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import { Button, Card, ErrorBox, PageHeader, Spinner, inputCls, labelCls } from '../components/ui.jsx'

const defaultCms = {
  active_users: '100+',
  community_title: 'Active Users & Growing Daily',
  community_desc:
    'Empowering everyday people with private-first expense tracking, smart SMS intake, and offline AI intelligence.',
  stat_txs: '130+',
  stat_volume: '৳175K+',
  live_status: 'Live Community Milestone',
  playstore_url: 'https://play.google.com/store/apps/details?id=com.thedevhamim.onyx',
}

export default function WebsiteCms() {
  const toast = useToast()
  const [cms, setCms] = useState(defaultCms)
  const [saving, setSaving] = useState(false)
  const [realUserCount, setRealUserCount] = useState(null)

  const { data, loading, error, reload } = useAsync(async () => {
    let configValue = null
    try {
      const res = await supabase.from('app_config').select('value').eq('key', 'website_content').maybeSingle()
      configValue = res.data?.value || null
    } catch {
      // fallback
    }

    try {
      const statsRes = await supabase.rpc('admin_dashboard_stats')
      if (statsRes.data?.users_total) {
        setRealUserCount(statsRes.data.users_total)
      }
    } catch {
      // fallback
    }

    return configValue || defaultCms
  }, [])

  useEffect(() => {
    if (data) {
      setCms((prev) => ({ ...defaultCms, ...data }))
    }
  }, [data])

  const setField = (k, v) => setCms((s) => ({ ...s, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        key: 'website_content',
        value: cms,
        updated_at: new Date().toISOString(),
      }
      await supabase.from('app_config').upsert(payload).then(unwrap)
      toast.success('Public website content updated live!')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const syncRealCount = () => {
    if (realUserCount) {
      setField('active_users', `${realUserCount}+`)
      toast.success(`Populated with ${realUserCount}+ active users from database!`)
    }
  }

  return (
    <>
      <PageHeader
        title="Website CMS"
        subtitle="Manage live public website text, community milestones, active users count, and download links in real-time."
        actions={
          <div className="flex gap-2">
            <a href="/" target="_blank" rel="noreferrer">
              <Button variant="ghost" type="button">
                <ExternalLink className="h-4 w-4" /> View Live Website
              </Button>
            </a>
            <Button variant="ghost" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}

      {loading && !data && (
        <div className="flex justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {data && (
        <form onSubmit={save} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Form inputs */}
            <div className="space-y-6 lg:col-span-2">
              {/* 1. Big Active Users Milestone Section */}
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        Community Milestone Banner (Before Footer)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        The giant social-proof section on the public landing page
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>Big Counter Text</label>
                        {realUserCount && (
                          <button
                            type="button"
                            onClick={syncRealCount}
                            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-200 dark:border-transparent transition"
                          >
                            Use DB: {realUserCount}+
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={cms.active_users}
                        onChange={(e) => setField('active_users', e.target.value)}
                        placeholder="100+"
                        className={`${inputCls} font-bold text-lg text-slate-900 dark:text-white`}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Status Pill Label</label>
                      <input
                        type="text"
                        value={cms.live_status}
                        onChange={(e) => setField('live_status', e.target.value)}
                        placeholder="Live Community Milestone"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Milestone Headline</label>
                    <input
                      type="text"
                      required
                      value={cms.community_title}
                      onChange={(e) => setField('community_title', e.target.value)}
                      placeholder="Active Users & Growing Daily"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Milestone Description</label>
                    <textarea
                      rows={3}
                      value={cms.community_desc}
                      onChange={(e) => setField('community_desc', e.target.value)}
                      placeholder="Empowering everyday people with private-first expense tracking..."
                      className={inputCls}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200 dark:border-white/8">
                    <div>
                      <label className={labelCls}>Transactions Highlight</label>
                      <input
                        type="text"
                        value={cms.stat_txs}
                        onChange={(e) => setField('stat_txs', e.target.value)}
                        placeholder="130+"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Volume Managed Highlight</label>
                      <input
                        type="text"
                        value={cms.stat_volume}
                        onChange={(e) => setField('stat_volume', e.target.value)}
                        placeholder="৳175K+"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2. Download Links */}
              <Card>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Store Links</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Target for "Get Onyx on Google Play" buttons</p>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Google Play Store URL</label>
                  <input
                    type="url"
                    value={cms.playstore_url}
                    onChange={(e) => setField('playstore_url', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=com.thedevhamim.onyx"
                    className={inputCls}
                  />
                </div>
              </Card>
            </div>

            {/* Right 1 Col: Live Preview Card */}
            <div>
              <div className="sticky top-20 rounded-2xl border border-brand-500/30 bg-[#0c071d] p-5 shadow-2xl text-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300 mb-3">
                  <Sparkles className="h-4 w-4 text-brand-400" /> Live Website Preview
                </div>
                <div className="rounded-xl border border-white/10 bg-[#150d30] p-6 text-center shadow-inner">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {cms.live_status || 'Live Community Milestone'}
                  </div>
                  <div className="font-display text-5xl font-black text-white drop-shadow-[0_4px_12px_rgba(127,86,217,0.5)] mb-2">
                    {cms.active_users || '100+'}
                  </div>
                  <div className="text-base font-bold text-white mb-2">
                    {cms.community_title || 'Active Users & Growing Daily'}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 line-clamp-3 mb-4">
                    {cms.community_desc || 'Empowering everyday people with private-first expense tracking...'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                    <div className="rounded-lg bg-white/5 p-2">
                      <span className="font-bold text-white text-base block">{cms.stat_txs || '130+'}</span>
                      <span className="text-[10px] text-slate-400">Transactions</span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2">
                      <span className="font-bold text-white text-base block">{cms.stat_volume || '৳175K+'}</span>
                      <span className="text-[10px] text-slate-400">Volume</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Button type="submit" loading={saving} className="w-full py-3">
                    <Save className="h-4 w-4" /> Save Website Content Live
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  )
}
