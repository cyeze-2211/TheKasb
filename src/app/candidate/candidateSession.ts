/** Admin sessiyasidan mustaqil — faqat nomzod oqimi */
export const KASB_CANDIDATE_TOKEN_KEY = 'kasb_candidate_access_token';
export const KASB_CANDIDATE_PROFILE_ID_KEY = 'kasb_candidate_profile_id';
export const KASB_CANDIDATE_USER_ID_KEY = 'kasb_candidate_user_id';
export const KASB_CANDIDATE_REFRESH_TOKEN_KEY = 'kasb_candidate_refresh_token';
export const KASB_CANDIDATE_ACCESS_EXPIRES_AT_KEY = 'kasb_candidate_access_expires_at';

export function getCandidateToken(): string | null {
  try {
    return localStorage.getItem(KASB_CANDIDATE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCandidateRefreshToken(): string | null {
  try {
    return localStorage.getItem(KASB_CANDIDATE_REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCandidateAccessExpiresAt(): string | null {
  try {
    return localStorage.getItem(KASB_CANDIDATE_ACCESS_EXPIRES_AT_KEY);
  } catch {
    return null;
  }
}

/**
 * @param accessToken — access JWT
 * @param profileId — ixtiyoriy profil id
 * @param extras — refresh va access muddati (backend yuborsa)
 */
export function setCandidateSession(
  accessToken: string,
  profileId?: string | null,
  extras?: { refreshToken?: string | null; accessExpiresAt?: string | null },
): void {
  try {
    localStorage.setItem(KASB_CANDIDATE_TOKEN_KEY, accessToken);
    if (profileId != null && profileId !== '') {
      localStorage.setItem(KASB_CANDIDATE_PROFILE_ID_KEY, profileId);
    }
    const rt = extras?.refreshToken;
    if (typeof rt === 'string' && rt.trim()) {
      localStorage.setItem(KASB_CANDIDATE_REFRESH_TOKEN_KEY, rt.trim());
    }
    const ex = extras?.accessExpiresAt;
    if (typeof ex === 'string' && ex.trim()) {
      localStorage.setItem(KASB_CANDIDATE_ACCESS_EXPIRES_AT_KEY, ex.trim());
    }
  } catch {
    /* ignore */
  }
}

export function getCandidateProfileId(): string | null {
  try {
    return localStorage.getItem(KASB_CANDIDATE_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

export function setCandidateUserId(id: number): void {
  try {
    localStorage.setItem(KASB_CANDIDATE_USER_ID_KEY, String(id));
  } catch {
    /* ignore */
  }
}

export function getCandidateUserId(): number | null {
  try {
    const s = localStorage.getItem(KASB_CANDIDATE_USER_ID_KEY);
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearCandidateSession(): void {
  try {
    localStorage.removeItem(KASB_CANDIDATE_TOKEN_KEY);
    localStorage.removeItem(KASB_CANDIDATE_PROFILE_ID_KEY);
    localStorage.removeItem(KASB_CANDIDATE_USER_ID_KEY);
    localStorage.removeItem(KASB_CANDIDATE_REFRESH_TOKEN_KEY);
    localStorage.removeItem(KASB_CANDIDATE_ACCESS_EXPIRES_AT_KEY);
  } catch {
    /* ignore */
  }
}
