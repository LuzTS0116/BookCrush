import { headers } from 'next/headers'

export function withAuthCookies(init: RequestInit = {}): RequestInit {
if (typeof window === 'undefined') {
// Server: forward the incoming request cookies
const cookie = headers().then(headers => headers.get('cookie') ?? '')
return {
...init,
headers: { ...(init.headers || {}), cookie: cookie ?? '' },
cache: 'no-store',
}
}
// Client: rely on browser to send cookies
return {
...init,
credentials: 'include',
cache: 'no-store',
}
}