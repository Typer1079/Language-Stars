/** True if the browser says the microphone is already blocked for this site (where it can tell). */
export async function micBlocked(): Promise<boolean> {
  try {
    const p = await navigator.permissions?.query({ name: 'microphone' as PermissionName })
    return p?.state === 'denied'
  } catch {
    return false
  }
}
