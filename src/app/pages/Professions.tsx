import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { PROFESSIONS_CATEGORIES, PROFESSIONS } from '../data/mockData';
import { pageKicker, panelElite } from '../components/pageChrome';

export function Professions() {
  const [selectedCategory, setSelectedCategory] = useState(1);

  const category = PROFESSIONS_CATEGORIES.find((c) => c.id === selectedCategory);
  const professionsList = PROFESSIONS[selectedCategory as keyof typeof PROFESSIONS] || [];

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Kasblar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Rasmiy kasblar ro&apos;yxati va kategoriyalar
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0">
          <div className={panelElite}>
            <div className="flex items-center gap-2.5 border-b border-border/80 bg-gradient-to-r from-muted/25 to-transparent px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-muted to-muted/70 text-text-muted shadow-[var(--elite-shadow-xs)]">
                <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="m-0 text-base font-semibold">Kategoriyalar</h2>
            </div>
            <div className="divide-y divide-border">
              {PROFESSIONS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 ease-out hover:bg-muted/50 active:scale-[0.99] ${
                    selectedCategory === cat.id ? 'border-l-3 border-primary bg-primary/10 shadow-sm' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-lg leading-none">{cat.emoji}</span>
                    <span
                      className={`truncate text-sm font-medium ${
                        selectedCategory === cat.id ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <span className="flex-shrink-0 text-xs tabular-nums text-text-muted">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`${panelElite} p-6`}>
            <div className="mb-6 flex flex-wrap items-baseline gap-2">
              <h2 className="m-0 inline-block">{category?.name}</h2>
              <span className="text-sm text-text-muted">— {category?.count} ta kasb</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {professionsList.map((prof, index) => (
                <span
                  key={index}
                  className="cursor-pointer rounded-xl border border-border/80 bg-muted/80 px-4 py-2 text-sm font-medium shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:text-primary hover:shadow-[var(--elite-shadow-sm)] active:translate-y-0"
                >
                  {prof}
                </span>
              ))}
            </div>

            {professionsList.length === 0 ? (
              <div className="py-12 text-center text-text-muted">Bu kategoriyada kasblar mavjud emas</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
