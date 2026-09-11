import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import RosterDayCard from './components/RosterDayCard'
import EmployeeTableRow from './components/EmployeeTableRow'

const BUSINESS_STORAGE_KEY = 'rostermanager-business'
const EMPLOYEES_STORAGE_KEY = 'rostermanager-employees'
const MIN_STAFF_KEY = 'rostermanager-min-staff'
const MAX_STAFF_KEY = 'rostermanager-max-staff'
const ROLL_FORWARD_DAYS_KEY = 'rostermanager-roll-forward-days'
const SELECTED_WEEK_KEY = 'rostermanager-selected-week'
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIME_OPTIONS = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
]

function getStartOfWeek(date = new Date()) {
  const nextDate = new Date(date)
  const dayIndex = (nextDate.getDay() + 6) % 7
  nextDate.setHours(0, 0, 0, 0)
  nextDate.setDate(nextDate.getDate() - dayIndex)
  return nextDate
}

function formatWeekKey(date = new Date()) {
  const startOfWeek = getStartOfWeek(date)
  const year = startOfWeek.getFullYear()
  const month = String(startOfWeek.getMonth() + 1).padStart(2, '0')
  const day = String(startOfWeek.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPreviousWeekKey(weekKey) {
  const date = new Date(`${weekKey}T00:00:00`)
  date.setDate(date.getDate() - 7)
  return formatWeekKey(date)
}

function getDayIndex(day) {
  return WEEK_DAYS.indexOf(day)
}

function shiftDayForward(day, daysToRoll = 1) {
  const currentIndex = getDayIndex(day)
  const nextIndex = (currentIndex + daysToRoll) % WEEK_DAYS.length
  return WEEK_DAYS[nextIndex]
}

function buildWeekOptions(anchorDate = new Date()) {
  const startOfCurrentWeek = getStartOfWeek(anchorDate)
  const options = []

  for (let offset = -4; offset <= 4; offset += 1) {
    const weekDate = new Date(startOfCurrentWeek)
    weekDate.setDate(startOfCurrentWeek.getDate() + offset * 7)

    const weekKey = formatWeekKey(weekDate)
    const startLabel = weekDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    const endDate = new Date(weekDate)
    endDate.setDate(weekDate.getDate() + 6)
    const endLabel = endDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })

    options.push({
      key: weekKey,
      label: `${startLabel} - ${endLabel}`,
    })
  }

  return options
}

function getSavedBusiness() {
  try {
    const savedBusiness = localStorage.getItem(BUSINESS_STORAGE_KEY)
    return savedBusiness ? JSON.parse(savedBusiness) : null
  } catch {
    return null
  }
}

function saveBusinessProfile(profile) {
  localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(profile, null, 2))
}

