import { useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { downloadCsv } from '../lib/csv.js'
import { decimal, errMsg, fmtDate, fmtDateTime, num, useDebounced } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Spinner,
  TableWrap,
  tdCls,
  thCls,
} from '../components/ui.jsx'

const PAGE_SIZE = 25

function UserDetail({ user }) {
  const { data, loading, error } = useAsync(async () => {
    const id = user.user_id
    const [wallets, expenses, budgets, loans] = await Promise.all([
      supabase.from('wallets').select('id,name,type,balance').eq('user_id', id).then(unwrap),
      supabase
        .from('expenses')
        .select('id,title,amount,type,category,date')
        .eq('user_id', id)
        .order('date', { ascending: false })
        .limit(10)
        .then(unwrap),
      supabase.from('budget_plans').select('id', { count: 'exact', head: true }).eq('user_id', id),
      supabase.from('loans').select('id', { count: 'exact', head: true }).eq('user_id', id),
    ])
    return { wallets, expenses, budgets: budgets.count ?? 0, loans: loans.count ?? 0 }
  }, [user.user_id])

  const rows = [
    ['Name', user.full_name || '—'],
    ['Username', user.username || '—'],
    ['E-mail', user.email],
    ['Sign-in method', user.provider],
    ['Currency', user.currency || '—'],
    ['Joined', fmtDateTime(user.created_at)],
    ['Last sign-in', fmtDateTime(user.last_sign_in_at)],
    ['User ID', user.user_id],
  ]

  return (
    <div className="space-y-5">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium text-slate-900 dark:text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>

      {loading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {error && <ErrorBox error={error} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Wallets', user.wallet_count],
              ['Transactions', user.transaction_count],
              ['Budgets', data.budgets],
              ['Loans', data.loans],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-white/5 dark:bg-white/5">
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{num(v)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Wallets</h4>
            {data.wallets.length === 0 ? (
              <p className="text-sm text-slate-500">No wallets.</p>
            ) : (
              <div className="space-y-1.5">
                {data.wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-transparent dark:bg-white/5">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {w.name} <span className="text-xs text-slate-500">· {w.type}</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{decimal(w.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Recent transactions</h4>
            {data.expenses.length === 0 ? (
              <p className="text-sm text-slate-500">No transactions.</p>
            ) : (
              <div className="space-y-1.5">
                {data.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-transparent dark:bg-white/5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {e.category} · {fmtDate(e.date)}
                      </p>
                    </div>
                    <span className={`shrink-0 font-semibold ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {e.type === 'income' ? '+' : '-'}
                      {decimal(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Users() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const q = useDebounced(search)

  useEffect(() => setPage(0), [q])

  const { data, loading, error, reload } = useAsync(
    () =>
      supabase
        .rpc('admin_list_users', { p_search: q, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE })
        .then(unwrap),
    [q, page],
  )

  const userList = Array.isArray(data) ? data : []
  const total = userList[0]?.total_count ?? 0

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.rpc('admin_delete_user', { p_user_id: toDelete.user_id }).then(unwrap)
      toast.success(`Deleted ${toDelete.email}`)
      setToDelete(null)
      setSelected(null)
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  const exportUsers = () => {
    if (!userList.length) return
    const exportData = userList.map((u) => ({
      User_ID: u.user_id,
      Email: u.email,
      Full_Name: u.full_name || '',
      Username: u.username || '',
      Provider: u.provider,
      Currency: u.currency || 'USD',
      Wallets: u.wallet_count,
      Transactions: u.transaction_count,
      Joined: u.created_at,
      Last_Sign_In: u.last_sign_in_at,
    }))
    downloadCsv(`onyx-users-${new Date().toISOString().slice(0, 10)}`, exportData)
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${num(total)} registered account${total === 1 ? '' : 's'}`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, username, e-mail" />
            <Button variant="ghost" onClick={exportUsers} disabled={!userList.length} title="Export to CSV">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}

      {!error && (
        <TableWrap>
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-white/8 bg-white/[0.03]">
              <tr>
                <th className={thCls}>User</th>
                <th className={thCls}>Method</th>
                <th className={thCls}>Wallets</th>
                <th className={thCls}>Transactions</th>
                <th className={thCls}>Joined</th>
                <th className={thCls}>Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/6">
              {userList.map((u) => (
                <tr key={u.user_id} onClick={() => setSelected(u)} className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <td className={tdCls}>
                    <p className="font-semibold text-slate-900 dark:text-white">{u.full_name || u.username || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={u.provider === 'google' ? 'blue' : 'gray'}>{u.provider}</Badge>
                  </td>
                  <td className={`${tdCls} font-medium text-slate-800 dark:text-slate-200`}>{num(u.wallet_count)}</td>
                  <td className={`${tdCls} font-medium text-slate-800 dark:text-slate-200`}>{num(u.transaction_count)}</td>
                  <td className={`${tdCls} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{fmtDate(u.created_at)}</td>
                  <td className={`${tdCls} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{fmtDate(u.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && !data && (
            <div className="flex justify-center py-16">
              <Spinner className="h-7 w-7" />
            </div>
          )}
          {data && userList.length === 0 && <EmptyState title="No users found" text="Try a different search." />}
          {userList.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={Number(total)} onChange={setPage} />}
        </TableWrap>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="User details" maxWidth="max-w-2xl">
        {selected && (
          <>
            <UserDetail user={selected} />
            <div className="mt-6 flex justify-end border-t border-white/8 pt-4">
              <Button variant="danger" onClick={() => setToDelete(selected)}>
                <Trash2 className="h-4 w-4" /> Delete user & all data
              </Button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        loading={deleting}
        title="Delete this user?"
        message={`This permanently deletes ${toDelete?.email} and ALL of their wallets, transactions, budgets and loans. This cannot be undone.`}
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
