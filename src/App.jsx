import { useEffect, useMemo, useState } from 'react'

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food', color: '#8da9ef' },
  { id: 'transport', name: 'Transport', color: '#6d8bdc' },
  { id: 'bills', name: 'Bills', color: '#344b9b' },
  { id: 'shopping', name: 'Shopping', color: '#596bb5' },
  { id: 'entertainment', name: 'Entertainment', color: '#9b8ad8' },
  { id: 'other', name: 'Other', color: '#65718c' },
]
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0)
const today = () => new Date().toISOString().slice(0, 10)
const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function useStoredState(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}
function Icon({ name }) {
  const paths = {
    wallet: <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 9h18M16 14h.01"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 19h16"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>
      {children}
    </section>
  </div>
}
function App() {
  const [expenses, setExpenses] = useStoredState('spendly-expenses-v1', [])
  const [categories, setCategories] = useStoredState('spendly-categories-v1', DEFAULT_CATEGORIES)
  const [month, setMonth] = useState(monthKey(new Date()))
  const [modal, setModal] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ amount: '', category: '', date: today(), note: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6d8bdc' })
  const [error, setError] = useState('')

  const selectedExpenses = useMemo(() => expenses.filter(e => e.date?.slice(0, 7) === month), [expenses, month])
  const total = selectedExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const previousMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return monthKey(new Date(y, m - 2, 1))
  }, [month])
  const previousTotal = expenses.filter(e => e.date?.slice(0, 7) === previousMonth).reduce((s, e) => s + Number(e.amount), 0)
  const change = previousTotal ? ((total - previousTotal) / previousTotal) * 100 : null
  const categoryTotals = categories.map(c => ({ ...c, total: selectedExpenses.filter(e => e.category === c.id).reduce((s, e) => s + Number(e.amount), 0) })).filter(c => c.total > 0)
  const trend = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 - (5 - i), 1)
    const key = monthKey(d)
    return { key, label: d.toLocaleDateString('en-IN', { month: 'short' }), total: expenses.filter(e => e.date?.slice(0, 7) === key).reduce((s, e) => s + Number(e.amount), 0) }
  })
  const maxTrend = Math.max(1, ...trend.map(t => t.total))
  const sorted = [...selectedExpenses].sort((a, b) => b.date.localeCompare(a.date))

  const openAdd = () => { setForm({ amount: '', category: categories[0]?.id || '', date: today(), note: '' }); setError(''); setModal('expense') }
  const submitExpense = e => {
    e.preventDefault()
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than zero.')
    if (!form.category) return setError('Please choose a category.')
    if (!form.date) return setError('Please choose a date.')
    if (form.note.length > 120) return setError('Note must be 120 characters or fewer.')
    setExpenses(prev => [...prev, { id: crypto.randomUUID(), amount: Number(form.amount), category: form.category, date: form.date, note: form.note.trim() }])
    setModal(''); setError('')
  }
  const removeExpense = id => {
    if (window.confirm('Delete this expense? This action cannot be undone.')) setExpenses(prev => prev.filter(e => e.id !== id))
  }
  const saveCategory = e => {
    e.preventDefault()
    const name = categoryForm.name.trim()
    if (!name) return setError('Enter a category name.')
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategory?.id)) return setError('That category already exists.')
    if (editingCategory) setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name, color: categoryForm.color } : c))
    else setCategories(prev => [...prev, { id: crypto.randomUUID(), name, color: categoryForm.color }])
    setModal(''); setEditingCategory(null); setError('')
  }
  const editCategory = c => { setEditingCategory(c); setCategoryForm({ name: c.name, color: c.color }); setError(''); setModal('category') }
  const deleteCategory = c => {
    if (expenses.some(e => e.category === c.id)) return window.alert('This category is currently used by expenses. Delete or reassign those expenses first.')
    if (window.confirm(`Delete the "${c.name}" category?`)) setCategories(prev => prev.filter(x => x.id !== c.id))
  }
  const exportCSV = () => {
    const rows = [['Date', 'Amount (INR)', 'Category', 'Note'], ...expenses.map(e => [e.date, e.amount, categories.find(c => c.id === e.category)?.name || 'Deleted category', e.note || ''])]
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'spendly-expenses.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const changeMonth = delta => {
    const [y, m] = month.split('-').map(Number)
    setMonth(monthKey(new Date(y, m - 1 + delta, 1)))
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Icon name="wallet"/></span><span>spendly<span className="brand-dot">.</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><span><Icon name="chart"/></span>Overview</button>
      <div className="sidebar-bottom"><div className="mini-avatar">S</div><div><strong>Personal space</strong><small>Your private tracker</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div><div className="eyebrow">PERSONAL FINANCE</div><h1>Expense overview</h1></div>
        <div className="top-actions"><button className="btn btn-light" onClick={exportCSV}><Icon name="download"/> Export CSV</button><button className="btn btn-primary" onClick={openAdd}><Icon name="plus"/> Add expense</button></div>
      </header>

      <section className="welcome-row">
        <div><p className="muted">A clearer view of your money.</p><h2>Good money habits start with <em>awareness.</em></h2></div>
        <div className="month-picker"><button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button><span>{new Date(`${month}-02T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span><button onClick={() => changeMonth(1)} aria-label="Next month">›</button></div>
      </section>

      <section className="stats-grid">
        <article className="stat-card primary-stat"><div className="stat-top"><span>Total spending</span><span className="stat-icon"><Icon name="wallet"/></span></div><strong>{money(total)}</strong><small>{change === null ? 'No previous-month comparison' : <><b className={change > 0 ? 'negative' : 'positive'}>{change > 0 ? '+' : ''}{change.toFixed(1)}%</b> vs previous month</>}</small></article>
        <article className="stat-card"><div className="stat-top"><span>Transactions</span><span className="stat-icon pale"><Icon name="chart"/></span></div><strong>{selectedExpenses.length}</strong><small>Expenses recorded this month</small></article>
        <article className="stat-card"><div className="stat-top"><span>Average expense</span><span className="stat-icon pale">₹</span></div><strong>{money(selectedExpenses.length ? total / selectedExpenses.length : 0)}</strong><small>Per transaction</small></article>
      </section>

      <section className="content-grid">
        <article className="panel expense-panel">
          <div className="panel-heading"><div><h3>Recent expenses</h3><p>All your transactions for this month</p></div><button className="text-btn" onClick={openAdd}>+ Add new</button></div>
          {sorted.length ? <div className="table-wrap"><table><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th className="amount-cell">AMOUNT</th><th></th></tr></thead><tbody>
            {sorted.map(e => { const c = categories.find(x => x.id === e.category); return <tr key={e.id}><td><div className="expense-name"><span className="category-dot" style={{ background: c?.color || '#65718c' }}></span><div><strong>{e.note || c?.name || 'Expense'}</strong><small>{c?.name || 'Uncategorised'}</small></div></div></td><td><span className="tag" style={{ '--tag-color': c?.color || '#65718c' }}>{c?.name || 'Other'}</span></td><td>{new Date(`${e.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td className="amount-cell">{money(e.amount)}</td><td><button className="icon-btn delete-btn" onClick={() => removeExpense(e.id)} aria-label="Delete expense"><Icon name="trash"/></button></td></tr> }) }
          </tbody></table></div> : <div className="empty-state"><div className="empty-icon"><Icon name="wallet"/></div><strong>No expenses yet</strong><p>Add your first expense to see it here.</p><button className="btn btn-primary" onClick={openAdd}><Icon name="plus"/> Add an expense</button></div>}
        </article>

        <article className="panel category-panel">
          <div className="panel-heading"><div><h3>Spending by category</h3><p>Where your money goes</p></div><button className="text-btn" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', color: '#6d8bdc' }); setError(''); setModal('category') }}>Manage</button></div>
          {categoryTotals.length ? <><div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(${categoryTotals.map((c, i) => { const start = categoryTotals.slice(0, i).reduce((s, x) => s + x.total, 0) / total * 100; const end = start + c.total / total * 100; return `${c.color} ${start}% ${end}%` }).join(', ')})` }}><div><strong>{money(total)}</strong><small>Total spent</small></div></div></div><div className="legend">{categoryTotals.map(c => <div className="legend-row" key={c.id}><span><i style={{ background: c.color }}></i>{c.name}</span><strong>{money(c.total)}</strong></div>)}</div></> : <div className="empty-chart">Category insights will appear after your first expense.</div>}
        </article>
      </section>

      <section className="panel trend-panel">
        <div className="panel-heading"><div><h3>Spending trend</h3><p>Your spending over the last six months</p></div><span className="chart-unit">MONTHLY · INR</span></div>
        <div className="bar-chart">{trend.map(t => <div className="bar-column" key={t.key}><div className="bar-value">{t.total ? money(t.total) : '—'}</div><div className="bar-track"><div className="bar" style={{ height: `${t.total ? Math.max(5, t.total / maxTrend * 100) : 0}%` }}></div></div><small>{t.label}</small></div>)}</div>
      </section>

      <section className="panel categories-list">
        <div className="panel-heading"><div><h3>Your categories</h3><p>Customise how you organise spending</p></div><button className="text-btn" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', color: '#6d8bdc' }); setError(''); setModal('category') }}>+ Add category</button></div>
        <div className="category-chips">{categories.map(c => <div className="category-chip" key={c.id}><span className="category-dot" style={{ background: c.color }}></span><span>{c.name}</span><button onClick={() => editCategory(c)} aria-label={`Edit ${c.name}`}>Edit</button><button className="chip-delete" onClick={() => deleteCategory(c)} aria-label={`Delete ${c.name}`}>×</button></div>)}</div>
      </section>
      <footer>Spendly <span>·</span> Your expenses stay in this browser, on this device.</footer>
    </main>

    {modal === 'expense' && <Modal title="Add an expense" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitExpense}>
      <label>Amount (₹)<input type="number" min="0.01" step="0.01" placeholder="e.g. 450" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></label>
      <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required><option value="">Choose a category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
      <label>Note <span className="optional">Optional · max 120 characters</span><input maxLength="120" placeholder="What was this expense for?" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setModal('')}>Cancel</button><button className="btn btn-primary" type="submit">Save expense</button></div>
    </form></Modal>}

    {modal === 'category' && <Modal title={editingCategory ? 'Edit category' : 'Add category'} onClose={() => { setModal(''); setEditingCategory(null) }}><form className="modal-form" onSubmit={saveCategory}>
      <label>Category name<input maxLength="30" placeholder="e.g. Health" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required /></label>
      <label>Category colour<div className="color-input"><input type="color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}/><span>{categoryForm.color.toUpperCase()}</span></div></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => { setModal(''); setEditingCategory(null) }}>Cancel</button><button className="btn btn-primary" type="submit">{editingCategory ? 'Save changes' : 'Add category'}</button></div>
    </form></Modal>}
  </div>
}

export default App
