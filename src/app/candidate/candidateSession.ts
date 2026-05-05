/** Admin sessiyasidan mustaqil — faqat nomzod oqimi */
export const KASB_CANDIDATE_TOKEN_KEY = 'kasb_candidate_access_token';
export const KASB_CANDIDATE_PROFILE_ID_KEY = 'kasb_candidate_profile_id';

export function getCandidateToken(): string | null {
  try {
    return localStorage.getItem(KASB_CANDIDATE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCandidateSession(token: string, profileId?: string | null): void {
  try {
    localStorage.setItem(KASB_CANDIDATE_TOKEN_KEY, token);
    if (profileId != null && profileId !== '') {
      localStorage.setItem(KASB_CANDIDATE_PROFILE_ID_KEY, profileId);
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

export function clearCandidateSession(): void {
  try {
    localStorage.removeItem(KASB_CANDIDATE_TOKEN_KEY);
    localStorage.removeItem(KASB_CANDIDATE_PROFILE_ID_KEY);
  } catch {
    /* ignore */
  }
}
