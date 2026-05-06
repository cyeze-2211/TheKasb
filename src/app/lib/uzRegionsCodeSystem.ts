import regionsCs from '../../CodeSystem-regions-cs.json';

type FhirConcept = {
  code: string;
  display: string;
};

export type UzRegionGroup = {
  viloyatCode: string;
  viloyatNameUz: string;
  tumanlar: Array<{ code: string; display: string }>;
};

/** SOATO 7-digit kodning dastlabki 4 ta raqami — viloyat (yoki Toshkent shahri) guruh kaliti. */
const VILOYAT_NAME_BY_PREFIX: Record<string, string> = {
  '1703': 'Andijon viloyati',
  '1706': 'Buxoro viloyati',
  '1708': 'Jizzax viloyati',
  '1710': 'Qashqadaryo viloyati',
  '1712': 'Navoiy viloyati',
  '1714': 'Namangan viloyati',
  '1718': 'Samarqand viloyati',
  '1722': 'Surxondaryo viloyati',
  '1724': 'Sirdaryo viloyati',
  '1726': 'Toshkent shahri',
  '1727': 'Toshkent viloyati',
  '1730': "Farg'ona viloyati",
  '1733': 'Xorazm viloyati',
  '1735': "Qoraqalpog'iston Respublikasi",
};

let cached: UzRegionGroup[] | null = null;

export function getUzRegionGroups(): UzRegionGroup[] {
  if (cached) return cached;
  const concepts = (regionsCs as { concept?: FhirConcept[] }).concept ?? [];
  const byPrefix = new Map<string, FhirConcept[]>();
  for (const c of concepts) {
    if (!c.code || c.code.length < 4) continue;
    const prefix = c.code.slice(0, 4);
    const arr = byPrefix.get(prefix);
    if (arr) arr.push(c);
    else byPrefix.set(prefix, [c]);
  }
  const prefixes = [...byPrefix.keys()].sort((a, b) => {
    const na = VILOYAT_NAME_BY_PREFIX[a] ?? a;
    const nb = VILOYAT_NAME_BY_PREFIX[b] ?? b;
    return na.localeCompare(nb, 'uz');
  });
  cached = prefixes.map((viloyatCode) => ({
    viloyatCode,
    viloyatNameUz: VILOYAT_NAME_BY_PREFIX[viloyatCode] ?? `SOATO ${viloyatCode}`,
    tumanlar: (byPrefix.get(viloyatCode) ?? [])
      .map((c) => ({ code: c.code, display: c.display }))
      .sort((a, b) => a.display.localeCompare(b.display, 'uz')),
  }));
  return cached;
}

export function findGroupByViloyatName(groups: UzRegionGroup[], name: string): UzRegionGroup | undefined {
  const t = name.trim();
  if (!t) return undefined;
  return groups.find((g) => g.viloyatNameUz === t);
}

export function findGroupContainingTuman(groups: UzRegionGroup[], tumanDisplay: string): UzRegionGroup | undefined {
  const t = tumanDisplay.trim();
  if (!t) return undefined;
  return groups.find((g) => g.tumanlar.some((x) => x.display === t));
}
