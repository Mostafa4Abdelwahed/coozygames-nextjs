export type ProfileGap = 'name' | 'phoneNumber'

type GapUser = {
  name?: string | null
  phoneNumber?: string | null
}

/**
 * Profile is complete when the user has a name and a phone number.
 * Email always exists by construction (email signup or OAuth).
 */
export function getProfileGaps(user: GapUser): ProfileGap[] {
  const gaps: ProfileGap[] = []
  if (!user.name?.trim()) gaps.push('name')
  if (!user.phoneNumber?.trim()) gaps.push('phoneNumber')
  return gaps
}
