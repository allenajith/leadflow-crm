const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30
const YEAR = DAY * 365

/**
 * "3 hours ago", in the clipped style old.reddit used on taglines.
 */
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)

  const [value, unit] =
    seconds < MINUTE
      ? [seconds, "second"]
      : seconds < HOUR
        ? [seconds / MINUTE, "minute"]
        : seconds < DAY
          ? [seconds / HOUR, "hour"]
          : seconds < MONTH
            ? [seconds / DAY, "day"]
            : seconds < YEAR
              ? [seconds / MONTH, "month"]
              : [seconds / YEAR, "year"]

  const n = Math.floor(value)
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
