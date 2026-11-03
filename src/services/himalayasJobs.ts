export interface HimalayasSearchOptions {
  keyword?: string
  country?: string
  worldwide?: boolean
}

export interface HimalayasJob {
  guid?: string
  title: string
  companyName: string
  locationRestrictions?: string[]
  excerpt?: string
  description?: string
  applicationLink?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function safeExternalUrl(value: unknown): string | undefined {
  const candidate = textValue(value)
  if (!candidate) return undefined

  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? candidate
      : undefined
  } catch {
    return undefined
  }
}

function descriptionText(value: unknown): string | undefined {
  const html = textValue(value)
  if (!html) return undefined

  const withLineBreaks = html
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const document = new DOMParser().parseFromString(withLineBreaks, 'text/html')
  document.querySelectorAll('script, style').forEach((element) => element.remove())

  return document.body.textContent
    ?.replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || undefined
}

function mapJob(value: unknown): HimalayasJob | undefined {
  if (!isRecord(value)) return undefined
  const title = textValue(value.title)
  const companyName = textValue(value.companyName)
  if (!title || !companyName) return undefined

  return {
    guid: safeExternalUrl(value.guid),
    title,
    companyName,
    locationRestrictions: stringArray(value.locationRestrictions),
    excerpt: descriptionText(value.excerpt),
    description: descriptionText(value.description),
    applicationLink: safeExternalUrl(value.applicationLink),
  }
}

export async function searchHimalayasJobs(
  options: HimalayasSearchOptions,
  signal?: AbortSignal,
): Promise<HimalayasJob[]> {
  const params = new URLSearchParams()
  const worldwideLocation = options.country?.trim().toLowerCase() === 'worldwide'
  if (options.keyword?.trim()) params.set('q', options.keyword.trim())
  if (options.country?.trim() && !worldwideLocation) {
    params.set('country', options.country.trim())
  }
  if (options.worldwide || worldwideLocation) params.set('worldwide', 'true')
  params.set('page', '1')

  const requestUrl = `/api/himalayas/search?${params.toString()}`
  const response = await fetch(requestUrl, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const responseDetails = (
      await response.text().catch(() => 'Unable to read the error response body.')
    ).slice(0, 1000)

    if (import.meta.env.DEV) {
      console.warn('[Himalayas API] Job search failed', {
        url: requestUrl,
        status: response.status,
        response: responseDetails,
      })
    }

    throw new Error(
      `Himalayas job search failed (HTTP ${response.status}). Please try again.`,
    )
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !Array.isArray(payload.jobs)) {
    throw new Error('Himalayas returned an unexpected job search response.')
  }

  return payload.jobs
    .map(mapJob)
    .filter((job): job is HimalayasJob => job !== undefined)
}
