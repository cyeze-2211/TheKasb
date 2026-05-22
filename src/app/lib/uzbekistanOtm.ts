import otmRaw from '../../uzbekistan_otm.json';

export type OtmUniversity = {
  id: number;
  name: string;
  type?: string;
  score?: number;
  url?: string;
};

export type OtmRegion = {
  id: number;
  code: string;
  name_uz: string;
  name_ru?: string;
  name_en?: string;
  universities: OtmUniversity[];
};

type OtmFile = {
  regions?: OtmRegion[];
};

const OTM = otmRaw as OtmFile;

/** Viloyatlar — OTM ro‘yxati */
export function getOtmRegions(): OtmRegion[] {
  return [...(OTM.regions ?? [])].sort((a, b) => a.name_uz.localeCompare(b.name_uz, 'uz'));
}

export function findOtmRegion(regions: OtmRegion[], regionId: number | null): OtmRegion | null {
  if (regionId == null) return null;
  return regions.find((r) => r.id === regionId) ?? null;
}

export function universitiesInRegion(region: OtmRegion | null): OtmUniversity[] {
  if (!region) return [];
  return [...region.universities].sort((a, b) => a.name.localeCompare(b.name, 'uz'));
}

export function findOtmUniversity(
  region: OtmRegion | null,
  universityId: number | null,
): OtmUniversity | null {
  if (!region || universityId == null) return null;
  return region.universities.find((u) => u.id === universityId) ?? null;
}

export function filterUniversities(list: OtmUniversity[], query: string): OtmUniversity[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => u.name.toLowerCase().includes(q));
}
