import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, X } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';
import {
  btnPrimaryLg,
  btnSecondaryLg,
  ctlInput,
  ctlInputLg,
  ctlSelect,
  ctlSelectLg,
  ctlTextarea,
  pageKicker,
  panelElite,
} from '../components/pageChrome';

export function VacancyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [professions, setProfessions] = useState([
    { category: '', profession: '', positions: 1 }
  ]);

  const [languages, setLanguages] = useState([
    { language: 'RUSSIAN', minLevel: 'B1' }
  ]);

  const addProfession = () => {
    setProfessions([...professions, { category: '', profession: '', positions: 1 }]);
  };

  const removeProfession = (index: number) => {
    setProfessions(professions.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    setLanguages([...languages, { language: 'RUSSIAN', minLevel: 'B1' }]);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      {/* Page Header */}
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">{isEdit ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya yaratish'}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Barcha zarur ma&apos;lumotlarni to&apos;ldiring
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Fields */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Asosiy ma'lumotlar</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Sarlavha <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Masalan: Oshpaz — Seul, Koreya"
                className={ctlInputLg}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Tavsif</label>
              <textarea
                rows={4}
                placeholder="Vakansiya haqida batafsil ma'lumot..."
                className={ctlTextarea}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Mamlakat kodi <span className="text-danger">*</span>
                </label>
                <select className={ctlSelectLg}>
                  <option value="">Tanlang</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Ish grafigi</label>
                <select className={ctlSelectLg}>
                  <option>TO'LIQ KUNLIK</option>
                  <option>YARIM KUNLIK</option>
                  <option>SMENALI</option>
                  <option>SHARTNOMA</option>
                  <option>MAVSUMIY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Tajriba talab</label>
                <select className={ctlSelectLg}>
                  <option>1-3 YIL</option>
                  <option>3-5 YIL</option>
                  <option>5+ YIL</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" />
                  <span className="text-sm text-text-primary">Ha, bu vakansiya shoshilinch</span>
                </label>
              </div>
            </div>
          </div>

          {/* Salary Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Maosh</h2>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-1">Min</label>
                <input
                  type="number"
                  placeholder="800"
                  className={ctlInputLg}
                />
              </div>
              <span className="text-text-muted mt-6">—</span>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-1">Max</label>
                <input
                  type="number"
                  placeholder="1200"
                  className={ctlInputLg}
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-text-primary mb-1">Valyuta</label>
                <select className={ctlSelectLg}>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>RUB</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm text-text-primary">Maosh yashirin</span>
            </label>
          </div>

          {/* Additional Info */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Qo'shimcha</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Minimal yosh</label>
                <input
                  type="number"
                  placeholder="18"
                  className={ctlInputLg}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Maksimal yosh</label>
                <input
                  type="number"
                  placeholder="45"
                  className={ctlInputLg}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Jins talabi</label>
                <select className={ctlSelectLg}>
                  <option>Farq qilmaydi</option>
                  <option>Erkak</option>
                  <option>Ayol</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Joylar soni</label>
                <input
                  type="number"
                  placeholder="5"
                  className={ctlInputLg}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Relations */}
        <div className="space-y-6">
          {/* Professions Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Kasblar</h3>
              <button
                type="button"
                onClick={addProfession}
                className="flex h-8 items-center gap-1 rounded-md bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Kasb qo'shish
              </button>
            </div>

            {professions.map((prof, index) => (
              <div key={index} className="relative space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)] ring-1 ring-black/[0.03]">
                {professions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProfession(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
                    aria-label="Kasbni olib tashlash"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Kategoriya:</label>
                  <select className={`${ctlSelect} text-xs`}>
                    <option>Oshpazchilik</option>
                    <option>Qurilish</option>
                    <option>Tibbiyot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Kasb:</label>
                  <select className={`${ctlSelect} text-xs`}>
                    <option>Oshpaz</option>
                    <option>Elektrik</option>
                    <option>Hamshira</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Joy soni:</label>
                  <input
                    type="number"
                    value={prof.positions}
                    onChange={(e) => {
                      const newProfs = [...professions];
                      newProfs[index].positions = Number(e.target.value);
                      setProfessions(newProfs);
                    }}
                    className={`${ctlInput} px-2 text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Languages Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Til talablari</h3>
              <button
                type="button"
                onClick={addLanguage}
                className="flex h-8 items-center gap-1 rounded-md bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Til qo'shish
              </button>
            </div>

            {languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2">
                <select className={`${ctlSelect} min-w-0 flex-1 text-xs`}>
                  <option>Rus tili</option>
                  <option>Ingliz tili</option>
                  <option>Nemis tili</option>
                </select>
                <select className={`${ctlSelect} w-24 flex-shrink-0 text-xs`}>
                  <option>B1</option>
                  <option>A1</option>
                  <option>A2</option>
                  <option>B2</option>
                  <option>C1</option>
                  <option>C2</option>
                </select>
                {languages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
                    aria-label="Tilni olib tashlash"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => navigate('/admin/vacancies')} className={btnSecondaryLg}>
          Bekor qilish
        </button>
        <button type="button" className={btnSecondaryLg}>
          Qoralama saqla
        </button>
        <button type="button" className={btnPrimaryLg}>
          Nashr qilish (ACTIVE)
        </button>
      </div>
    </div>
  );
}
