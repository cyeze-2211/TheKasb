import {
  fetchPublicRegionDistricts,
  fetchPublicRegions,
  type PublicDistrict,
  type PublicRegion,
} from '../api/publicRegions';

let regionsCache: PublicRegion[] | null = null;
let regionsPromise: Promise<PublicRegion[]> | null = null;
const districtsCache = new Map<number, PublicDistrict[]>();
const districtsPromises = new Map<number, Promise<PublicDistrict[]>>();

export async function ensurePublicRegionsLoaded(): Promise<PublicRegion[]> {
  if (regionsCache) return regionsCache;
  if (!regionsPromise) {
    regionsPromise = fetchPublicRegions()
      .then((list) => {
        regionsCache = list;
        return list;
      })
      .catch((e) => {
        regionsPromise = null;
        throw e;
      });
  }
  return regionsPromise;
}

export function getPublicRegionsSync(): PublicRegion[] {
  return regionsCache ?? [];
}

export function getPublicRegionById(id: number): PublicRegion | undefined {
  return regionsCache?.find((r) => r.id === id);
}

export function findPublicRegionByName(name: string): PublicRegion | undefined {
  const t = name.trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  return regionsCache?.find(
    (r) =>
      r.name_uz === t ||
      r.name_ru === t ||
      (r.name_uz?.toLowerCase() === lower) ||
      (r.code === t),
  );
}

/** Viloyat id yoki nom → ko‘rinadigan nom (API katalog) */
export function resolvePublicRegionNameUz(regionRef: string | number | null | undefined): string {
  const s = regionRef == null ? '' : String(regionRef).trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) {
    const id = Number(s);
    return getPublicRegionById(id)?.name_uz ?? getPublicRegionById(id)?.name_ru ?? s;
  }
  return findPublicRegionByName(s)?.name_uz ?? findPublicRegionByName(s)?.name_ru ?? s;
}

/** Viloyat nomi yoki id → API `region_id` */
export function resolvePublicRegionId(regionRef: string | number | null | undefined): number | undefined {
  if (regionRef == null || regionRef === '') return undefined;
  if (typeof regionRef === 'number' && Number.isFinite(regionRef)) {
    const n = Math.trunc(regionRef);
    return n > 0 ? n : undefined;
  }
  const s = String(regionRef).trim();
  if (!s) return undefined;
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n > 0 ? n : undefined;
  }
  return findPublicRegionByName(s)?.id;
}

export async function ensurePublicDistrictsLoaded(regionId: number): Promise<PublicDistrict[]> {
  if (districtsCache.has(regionId)) return districtsCache.get(regionId)!;
  let pending = districtsPromises.get(regionId);
  if (!pending) {
    pending = fetchPublicRegionDistricts(regionId)
      .then((list) => {
        districtsCache.set(regionId, list);
        districtsPromises.delete(regionId);
        return list;
      })
      .catch((e) => {
        districtsPromises.delete(regionId);
        throw e;
      });
    districtsPromises.set(regionId, pending);
  }
  return pending;
}

export function getPublicDistrictsSync(regionId: number): PublicDistrict[] {
  return districtsCache.get(regionId) ?? [];
}

export function resolvePublicDistrictNameUz(
  districtRef: string | number | null | undefined,
  regionId?: number,
): string {
  const s = districtRef == null ? '' : String(districtRef).trim();
  if (!s) return '';
  if (regionId != null && regionId > 0) {
    const list = getPublicDistrictsSync(regionId);
    const byId = /^\d+$/.test(s) ? list.find((d) => d.id === Number(s)) : undefined;
    if (byId?.name_uz) return byId.name_uz;
    const byName = list.find((d) => d.name_uz === s || d.name_ru === s);
    if (byName?.name_uz) return byName.name_uz;
  }
  return s;
}

export function publicRegionSelectOptions(): Array<{ id: number; label: string }> {
  return (regionsCache ?? []).map((r) => ({
    id: r.id,
    label: r.name_uz ?? r.name_ru ?? String(r.id),
  }));
}

export function clearPublicRegionCatalogCache(): void {
  regionsCache = null;
  regionsPromise = null;
  districtsCache.clear();
  districtsPromises.clear();
}
