export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function getMinutesFromTime(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') {
    return 0
  }

  const [hours, minutes] = timeValue.split(':').map((value) => Number(value))

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

export function getShiftHours(startTime, endTime, breakMinutes = 30) {
  const startMinutes = getMinutesFromTime(startTime)
  const endMinutes = getMinutesFromTime(endTime)
  const totalMinutes = endMinutes - startMinutes

  if (totalMinutes <= 0) {
    return 0
  }

  const deductedBreak = Math.min(breakMinutes, totalMinutes)
  return (totalMinutes - deductedBreak) / 60
}

export function shiftDayForward(day, daysToRoll = 1) {
  const currentIndex = WEEK_DAYS.indexOf(day)

  if (currentIndex === -1) {
    return day
  }

  const nextIndex = (currentIndex + daysToRoll) % WEEK_DAYS.length
  return WEEK_DAYS[nextIndex]
}

export function getShiftBarStyle(startTime, endTime, options = {}) {
  const dayStart = options.dayStart ?? '09:00'
  const dayEnd = options.dayEnd ?? '18:00'

  const dayStartMinutes = getMinutesFromTime(dayStart)
  const dayEndMinutes = getMinutesFromTime(dayEnd)
  const totalMinutes = Math.max(dayEndMinutes - dayStartMinutes, 1)

  const startMinutes = getMinutesFromTime(startTime)
  const endMinutes = getMinutesFromTime(endTime)

  const workingStart = Math.max(Math.min(startMinutes, endMinutes), dayStartMinutes)
  const workingEnd = Math.min(Math.max(startMinutes, endMinutes), dayEndMinutes)

  if (workingEnd <= workingStart) {
    return { left: '0%', width: '0%' }
  }

  const left = ((workingStart - dayStartMinutes) / totalMinutes) * 100
  const width = ((workingEnd - workingStart) / totalMinutes) * 100

  return {
    left: `${left}%`,
    width: `${width}%`,
  }
}
