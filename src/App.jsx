import { useState, useMemo } from 'react'
import './App.css'

const CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
]

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
    if (activeMonth === 0) { setActiveMonth(11); setActiveYear(y => y - 1) }
    else setActiveMonth(m => m - 1)
  }
  function nextMonth() {
    if (activeMonth === 11) { setActiveMonth(0); setActiveYear(y => y + 1) }
    else setActiveMonth(m => m + 1)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <span className="logo-icon">💰</span>
            <h1>BudgetTrack</h1>
          </div>
          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth}>&#8592;</button>
            <span className="month-label">{MONTHS[activeMonth]} {activeYear}</span>
            <button className="nav-btn" onClick={nextMonth}>&#8594;</button>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowBudgetEditor(v => !v)}>Budget Limits</button>
            <button className="btn-primary" onClick={() => { cancelForm(); setShowForm(v => !v) }}>+ Add Transaction</button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="summary-grid">
          <div className="card card-income">
            <div className="card-icon">↑</div>
            <div>
              <p className="card-label">Total Income</p>
              <p className="card-amount">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="card card-expense">
            <div className="card-icon">↓</div>
            <div>
              <p className="card-label">Total Expenses</p>
              <p className="card-amount">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
          <div className={`card ${balance >= 0 ? 'card-balance-pos' : 'card-balance-neg'}`}>
            <div className="card-icon">{balance >= 0 ? '✓' : '!'}</div>
            <div>
              <p className="card-label">Balance</p>
              <p className="card-amount">{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="card card-savings">
            <div className="card-icon">📈</div>
            <div>
              <p className="card-label">Savings Rate</p>
              <p className="card-amount">{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </section>

        {showForm && (
          <div className="modal-overlay" onClick={cancelForm}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId !== null ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <button className="close-btn" onClick={cancelForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <label>Type</label>
                  <div className="type-toggle">
                    <button type="button"
                      className={form.type === 'income' ? 'type-btn active-income' : 'type-btn'}
                      onClick={() => setForm(f => ({ ...f, type: 'income' }))}>Income</button>
                    <button type="button"
                      className={form.type === 'expense' ? 'type-btn active-expense' : 'type-btn'}
                      onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>Expense</button>
                  </div>
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <input required value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Monthly Rent" />
                </div>
                <div className="form-row">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Amount ($)</label>
                  <input required type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-row">
                  <label>Date</label>
                  <input required type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editingId !== null ? 'Save Changes' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBudgetEditor && (
          <div className="modal-overlay" onClick={() => setShowBudgetEditor(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Monthly Budget Limits</h2>
                <button className="close-btn" onClick={() => setShowBudgetEditor(false)}>×</button>
              </div>
              <div className="budget-editor">
                {CATEGORIES.map(cat => (
                  <div className="form-row" key={cat}>
                    <label>{cat}</label>
                    <input type="number" min="0" step="1"
                      value={budgetLimits[cat]}
                      onChange={e => setBudgetLimits(b => ({ ...b, [cat]: parseFloat(e.target.value) || 0 }))} />
                  </div>
                ))}
                <div className="form-actions">
                  <button className="btn-primary" onClick={() => setShowBudgetEditor(false)}>Done</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="content-grid">
          <section className="transactions-section">
            <div className="section-header">
              <h2>Transactions</h2>
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
                <p>No transactions found.</p>
                <button className="btn-primary" onClick={() => { cancelForm(); setShowForm(true) }}>Add one now</button>
              </div>
            ) : (
              <div className="transaction-list">
                {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                  <div key={t.id} className="transaction-item">
                    <div className={`tx-dot ${t.type === 'income' ? 'dot-income' : 'dot-expense'}`}></div>
                    <div className="tx-info">
                      <span className="tx-desc">{t.description}</span>
                      <span className="tx-meta">
                        {t.category} · {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`tx-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <div className="tx-actions">
                      <button className="icon-btn edit-btn" onClick={() => handleEdit(t)} title="Edit">✎</button>
                      <button className="icon-btn delete-btn" onClick={() => setDeleteConfirm(t.id)} title="Delete">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="budget-section">
            <div className="section-header">
              <h2>Budget Progress</h2>
            </div>
            <div className="budget-list">
              {CATEGORIES.map(cat => {
                const spent = categoryExpenses[cat] || 0
                const limit = budgetLimits[cat] || 0
                const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
                const over = spent > limit && limit > 0
                return (
                  <div key={cat} className="budget-item">
                    <div className="budget-item-header">
                      <span className="budget-cat">{cat}</span>
                      <span className={`budget-amounts ${over ? 'over-budget' : ''}`}>
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-bar ${over ? 'bar-over' : pct > 80 ? 'bar-warning' : 'bar-ok'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    {over && <span className="over-label">Over by {formatCurrency(spent - limit)}</span>}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <h2>Delete Transaction?</h2>
            <p className="confirm-text">This action cannot be undone.</p>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
