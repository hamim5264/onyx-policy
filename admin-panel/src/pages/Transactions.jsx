import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { downloadCsv } from '../lib/csv.js'
import { decimal, fmtDate, num, useDebounced } from '../lib/format.js'
import {
  Badge,
  Button,
  EmptyState,
  ErrorBox,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  TableWrap,
  tdCls,
  thCls,
} from '../components/ui.jsx'

const PAGE_SIZE = 25

export default function Transactions() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(0)
  const q = useDebounced(search)

  useEffect(() => setPage(0), [q, type])

  const { data, loading, error, reload } = useAsync(
    () =>
      supabase
        .rpc('admin_list_transactions', {
          p_search: q,
          p_type: type,
          p_limit: PAGE_SIZE,
          p_offset: page * PAGE_SIZE,
        })
        .then(unwrap),
    [q, type, page],
  )

  const txList = Array.isArray(data) ? data : []
  const total = txList[0]?.total_count ?? 0

  const exportTransactions = () => {
    if (!txList.length) return
    const exportData = txList.map((t) => ({
      Transaction_ID: t.tx_id,
      User_Email: t.user_email,
      Title: t.title,
      Type: t.tx_type,
      Amount: t.amount,
      Category: t.category,
      Wallet: t.wallet_name || '',
      Date: t.tx_date,
      Notes: t.notes || '',
    }))
    downloadCsv(`onyx-transactions-${type}-${new Date().toISOString().slice(0, 10)}`, exportData)
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={`${num(total)} transaction${total === 1 ? '' : 's'} across all users (read-only)`}
        actions={
          <>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-36">
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <SearchInput value={search} onChange={setSearch} placeholder="Search title, category, e-mail" />
            <Button variant="ghost" onClick={exportTransactions} disabled={!txList.length} title="Export to CSV">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}

      {!error && (
        <TableWrap>
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-white/8 bg-white/[0.03]">
              <tr>
                <th className={thCls}>Title</th>
                <th className={thCls}>User</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Wallet</th>
                <th className={thCls}>Date</th>
                <th className={`${thCls} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/6">
              {txList.map((t) => (
                <tr key={t.tx_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition">
                  <td className={tdCls}>
                    <p className="max-w-[220px] truncate font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    {t.notes && <p className="max-w-[220px] truncate text-xs text-slate-500">{t.notes}</p>}
                  </td>
                  <td className={`${tdCls} max-w-[200px] truncate text-slate-600 dark:text-slate-400`}>{t.user_email}</td>
                  <td className={tdCls}>
                    <Badge tone="brand">{t.category}</Badge>
                  </td>
                  <td className={`${tdCls} text-slate-600 dark:text-slate-400`}>{t.wallet_name || '—'}</td>
                  <td className={`${tdCls} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{fmtDate(t.tx_date)}</td>
                  <td
                    className={`${tdCls} whitespace-nowrap text-right font-semibold ${
                      t.tx_type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {t.tx_type === 'income' ? '+' : '-'}
                    {decimal(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && !data && (
            <div className="flex justify-center py-16">
              <Spinner className="h-7 w-7" />
            </div>
          )}
          {data && txList.length === 0 && <EmptyState title="No transactions found" />}
          {txList.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={Number(total)} onChange={setPage} />}
        </TableWrap>
      )}
    </>
  )
}
