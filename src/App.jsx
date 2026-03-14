import { useState, useMemo, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import './App.css'

const CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
]
const CAT_ICONS = {
  Housing: '🏠', Food: '🍔', Transport: '🚗', Healthcare: '💊',
  Entertainment: '🎬', Shopping: '🛍️', Education: '📚', Savings: '💎', Other: '📦'
}
const CAT_COLORS = {
  Housing: '#818cf8', Food: '#22d37a', Transport: '#22d3ee', Healthcare: '#f472b6',
  Entertainment: '#fb923c', Shopping: '#fbbf24', Education: '#a78bfa', Savings: '#34d399', Other: '#94a3b8'
}
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function useCountUp(target, duration = 700) {
  const [current, setCurrent] = useState(target)
  const prevRef = useRef(target)
  useEffect(() => {
    const from = prevRef.current
    const diff = target - from
    if (diff === 0) return
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCurrent(from + diff * ease)
      if (p < 1) requestAnimationFrame(tick)
      else { setCurrent(target); prevRef.current = target }
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return current
}

function AnimatedAmount({ value }) {
  const v = useCountUp(value)
  return <>{formatCurrency(v)}</>
}

let nextId = 1

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
      <p>{formatCurrency(payload[0].value)}</p>
      <p style={{ color: '#7a8aaa', fontSize: '11px' }}>{payload[0].payload.percent}</p>
    </div>
  )
}

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth())
  const [activeYear, setActiveYear] = useState(new Date().getFullYear())
  const [budgetLimits, setBudgetLimits] = useState({
    Housing: 0, Food: 0, Transport: 0, Healthcare: 0,
    Entertainment: 0, Shopping: 0, Education: 0, Savings: 0, Other: 0
  })
  const [showBudgetEditor, setShowBudgetEditor] = useState(false)
  const [form, setForm] = useState({
    type: 'expense', description: '', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0]
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'charts'
  const [monthKey, setMonthKey] = useState(0)

  // Particles
  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    style: {
      left: `${(i * 7.1 + 3) % 100}%`,
      top: `${(i * 11.3 + 5) % 100}%`,
      animationDelay: `${(i * 0.7) % 6}s`,
      animationDuration: `${7 + (i % 5)}s`,
      width: `${2 + (i % 3)}px`,
      height: `${2 + (i % 3)}px`,
    }
  })), [])

  const monthlyTransactions = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear
    }), [transactions, activeMonth, activeYear])

  const filtered = useMemo(() =>
    monthlyTransactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      return true
    }), [monthlyTransactions, filterType, filterCategory])

  const totalIncome  = useMemo(() => monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthlyTransactions])
  const totalExpense = useMemo(() => monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthlyTransactions])
  const balance = totalIncome - totalExpense

  const categoryExpenses = useMemo(() => {
    const map = {}
    CATEGORIES.forEach(c => (map[c] = 0))
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return map
  }, [monthlyTransactions])

  // Chart data — last 6 months bar chart
  const barChartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      let m = activeMonth - (5 - i)
      let y = activeYear
      while (m < 0) { m += 12; y-- }
      const txs = transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === m && d.getFullYear() === y
      })
      return {
        month: MONTHS_SHORT[m],
        Income:  txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions, activeMonth, activeYear])

  // Pie chart — category breakdown
  const pieData = useMemo(() => {
    const total = totalExpense || 1
    return CATEGORIES
      .map(cat => ({
        name: cat,
        value: categoryExpenses[cat],
        fill: CAT_COLORS[cat],
        percent: `${((categoryExpenses[cat] / total) * 100).toFixed(1)}%`
      }))
      .filter(d => d.value > 0)
  }, [categoryExpenses, totalExpense])

  // Area chart — savings trend last 6 months
  const areaData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      let m = activeMonth - (5 - i)
      let y = activeYear
      while (m < 0) { m += 12; y-- }
      const txs = transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === m && d.getFullYear() === y
      })
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { month: MONTHS_SHORT[m], Savings: Math.max(inc - exp, 0) }
    })
  }, [transactions, activeMonth, activeYear])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.description || !form.amount || !form.date) return
    if (editingId !== null) {
      setTransactions(prev => prev.map(t => t.id === editingId
        ? { ...t, ...form, amount: parseFloat(form.amount) }
        : t
      ))
      setEditingId(null)
    } else {
      setTransactions(prev => [...prev, { ...form, amount: parseFloat(form.amount), id: nextId++ }])
    }
    resetForm()
  }

  function handleEdit(t) {
    setForm({ type: t.type, description: t.description, category: t.category, amount: String(t.amount), date: t.date })
    setEditingId(t.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleteConfirm(null)
  }

  // Clear ALL expense transactions (keep income)
  function handleClearExpenses() {
    setTransactions(prev => prev.filter(t => t.type === 'income'))
    setClearConfirm(false)
  }

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ type: 'expense', description: '', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0] })
  }

  function prevMonth() {
    setMonthKey(k => k + 1)
    if (activeMonth === 0) { setActiveMonth(11); setActiveYear(y => y - 1) }
    else setActiveMonth(m => m - 1)
  }
  function nextMonth() {
    setMonthKey(k => k + 1)
    if (activeMonth === 11) { setActiveMonth(0); setActiveYear(y => y + 1) }
    else setActiveMonth(m => m + 1)
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      <div className="particles-wrap">
        {particles.map(p => <div key={p.id} className="particle" style={p.style} />)}
      </div>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-wrap"><span>💰</span></div>
            <div>
              <h1 className="logo-title">BudgetTrack</h1>
              <p className="logo-sub">Personal Finance</p>
            </div>
          </div>

          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="month-label-wrap">
              <span className="month-label" key={monthKey}>{MONTHS[activeMonth]} <span className="month-year">{activeYear}</span></span>
            </div>
            <button className="nav-btn" onClick={nextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowBudgetEditor(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 19.07A10 10 0 0 0 4.93 4.93"/></svg>
              Limits
            </button>
            <button className="btn-clear" onClick={() => setClearConfirm(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Clear
            </button>
            <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
              <span className="btn-plus">+</span> Add
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Summary Cards ── */}
        <section className="summary-grid">
          {[
            { cls: 'card-income',      label: 'Total Income',   value: totalIncome,  icon: '↑', sub: `${monthlyTransactions.filter(t=>t.type==='income').length} entries` },
            { cls: 'card-expense',     label: 'Total Expenses', value: totalExpense, icon: '↓', sub: `${monthlyTransactions.filter(t=>t.type==='expense').length} entries` },
            { cls: balance >= 0 ? 'card-balance-pos' : 'card-balance-neg', label: 'Net Balance', value: balance, icon: balance >= 0 ? '✓' : '!', sub: balance >= 0 ? 'Surplus' : 'Deficit' },
            { cls: 'card-savings',     label: 'Savings Rate',   value: null, icon: '📈', sub: 'of total income', rate: savingsRate },
          ].map((c, i) => (
            <div key={c.label} className={`card ${c.cls}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="card-glow" />
              <div className="card-top">
                <span className="card-label">{c.label}</span>
                <div className="card-icon-wrap"><span>{c.icon}</span></div>
              </div>
              <p className="card-amount">
                {c.rate !== undefined
                  ? <>{savingsRate.toFixed(1)}<span className="card-unit">%</span></>
                  : <AnimatedAmount value={c.value} />}
              </p>
              <p className="card-sub">{c.sub}</p>
              <div className="card-shine" />
            </div>
          ))}
        </section>

        {/* ── Tab Switcher ── */}
        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'transactions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Transactions
          </button>
          <button className={`tab-btn ${activeTab === 'charts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('charts')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Charts & Insights
          </button>
        </div>

        {/* ── Transactions Tab ── */}
        {activeTab === 'transactions' && (
          <div className="content-grid">
            <section className="transactions-section glass-card">
              <div className="section-header">
                <div>
                  <h2>Transactions</h2>
                  <p className="section-sub">{filtered.length} entries · {MONTHS[activeMonth]}</p>
                </div>
                <div className="filters">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No transactions yet</p>
                  <span>Hit "+ Add" to record your first entry</span>
                  <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>+ Add Transaction</button>
                </div>
              ) : (
                <div className="transaction-list">
                  {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
                    <div key={t.id} className="transaction-item" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className={`tx-icon-wrap ${t.type === 'income' ? 'tx-icon-income' : 'tx-icon-expense'}`}>
                        <span>{CAT_ICONS[t.category]}</span>
                      </div>
                      <div className="tx-info">
                        <span className="tx-desc">{t.description}</span>
                        <span className="tx-meta">
                          <span className="tx-cat-badge">{t.category}</span>
                          {new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className={`tx-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <div className="tx-actions">
                        <button className="icon-btn edit-btn" onClick={() => handleEdit(t)} title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn delete-btn" onClick={() => setDeleteConfirm(t.id)} title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Budget Progress */}
            <section className="budget-section glass-card">
              <div className="section-header">
                <div>
                  <h2>Budget Progress</h2>
                  <p className="section-sub">{MONTHS[activeMonth]} overview</p>
                </div>
              </div>
              <div className="budget-list">
                {CATEGORIES.map((cat, i) => {
                  const spent = categoryExpenses[cat] || 0
                  const limit = budgetLimits[cat] || 0
                  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
                  const over = spent > limit && limit > 0
                  return (
                    <div key={cat} className="budget-item" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="budget-item-header">
                        <div className="budget-cat-info">
                          <span className="budget-cat-icon">{CAT_ICONS[cat]}</span>
                          <span className="budget-cat">{cat}</span>
                        </div>
                        <span className={`budget-amounts ${over ? 'over-budget' : ''}`}>
                          {formatCurrency(spent)}<span className="budget-limit"> / {limit > 0 ? formatCurrency(limit) : 'No limit'}</span>
                        </span>
                      </div>
                      {limit > 0 && (
                        <>
                          <div className="progress-track">
                            <div className={`progress-bar ${over ? 'bar-over' : pct > 80 ? 'bar-warning' : 'bar-ok'}`} style={{ width: `${pct}%`, animationDelay: `${0.3 + i * 0.05}s` }} />
                          </div>
                          <div className="budget-footer">
                            <span className="pct-label">{pct.toFixed(0)}% used</span>
                            {over && <span className="over-label">⚠ Over by {formatCurrency(spent - limit)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {/* ── Charts Tab ── */}
        {activeTab === 'charts' && (
          <div className="charts-grid">
            {/* Income vs Expenses Bar */}
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h2>Income vs Expenses</h2>
                <p className="section-sub">Last 6 months</p>
              </div>
              {transactions.length === 0 ? (
                <div className="chart-empty">
                  <span>📊</span><p>Add transactions to see chart</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barChartData} barGap={4} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#7a8aaa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7a8aaa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#7a8aaa', paddingTop: '12px' }} />
                    <Bar dataKey="Income"  fill="#22d37a" radius={[6,6,0,0]} maxBarSize={40} />
                    <Bar dataKey="Expense" fill="#ff6b6b" radius={[6,6,0,0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Savings Trend Area */}
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h2>Savings Trend</h2>
                <p className="section-sub">Last 6 months</p>
              </div>
              {transactions.length === 0 ? (
                <div className="chart-empty">
                  <span>📈</span><p>Add transactions to see trend</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#7a8aaa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7a8aaa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(129,140,248,0.3)' }} />
                    <Area type="monotone" dataKey="Savings" stroke="#818cf8" strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#818cf8', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#818cf8' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie — Expense Breakdown */}
            <div className="chart-card glass-card chart-pie-card">
              <div className="chart-header">
                <h2>Expense Breakdown</h2>
                <p className="section-sub">{MONTHS[activeMonth]} {activeYear}</p>
              </div>
              {pieData.length === 0 ? (
                <div className="chart-empty">
                  <span>🥧</span><p>No expenses this month</p>
                </div>
              ) : (
                <div className="pie-layout">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                        paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {pieData.map((d, i) => (
                      <div key={i} className="pie-legend-item">
                        <span className="pie-dot" style={{ background: d.fill }} />
                        <span className="pie-cat">{CAT_ICONS[d.name]} {d.name}</span>
                        <span className="pie-val">{d.percent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h2>Monthly Summary</h2>
                <p className="section-sub">{MONTHS[activeMonth]} {activeYear}</p>
              </div>
              <div className="stats-grid">
                <div className="stat-item stat-income">
                  <span className="stat-icon">💚</span>
                  <span className="stat-label">Income</span>
                  <span className="stat-val income-text">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="stat-item stat-expense">
                  <span className="stat-icon">🔴</span>
                  <span className="stat-label">Expenses</span>
                  <span className="stat-val expense-text">{formatCurrency(totalExpense)}</span>
                </div>
                <div className="stat-item stat-balance">
                  <span className="stat-icon">{balance >= 0 ? '💜' : '🟡'}</span>
                  <span className="stat-label">Balance</span>
                  <span className={`stat-val ${balance >= 0 ? 'balance-pos-text' : 'balance-neg-text'}`}>{formatCurrency(balance)}</span>
                </div>
                <div className="stat-item stat-rate">
                  <span className="stat-icon">📊</span>
                  <span className="stat-label">Savings Rate</span>
                  <span className="stat-val cyan-text">{savingsRate.toFixed(1)}%</span>
                </div>
                <div className="stat-item stat-txcount">
                  <span className="stat-icon">🧾</span>
                  <span className="stat-label">Transactions</span>
                  <span className="stat-val white-text">{monthlyTransactions.length}</span>
                </div>
                <div className="stat-item stat-avgexp">
                  <span className="stat-icon">📉</span>
                  <span className="stat-label">Avg Expense</span>
                  <span className="stat-val yellow-text">
                    {monthlyTransactions.filter(t=>t.type==='expense').length > 0
                      ? formatCurrency(totalExpense / monthlyTransactions.filter(t=>t.type==='expense').length)
                      : '₹0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-glow" />
            <div className="modal-header">
              <div>
                <h2>{editingId !== null ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p className="modal-sub">Fill in the details below</p>
              </div>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <label>Type</label>
                <div className="type-toggle">
                  <button type="button" className={form.type === 'income' ? 'type-btn active-income' : 'type-btn'}
                    onClick={() => setForm(f => ({ ...f, type: 'income' }))}>
                    <span>↑</span> Income
                  </button>
                  <button type="button" className={form.type === 'expense' ? 'type-btn active-expense' : 'type-btn'}
                    onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>
                    <span>↓</span> Expense
                  </button>
                </div>
              </div>
              <div className="form-row">
                <label>Description</label>
                <input required value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Salary, Rent…" />
              </div>
              <div className="form-row-2">
                <div className="form-row">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Amount (₹)</label>
                  <input required type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="form-row">
                <label>Date</label>
                <input required type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingId !== null ? '✓ Save Changes' : '+ Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Budget Limits Modal ── */}
      {showBudgetEditor && (
        <div className="modal-overlay" onClick={() => setShowBudgetEditor(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-glow" />
            <div className="modal-header">
              <div>
                <h2>Budget Limits</h2>
                <p className="modal-sub">Set monthly limits per category</p>
              </div>
              <button className="close-btn" onClick={() => setShowBudgetEditor(false)}>×</button>
            </div>
            <div className="budget-editor">
              {CATEGORIES.map(cat => (
                <div className="budget-edit-row" key={cat}>
                  <span className="budget-edit-icon">{CAT_ICONS[cat]}</span>
                  <label>{cat}</label>
                  <div className="budget-edit-input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" min="0" step="1"
                      value={budgetLimits[cat]}
                      onChange={e => setBudgetLimits(b => ({ ...b, [cat]: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
              ))}
              <div className="form-actions" style={{ marginTop: '8px' }}>
                <button className="btn-primary" onClick={() => setShowBudgetEditor(false)}>Save Limits</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-glow modal-glow-danger" />
            <div className="delete-icon-wrap">🗑️</div>
            <h2>Delete Transaction?</h2>
            <p className="confirm-text">This action cannot be undone.</p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear Expenses Confirm ── */}
      {clearConfirm && (
        <div className="modal-overlay" onClick={() => setClearConfirm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-glow modal-glow-danger" />
            <div className="delete-icon-wrap">🧹</div>
            <h2>Clear All Expenses?</h2>
            <p className="confirm-text">All expense transactions across every month will be deleted. Your income records will be kept safe.</p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setClearConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleClearExpenses}>Clear Expenses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
