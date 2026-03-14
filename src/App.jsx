import { useState, useMemo, useEffect, useRef } from 'react'
import './App.css'

const CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
]

const CAT_ICONS = {
  Housing: '🏠', Food: '🍔', Transport: '🚗', Healthcare: '💊',
  Entertainment: '🎬', Shopping: '🛍️', Education: '📚', Savings: '💎', Other: '📦'
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const initialTransactions = [
  { id: 1, type: 'income',  description: 'Monthly Salary',    category: 'Other',         amount: 5000, date: '2026-03-01' },
  { id: 2, type: 'expense', description: 'Rent',              category: 'Housing',       amount: 1400, date: '2026-03-01' },
  { id: 3, type: 'expense', description: 'Groceries',         category: 'Food',          amount: 320,  date: '2026-03-05' },
  { id: 4, type: 'expense', description: 'Netflix',           category: 'Entertainment', amount: 18,   date: '2026-03-07' },
  { id: 5, type: 'income',  description: 'Freelance Project', category: 'Other',         amount: 800,  date: '2026-03-10' },
  { id: 6, type: 'expense', description: 'Car Insurance',     category: 'Transport',     amount: 145,  date: '2026-03-12' },
]

let nextId = 7

// Animated number counter hook
function useCountUp(target, duration = 800) {
  const [current, setCurrent] = useState(target)
  const prevRef = useRef(target)
  useEffect(() => {
    const from = prevRef.current
    const diff = target - from
    if (diff === 0) return
    const startTime = performance.now()
    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCurrent(from + diff * ease)
      if (progress < 1) requestAnimationFrame(tick)
      else { setCurrent(target); prevRef.current = target }
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return current
}

function AnimatedAmount({ value, prefix = '' }) {
  const animated = useCountUp(value)
  return <>{prefix}{formatCurrency(animated)}</>
}

function Particle({ style }) {
  return <div className="particle" style={style} />
}

export default function App() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [activeMonth, setActiveMonth] = useState(2)
  const [activeYear, setActiveYear] = useState(2026)
  const [budgetLimits, setBudgetLimits] = useState({
    Housing: 1500, Food: 500, Transport: 300,
    Healthcare: 200, Entertainment: 150, Shopping: 200,
    Education: 100, Savings: 500, Other: 300
  })
  const [showBudgetEditor, setShowBudgetEditor] = useState(false)
  const [form, setForm] = useState({
    type: 'expense', description: '', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0]
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [monthDir, setMonthDir] = useState(0) // -1 left, 1 right
  const [monthKey, setMonthKey] = useState(0)

  // Particles
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 6}s`,
      animationDuration: `${6 + Math.random() * 8}s`,
      width: `${2 + Math.random() * 3}px`,
      height: `${2 + Math.random() * 3}px`,
      opacity: 0.15 + Math.random() * 0.25,
    }
  })), [])

  const monthlyTransactions = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear
    }),
  [transactions, activeMonth, activeYear])

  const filtered = useMemo(() =>
    monthlyTransactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      return true
    }),
  [monthlyTransactions, filterType, filterCategory])

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
    setForm({ type: 'expense', description: '', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
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

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ type: 'expense', description: '', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0] })
  }

  function prevMonth() {
    setMonthDir(-1); setMonthKey(k => k + 1)
    if (activeMonth === 0) { setActiveMonth(11); setActiveYear(y => y - 1) }
    else setActiveMonth(m => m - 1)
  }
  function nextMonth() {
    setMonthDir(1); setMonthKey(k => k + 1)
    if (activeMonth === 11) { setActiveMonth(0); setActiveYear(y => y + 1) }
    else setActiveMonth(m => m + 1)
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  return (
    <div className="app">
      {/* Animated background */}
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      <div className="particles-wrap">
        {particles.map(p => <Particle key={p.id} style={p.style} />)}
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-wrap">
              <span className="logo-emoji">💰</span>
            </div>
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
              <span className="month-label" key={monthKey} data-dir={monthDir}>
                {MONTHS[activeMonth]} <span className="month-year">{activeYear}</span>
              </span>
            </div>
            <button className="nav-btn" onClick={nextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowBudgetEditor(v => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 19.07A10 10 0 0 0 4.93 4.93"/></svg>
              Budget Limits
            </button>
            <button className="btn-primary" onClick={() => { cancelForm(); setShowForm(v => !v) }}>
              <span className="btn-plus">+</span> Add Transaction
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Summary Cards */}
        <section className="summary-grid">
          {[
            { cls: 'card-income',   label: 'Total Income',   value: totalIncome,  icon: '↑', sub: `${monthlyTransactions.filter(t=>t.type==='income').length} transactions` },
            { cls: 'card-expense',  label: 'Total Expenses', value: totalExpense, icon: '↓', sub: `${monthlyTransactions.filter(t=>t.type==='expense').length} transactions` },
            { cls: balance >= 0 ? 'card-balance-pos' : 'card-balance-neg', label: 'Net Balance', value: balance, icon: balance >= 0 ? '✓' : '!', sub: balance >= 0 ? 'Looking good!' : 'Over budget' },
            { cls: 'card-savings',  label: 'Savings Rate',   value: null, icon: '📈', sub: 'of total income', rate: savingsRate },
          ].map((c, i) => (
            <div key={c.label} className={`card ${c.cls}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="card-glow" />
              <div className="card-top">
                <span className="card-label">{c.label}</span>
                <div className="card-icon-wrap">
                  <span className="card-icon">{c.icon}</span>
                </div>
              </div>
              <p className="card-amount">
                {c.rate !== undefined
                  ? <>{savingsRate.toFixed(1)}<span className="card-unit">%</span></>
                  : <AnimatedAmount value={c.value} />
                }
              </p>
              <p className="card-sub">{c.sub}</p>
              <div className="card-shine" />
            </div>
          ))}
        </section>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={cancelForm}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-glow" />
              <div className="modal-header">
                <div>
                  <h2>{editingId !== null ? 'Edit Transaction' : 'New Transaction'}</h2>
                  <p className="modal-sub">Fill in the details below</p>
                </div>
                <button className="close-btn" onClick={cancelForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <label>Type</label>
                  <div className="type-toggle">
                    <button type="button"
                      className={form.type === 'income' ? 'type-btn active-income' : 'type-btn'}
                      onClick={() => setForm(f => ({ ...f, type: 'income' }))}>
                      <span>↑</span> Income
                    </button>
                    <button type="button"
                      className={form.type === 'expense' ? 'type-btn active-expense' : 'type-btn'}
                      onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>
                      <span>↓</span> Expense
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <input required value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Monthly Rent" />
                </div>
                <div className="form-row-2">
                  <div className="form-row">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{CAT_ICONS[c]} {c}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Amount ($)</label>
                    <input required type="number" min="0.01" step="0.01" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-row">
                  <label>Date</label>
                  <input required type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editingId !== null ? '✓ Save Changes' : '+ Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget Limits Modal */}
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
                      <span className="input-prefix">$</span>
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

        <div className="content-grid">
          {/* Transactions */}
          <section className="transactions-section glass-card">
            <div className="section-header">
              <div>
                <h2>Transactions</h2>
                <p className="section-sub">{filtered.length} entries this month</p>
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
                <div className="empty-icon">🌙</div>
                <p>No transactions found</p>
                <span>Try changing filters or add a new one</span>
                <button className="btn-primary" onClick={() => { cancelForm(); setShowForm(true) }}>+ Add Transaction</button>
              </div>
            ) : (
              <div className="transaction-list">
                {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
                  <div key={t.id} className="transaction-item" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`tx-icon-wrap ${t.type === 'income' ? 'tx-icon-income' : 'tx-icon-expense'}`}>
                      <span>{CAT_ICONS[t.category]}</span>
                    </div>
                    <div className="tx-info">
                      <span className="tx-desc">{t.description}</span>
                      <span className="tx-meta">
                        <span className="tx-cat-badge">{t.category}</span>
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  <div key={cat} className="budget-item" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="budget-item-header">
                      <div className="budget-cat-info">
                        <span className="budget-cat-icon">{CAT_ICONS[cat]}</span>
                        <span className="budget-cat">{cat}</span>
                      </div>
                      <span className={`budget-amounts ${over ? 'over-budget' : ''}`}>
                        {formatCurrency(spent)}
                        <span className="budget-limit"> / {formatCurrency(limit)}</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-bar ${over ? 'bar-over' : pct > 80 ? 'bar-warning' : 'bar-ok'}`}
                        style={{ width: `${pct}%`, animationDelay: `${0.3 + i * 0.05}s` }}
                      />
                    </div>
                    <div className="budget-footer">
                      <span className="pct-label">{pct.toFixed(0)}% used</span>
                      {over && <span className="over-label">⚠ Over by {formatCurrency(spent - limit)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-glow modal-glow-danger" />
            <div className="delete-icon-wrap">🗑️</div>
            <h2>Delete Transaction?</h2>
            <p className="confirm-text">This action cannot be undone.</p>
            <div className="form-actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