function getSavedEmployees() {
  try {
    return JSON.parse(localStorage.getItem(EMPLOYEES_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEmployeeRecord(record) {
  const savedEmployees = getSavedEmployees()
  const updatedEmployees = [...savedEmployees, record]

  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
}

function getSavedMinimumStaff() {
  try {
    const savedMinimum = Number(localStorage.getItem(MIN_STAFF_KEY))
    return Number.isFinite(savedMinimum) && savedMinimum > 0 ? savedMinimum : 2
  } catch {
    return 2
  }
}

function getSavedMaximumStaff() {
  try {
    const savedMaximum = Number(localStorage.getItem(MAX_STAFF_KEY))
    return Number.isFinite(savedMaximum) && savedMaximum > 0 ? savedMaximum : 4
  } catch {
    return 4
  }
}

function getSavedRollForwardDays() {
  try {
    const savedDays = Number(localStorage.getItem(ROLL_FORWARD_DAYS_KEY))
    return Number.isFinite(savedDays) && savedDays >= 0 ? savedDays : 1
  } catch {
    return 1
  }
}

function getSavedSelectedWeek() {
  try {
    const savedSelectedWeek = localStorage.getItem(SELECTED_WEEK_KEY)
    return savedSelectedWeek || formatWeekKey(new Date())
  } catch {
    return formatWeekKey(new Date())
  }
}

function hasSavedData() {
  const businessProfile = getSavedBusiness()
  return Boolean(businessProfile?.businessName && businessProfile?.email)
}

function App() {
  const [count, setCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('signup')
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasSavedData())
  const [employee, setEmployee] = useState({
    businessName: '',
    email: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
  })
  const [savedEmployees, setSavedEmployees] = useState(() => getSavedEmployees())
  const [minimumStaff, setMinimumStaff] = useState(() => getSavedMinimumStaff())
  const [maximumStaff, setMaximumStaff] = useState(() => getSavedMaximumStaff())
  const [rollForwardDays, setRollForwardDays] = useState(() => getSavedRollForwardDays())
  const [selectedWeekKey, setSelectedWeekKey] = useState(() => getSavedSelectedWeek())
  const [activeView, setActiveView] = useState('dashboard')
  const weekOptions = buildWeekOptions(new Date())

  useEffect(() => {
    setIsLoggedIn(hasSavedData())
  }, [])

  const openSignupModal = () => {
    setModalMode('signup')
    setIsModalOpen(true)
  }

  const openEmployeeModal = () => {
    setModalMode('employee')
    setIsModalOpen(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setEmployee((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (modalMode === 'employee') {
      const employeeName = employee.name.trim()

      if (!employeeName) {
        return
      }

      const employeeRecord = {
        name: employeeName,
        startTime: employee.startTime || '09:00',
        endTime: employee.endTime || '17:00',
        maxHoursByWeek: {},
        shiftTimesByWeek: {},
        daysOff: [],
        createdAt: new Date().toISOString(),
      }

      saveEmployeeRecord(employeeRecord)
      setSavedEmployees(getSavedEmployees())
      setIsModalOpen(false)
      setEmployee({ businessName: '', email: '', name: '', startTime: '09:00', endTime: '17:00' })
      return
    }

    const businessProfile = {
      businessName: employee.businessName.trim(),
      email: employee.email.trim(),
      createdAt: new Date().toISOString(),
    }

    saveBusinessProfile(businessProfile)
    setIsLoggedIn(true)
    setIsModalOpen(false)
    setEmployee({ businessName: '', email: '', name: '', startTime: '09:00', endTime: '17:00' })
  }

  const getEmployeeDaysOffForWeek = (person, weekKey = selectedWeekKey) => {
    const weekSchedule = person.daysOffByWeek || {}
    const explicitDaysForWeek = weekSchedule[weekKey]

    if (Array.isArray(explicitDaysForWeek)) {
      return explicitDaysForWeek
    }

    const legacyDaysOff = Array.isArray(person.daysOff) ? person.daysOff : []
    if (legacyDaysOff.length > 0 && !person.daysOffByWeek) {
      return legacyDaysOff
    }

    const previousWeekKey = getPreviousWeekKey(weekKey)
    const previousWeekDaysOff = Array.isArray(weekSchedule[previousWeekKey])
      ? weekSchedule[previousWeekKey]
      : []

    if (!previousWeekDaysOff.length) {
      return []
    }

    return previousWeekDaysOff.map((day) => shiftDayForward(day, rollForwardDays))
  }

  const hydrateWeekFromPrevious = (employees, weekKey = selectedWeekKey) => {
    const generatedWeekKeys = []
    const cursorDate = new Date(`${weekKey}T00:00:00`)

    for (let index = 0; index < 53; index += 1) {
      generatedWeekKeys.push(formatWeekKey(cursorDate))
      cursorDate.setDate(cursorDate.getDate() - 7)
    }

    generatedWeekKeys.reverse()

    const updatedEmployees = employees.map((person) => {
      const weekSchedule = { ...(person.daysOffByWeek || {}) }

      for (const currentWeekKey of generatedWeekKeys) {
        if (Array.isArray(weekSchedule[currentWeekKey])) {
          continue
        }

        const previousWeekKey = getPreviousWeekKey(currentWeekKey)
        const previousWeekDaysOff = Array.isArray(weekSchedule[previousWeekKey])
          ? weekSchedule[previousWeekKey]
          : []

        const generatedDaysOff = previousWeekDaysOff.map((day) => shiftDayForward(day, rollForwardDays))
        weekSchedule[currentWeekKey] = generatedDaysOff
      }

      return {
        ...person,
        daysOffByWeek: weekSchedule,
        daysOff: Array.isArray(weekSchedule[weekKey]) ? weekSchedule[weekKey] : [],
      }
    })

    return updatedEmployees
  }

  const toggleDayOff = (employeeName, day) => {
    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const weekSchedule = { ...(person.daysOffByWeek || {}) }
      const currentDaysOff = getEmployeeDaysOffForWeek(person, selectedWeekKey)
      const nextDaysOff = currentDaysOff.includes(day)
        ? currentDaysOff.filter((item) => item !== day)
        : [...currentDaysOff, day]

      weekSchedule[selectedWeekKey] = nextDaysOff

      return {
        ...person,
        daysOffByWeek: weekSchedule,
        daysOff: nextDaysOff,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const handleMinimumStaffChange = (event) => {
    const nextValue = Number(event.target.value)
    const validValue = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1

    setMinimumStaff(validValue)
    localStorage.setItem(MIN_STAFF_KEY, String(validValue))
  }

  const handleMaximumStaffChange = (event) => {
    const nextValue = Number(event.target.value)
    const validValue = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1

    setMaximumStaff(validValue)
    localStorage.setItem(MAX_STAFF_KEY, String(validValue))
  }

  const handleRollForwardDaysChange = (event) => {
    const nextValue = Number(event.target.value)
    const validValue = Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0

    setRollForwardDays(validValue)
    localStorage.setItem(ROLL_FORWARD_DAYS_KEY, String(validValue))
  }

  const handleResetEmployeeData = () => {
    localStorage.removeItem(BUSINESS_STORAGE_KEY)
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY)
    localStorage.removeItem(SELECTED_WEEK_KEY)
    setSavedEmployees([])
    setIsLoggedIn(false)
    setEmployee({ businessName: '', email: '', name: '', startTime: '09:00', endTime: '17:00' })
  }

  const handleDeleteEmployee = (employeeName) => {
    const confirmed = window.confirm(`Delete ${employeeName}? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    const updatedEmployees = getSavedEmployees().filter((person) => person.name !== employeeName)
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const getEmployeeShiftForDay = (person, day, weekKey = selectedWeekKey) => {
    const weekSchedule = person.shiftTimesByWeek || {}
    const dayShift = weekSchedule[weekKey]?.[day]

    if (dayShift && typeof dayShift === 'object') {
      return {
        startTime: dayShift.startTime || person.startTime || '09:00',
        endTime: dayShift.endTime || person.endTime || '17:00',
      }
    }

    return {
      startTime: person.startTime || '09:00',
      endTime: person.endTime || '17:00',
    }
  }

  const handleEmployeeShiftChange = (employeeName, day, field, value) => {
    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const weekSchedule = { ...(person.shiftTimesByWeek || {}) }
      const currentWeekTimes = { ...(weekSchedule[selectedWeekKey] || {}) }

      currentWeekTimes[day] = {
        ...(currentWeekTimes[day] || {}),
        [field]: value,
      }

      weekSchedule[selectedWeekKey] = currentWeekTimes

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const handleEmployeeHoursChange = (employeeName, day, hoursValue) => {
    const rawHours = Number(hoursValue)
    const normalizedHours = Number.isFinite(rawHours) && rawHours >= 0 ? Math.min(rawHours, 12) : 0

    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const weekSchedule = { ...(person.shiftTimesByWeek || {}) }
      const currentWeekTimes = { ...(weekSchedule[selectedWeekKey] || {}) }
      const currentShift = currentWeekTimes[day] || {}
      const startTime = currentShift.startTime || person.startTime || '09:00'
      const endTime = getEndTimeFromHours(startTime, normalizedHours)

      currentWeekTimes[day] = {
        ...currentShift,
        startTime,
        endTime,
      }

      weekSchedule[selectedWeekKey] = currentWeekTimes

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const copyMondayTimesToWeek = (employeeName) => {
    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const weekSchedule = { ...(person.shiftTimesByWeek || {}) }
      const currentWeekTimes = { ...(weekSchedule[selectedWeekKey] || {}) }
      const mondayShift = currentWeekTimes.Mon || {
        startTime: person.startTime || '09:00',
        endTime: person.endTime || '17:00',
      }

      WEEK_DAYS.forEach((day) => {
        currentWeekTimes[day] = {
          ...(currentWeekTimes[day] || {}),
          startTime: mondayShift.startTime,
          endTime: mondayShift.endTime,
        }
      })

      weekSchedule[selectedWeekKey] = currentWeekTimes

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const getMinutesFromTime = (timeValue) => {
    if (!timeValue || typeof timeValue !== 'string') {
      return 0
    }

    const [hours, minutes] = timeValue.split(':').map((value) => Number(value))

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return 0
    }

    return hours * 60 + minutes
  }

  const getShiftHours = (startTime, endTime) => {
    const startMinutes = getMinutesFromTime(startTime)
    const endMinutes = getMinutesFromTime(endTime)

    if (endMinutes <= startMinutes) {
      return 0
    }

    return (endMinutes - startMinutes) / 60
  }

  const getTimeFromMinutes = (totalMinutes) => {
    const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
    const hours = Math.floor(normalizedMinutes / 60)
    const minutes = normalizedMinutes % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const getEndTimeFromHours = (startTime, hoursValue) => {
    const rawHours = Number(hoursValue)

    if (!Number.isFinite(rawHours) || rawHours < 0) {
      return startTime || '09:00'
    }

    const cappedHours = Math.min(rawHours, 12)
    const roundedMinutes = Math.round((getMinutesFromTime(startTime) + cappedHours * 60) / 30) * 30
    return getTimeFromMinutes(roundedMinutes)
  }

  const getEmployeeWeekHours = (person, weekKey = selectedWeekKey) => {
    const weekSchedule = person.shiftTimesByWeek || {}
    const selectedDaySchedule = weekSchedule[weekKey] || {}

    return WEEK_DAYS.reduce((totalHours, day) => {
      if (getEmployeeDaysOffForWeek(person, weekKey).includes(day)) {
        return totalHours
      }

      const shift = selectedDaySchedule[day] || {}
      const startTime = shift.startTime || person.startTime || '09:00'
      const endTime = shift.endTime || person.endTime || '17:00'

      return totalHours + getShiftHours(startTime, endTime)
    }, 0)
  }

  const getEmployeeMaxHoursForWeek = (person, weekKey = selectedWeekKey) => {
    const maxHoursByWeek = person.maxHoursByWeek || {}

    if (Number.isFinite(Number(maxHoursByWeek[weekKey]))) {
      return Number(maxHoursByWeek[weekKey])
    }

    if (Number.isFinite(Number(person.maxHours))) {
      return Number(person.maxHours)
    }

    return 0
  }

  const getEmployeeHoursStatus = (person, weekKey = selectedWeekKey) => {
    const maxHours = getEmployeeMaxHoursForWeek(person, weekKey)

    if (!maxHours) {
      return 'neutral'
    }

    return getEmployeeWeekHours(person, weekKey) > maxHours ? 'over' : 'within'
  }

  const handleEmployeeMaxHoursChange = (employeeName, value) => {
    const rawValue = Number(value)
    const normalizedValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 0

    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const maxHoursByWeek = { ...(person.maxHoursByWeek || {}) }
      maxHoursByWeek[selectedWeekKey] = normalizedValue

      return {
        ...person,
        maxHoursByWeek,
        maxHours: normalizedValue,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
  }

  const handleWeekChange = (event) => {
    const nextWeekKey = event.target.value
    const materializedEmployees = hydrateWeekFromPrevious(getSavedEmployees(), nextWeekKey)

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(materializedEmployees, null, 2))
    setSavedEmployees(materializedEmployees)
    setSelectedWeekKey(nextWeekKey)
    localStorage.setItem(SELECTED_WEEK_KEY, nextWeekKey)
  }

  const getWeekRangeLabel = (weekKey = selectedWeekKey) => {
    const weekStart = new Date(`${weekKey}T00:00:00`)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startLabel = weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const endLabel = weekEnd.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    return `${startLabel} - ${endLabel}`
  }

  const getDateLabelForDay = (day, weekKey = selectedWeekKey) => {
    const weekStart = new Date(`${weekKey}T00:00:00`)
    const dayIndex = WEEK_DAYS.indexOf(day)
    const dayDate = new Date(weekStart)
    dayDate.setDate(weekStart.getDate() + dayIndex)

    return dayDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  if (activeView === 'print') {
    const businessProfile = getSavedBusiness()
    const businessName = businessProfile?.businessName || 'Your business'
    const businessEmail = businessProfile?.email || ''

    const printMailToLink = (() => {
      const subject = `Roster for ${businessName} - ${getWeekRangeLabel()}`
      const rosterLines = savedEmployees.map((person) => {
        const daySummaries = WEEK_DAYS.map((day) => {
          const isOff = getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(day)

          if (isOff) {
            return `${day}: Off`
          }

          const shift = getEmployeeShiftForDay(person, day, selectedWeekKey)
          const hours = getShiftHours(shift.startTime, shift.endTime)
          return `${day}: ${shift.startTime} - ${shift.endTime} (${hours.toFixed(1)}h)`
        }).join('\n')

        return `${person.name}\n${daySummaries}`
      }).join('\n\n')

      const body = `Hi,\n\nPlease find the roster for ${businessName} for ${getWeekRangeLabel()}.\n\n${rosterLines}\n`

      return `mailto:${businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    })()

    return (
      <main className="print-page">
        <header className="print-header">
          <div>
            <p className="eyebrow">Printable roster</p>
            <h1>{businessName}</h1>
            <p className="print-week-range">{getWeekRangeLabel()}</p>
          </div>

          <div className="print-actions">
            <button type="button" className="secondary" onClick={() => setActiveView('dashboard')}>
              Back to dashboard
            </button>
            <button type="button" className="primary" onClick={() => window.print()}>
              Print roster
            </button>
            <button type="button" className="primary" onClick={() => window.location.href = printMailToLink}>
              Mail to
            </button>
          </div>
        </header>

        <div className="print-roster-wrapper">
          <table className="print-roster-table">
            <thead>
              <tr>
                <th>Employee</th>
                {WEEK_DAYS.map((day) => (
                  <th key={day}>
                    <div>{day}</div>
                    <small>{getDateLabelForDay(day)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {savedEmployees.map((person) => (
                <tr key={person.name}>
                  <td className="print-employee-name-cell">
                    <strong>{person.name}</strong>
                    <span>
                      Total: {getEmployeeWeekHours(person, selectedWeekKey).toFixed(1)}h
                    </span>
                  </td>
                  {WEEK_DAYS.map((day) => {
                    const isOff = getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(day)
                    const shift = getEmployeeShiftForDay(person, day, selectedWeekKey)

                    if (isOff) {
                      return (
                        <td key={`${person.name}-${day}`} className="print-off-cell">
                          Off
                        </td>
                      )
                    }

                    const hours = getShiftHours(shift.startTime, shift.endTime)

                    return (
                      <td key={`${person.name}-${day}`} className="print-shift-cell">
                        <div className="print-shift-content">
                          <strong>{shift.startTime}</strong>
                          <span>to {shift.endTime}</span>
                          <span>{hours.toFixed(1)}h</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    )
  }

  if (isLoggedIn) {
    const businessName = getSavedBusiness()?.businessName || 'Your business'
    const getAvailableEmployeesForDay = (day) =>
      savedEmployees.filter((person) => !getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(day))

    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{businessName}</h1>
          </div>
          <div className="dashboard-actions">
            <button type="button" className="primary" onClick={() => setActiveView('print')}>
              Printable roster
            </button>
            <button type="button" className="secondary" onClick={handleResetEmployeeData}>
              Reset employee data
            </button>
          </div>
        </header>

        <section className="dashboard-summary">
          <div className="summary-card">
            <span>Total staff</span>
            <strong>{savedEmployees.length}</strong>
          </div>
          <div className="summary-card">
            <span>Roster status</span>
            <strong>Ready</strong>
          </div>
        </section>

        <section className="dashboard-panel roster-panel">
          <div className="panel-header roster-settings-header">
            <h2>Auto-generated roster</h2>
            <div className="roster-settings-group">
              <label className="minimum-staff-control">
                <span>Minimum staff</span>
                <input
                  type="number"
                  min="1"
                  value={minimumStaff}
                  onChange={handleMinimumStaffChange}
                />
              </label>
              <label className="maximum-staff-control">
                <span>Maximum staff</span>
                <input
                  type="number"
                  min="1"
                  value={maximumStaff}
                  onChange={handleMaximumStaffChange}
                />
              </label>
              <label className="week-control">
                <span>Week</span>
                <select value={selectedWeekKey} onChange={handleWeekChange}>
                  {weekOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="roll-forward-control">
                <span>Roll forward</span>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={rollForwardDays}
                  onChange={handleRollForwardDaysChange}
                />
              </label>
            </div>
          </div>

          <div className="roster-grid">
            {WEEK_DAYS.map((day) => {
              const availableEmployees = getAvailableEmployeesForDay(day)

              return (
                <RosterDayCard
                  key={day}
                  day={day}
                  availableEmployees={availableEmployees}
                  minimumStaff={minimumStaff}
                  maximumStaff={maximumStaff}
                />
              )
            })}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Team - select off days</h2>
            <button type="button" className="signup" onClick={openEmployeeModal}>
              Add employee
            </button>
          </div>

          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  {WEEK_DAYS.map((day) => (
                    <th key={day} className="day-header">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedEmployees.map((person, index) => (
                  <EmployeeTableRow
                    key={`${person.name}-${index}`}
                    person={person}
                    selectedWeekKey={selectedWeekKey}
                    getEmployeeDaysOffForWeek={getEmployeeDaysOffForWeek}
                    getEmployeeShiftForDay={getEmployeeShiftForDay}
                    handleEmployeeShiftChange={handleEmployeeShiftChange}
                    handleEmployeeHoursChange={handleEmployeeHoursChange}
                    copyMondayTimesToWeek={copyMondayTimesToWeek}
                    toggleDayOff={toggleDayOff}
                    getEmployeeWeekHours={getEmployeeWeekHours}
                    getEmployeeHoursStatus={getEmployeeHoursStatus}
                    handleEmployeeMaxHoursChange={handleEmployeeMaxHoursChange}
                    handleDeleteEmployee={handleDeleteEmployee}
                    getShiftHours={getShiftHours}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isModalOpen && modalMode === 'employee' && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <h2 style={{ color: '#111827' }}>Add employee</h2>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close add employee form"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="employee-form">
                <label>
                  Employee name
                  <input
                    type="text"
                    name="name"
                    value={employee.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    required
                  />
                </label>

                <div className="time-form-row">
                  <label>
                    Start time
                    <input
                      type="time"
                      name="startTime"
                      value={employee.startTime}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    End time
                    <input
                      type="time"
                      name="endTime"
                      value={employee.endTime}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    Save employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <>
      <section id="center">
        <div className="title" aria-hidden="true" />

        <div>
          <h1>Roster Manager</h1>
          <p>Manage your team efficiently and effortlessly.</p>
          <button type="button" className="signup" onClick={openSignupModal}>
            Sign Up
          </button>
        </div>

        <button
          type="button"
          className="counter"
          onClick={() => setCount((value) => value + 10)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks" />

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks" />
      <section id="spacer" />

      {isModalOpen && modalMode === 'signup' && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#111827' }}>Signup details</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close sign up form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="employee-form">
              <label>
                Business name
                <input
                  type="text"
                  name="businessName"
                  value={employee.businessName}
                  onChange={handleChange}
                  placeholder="Sunset Cafe"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={employee.email}
                  onChange={handleChange}
                  placeholder="hello@business.com"
                  required
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App
