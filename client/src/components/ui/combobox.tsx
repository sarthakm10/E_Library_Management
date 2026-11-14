import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronsUpDown, Search, X } from 'lucide-react'
import { rank } from '@/lib/search'
import { cn } from '@/lib/utils'

interface ComboboxProps<T> {
  id?: string
  /** Selected record's ID, or '' when nothing is picked. */
  value: string
  onChange: (id: string) => void
  items: T[] | undefined
  getId: (item: T) => string
  getName: (item: T) => string
  /** Other text worth matching on (author, city, email…). */
  getKeywords?: (item: T) => unknown[]
  renderItem: (item: T) => ReactNode
  /** Short text shown on the right of the input once something is picked. */
  renderSelected?: (item: T) => ReactNode
  placeholder?: string
  loading?: boolean
  emptyText?: string
  limit?: number
}

/**
 * Search-as-you-type picker. Matches any part of the name or ID in any order, ignoring case and accents,
 * so "harry azkaban", "b11" and "rowling" all find the right book. Typing an exact ID still picks it straight away.
 */
export function Combobox<T>({
  id, value, onChange, items, getId, getName, getKeywords, renderItem, renderSelected,
  placeholder, loading, emptyText = 'No matches', limit = 8,
}: ComboboxProps<T>) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = useMemo(() => (value ? items?.find((i) => getId(i) === value) : undefined), [items, value, getId])

  // Show the picked record's name in the box; clear the box when the parent resets the value
  // (e.g. after issuing), but not when the value went empty because the user is typing a new search.
  const fromTyping = useRef(false)
  useEffect(() => {
    if (selected) setText(getName(selected))
    else if (!value && !fromTyping.current) setText('')
    fromTyping.current = false
  }, [selected, value, getName])

  const results = useMemo(() => {
    if (!items) return []
    const q = selected ? '' : text
    return items
      .map((item) => ({ item, score: rank(q, getId(item), getName(item), getKeywords?.(item)) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || getId(a.item).localeCompare(getId(b.item), undefined, { numeric: true }))
      .slice(0, limit)
      .map((r) => r.item)
  }, [items, text, selected, getId, getName, getKeywords, limit])

  useEffect(() => setActive(0), [text])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const pick = (item: T) => {
    onChange(getId(item))
    setText(getName(item))
    setOpen(false)
  }

  const type = (next: string) => {
    setText(next)
    setOpen(true)
    // An exact ID (any case) selects immediately, so fast typists and barcode scanners still work.
    const exact = items?.find((i) => getId(i).toLowerCase() === next.trim().toLowerCase())
    fromTyping.current = true
    onChange(exact ? getId(exact) : '')
  }

  const clear = () => {
    onChange('')
    setText('')
    setOpen(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); pick(results[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const showList = open && !selected

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef} id={id} value={text} placeholder={placeholder} autoComplete="off" spellCheck={false}
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        onChange={(e) => type(e.target.value)}
        onFocus={(e) => { setOpen(true); if (selected) e.currentTarget.select() }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={cn(
          'h-11 w-full rounded-xl border bg-surface-2/60 pl-10 text-sm text-ink transition-all placeholder:text-muted/70',
          'hover:border-ink/15 focus:border-accent/70 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15',
          selected ? 'border-success/40 pr-28 font-medium' : 'border-border pr-9',
        )}
      />
      {selected ? (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {renderSelected && <span className="max-w-24 truncate font-mono text-[11px] text-muted">{renderSelected(selected)}</span>}
          <button type="button" onClick={clear} aria-label="Clear" className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      )}

      {showList && (
        <ul ref={listRef} id={listId} role="listbox"
          className="scrollbar-thin absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-elevated p-1.5 shadow-lift">
          {loading && !items ? (
            <li className="px-3 py-6 text-center text-sm text-muted">Loading…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">{emptyText}</li>
          ) : results.map((item, i) => (
            <li key={getId(item)} id={`${listId}-${i}`} data-index={i} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(item) }}
              onMouseMove={() => setActive(i)}
              className={cn('cursor-pointer rounded-xl px-2.5 py-2 transition-colors', i === active ? 'bg-accent-soft' : 'hover:bg-surface-2')}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
