// OAuth is the only login return path needed here; reject external destinations.
export function loginReturn(search: string): string {
  const target = new URLSearchParams(search).get('returnTo')
  return target && /^\/oauth\/consent\?request=[A-Za-z0-9_-]{43}$/.test(target) ? target : '/projects'
}
