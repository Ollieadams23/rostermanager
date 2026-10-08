import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import RosterDayCard from './components/RosterDayCard'
import EmployeeTableRow from './components/EmployeeTableRow'
import {
  getMinutesFromTime,
  getShiftBarStyle,
  getShiftHours,
  shiftDayForward,
  WEEK_DAYS,
} from './shiftUtils'

const BUSINESS_STORAGE_KEY = 'rostermanager-business'
const EMPLOYEES_STORAGE_KEY = 'rostermanager-employees'
const MIN_STAFF_KEY = 'rostermanager-min-staff'
const MAX_STAFF_KEY = 'rostermanager-max-staff'
const ROLL_FORWARD_DAYS_KEY = 'rostermanager-roll-forward-days'
const SELECTED_WEEK_KEY = 'rostermanager-selected-week'
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

function getWeekKeyRange(startWeekKey, endWeekKey) {
  const startDate = new Date(`${startWeekKey}T00:00:00`)
  const endDate = new Date(`${endWeekKey}T00:00:00`)
  const direction = startDate <= endDate ? 1 : -1
  const weekKeys = []
  const cursor = new Date(startDate)

  while (direction > 0 ? cursor <= endDate : cursor >= endDate) {
    weekKeys.push(formatWeekKey(cursor))
    cursor.setDate(cursor.getDate() + 7 * direction)
  }

  return weekKeys
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
  const [editingEmployeeName, setEditingEmployeeName] = useState('')
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
  const [selectedStaffingDay, setSelectedStaffingDay] = useState(null)
  const [isResetWeekPressed, setIsResetWeekPressed] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
  const weekOptions = buildWeekOptions(new Date())
  const staffOptions = Array.from({ length: 20 }, (_, index) => index + 1)
  const rollForwardOptions = Array.from({ length: 7 }, (_, index) => index)

  useEffect(() => {
    setIsLoggedIn(hasSavedData())
  }, [])

  const openSignupModal = () => {
    setModalMode('signup')
    setIsModalOpen(true)
  }

  const openEmployeeModal = () => {
    setEditingEmployeeName('')
    setModalMode('employee')
    setEmployee((current) => ({ ...current, name: '', startTime: current.startTime || '09:00', endTime: current.endTime || '17:00' }))
    setIsModalOpen(true)
  }

  const openEditEmployeeModal = (employeeName) => {
    const selectedEmployee = getSavedEmployees().find((person) => person.name === employeeName)

    setEditingEmployeeName(employeeName)
    setModalMode('edit-employee')
    setEmployee({
      businessName: '',
      email: '',
      name: selectedEmployee?.name || employeeName,
      startTime: selectedEmployee?.startTime || '09:00',
      endTime: selectedEmployee?.endTime || '17:00',
    })
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
      setEditingEmployeeName('')
      setEmployee({ businessName: '', email: '', name: '', startTime: '09:00', endTime: '17:00' })
      return
    }

    if (modalMode === 'edit-employee') {
      const employeeName = employee.name.trim()

      if (!employeeName) {
        return
      }

      const updatedEmployees = getSavedEmployees().map((person) => {
        if (person.name !== editingEmployeeName) {
          return person
        }

        return {
          ...person,
          name: employeeName,
        }
      })

      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
      setSavedEmployees(updatedEmployees)
      setIsModalOpen(false)
      setEditingEmployeeName('')
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
    const weekMeta = person.daysOffByWeekMeta || {}
    const explicitDaysForWeek = weekSchedule[weekKey]

    if (Array.isArray(explicitDaysForWeek)) {
      if (weekMeta[weekKey] === 'generated') {
        const previousWeekKey = getPreviousWeekKey(weekKey)
        const previousWeekDaysOff = Array.isArray(weekSchedule[previousWeekKey])
          ? weekSchedule[previousWeekKey]
          : []

        return previousWeekDaysOff.map((day) => shiftDayForward(day, rollForwardDays))
      }

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

  const hasStoredWeekData = (person, weekKey) => {
    const weekDaysOff = person.daysOffByWeek?.[weekKey]
    const weekShiftTimes = person.shiftTimesByWeek?.[weekKey]

    if (Array.isArray(weekDaysOff) && weekDaysOff.length > 0) {
      return true
    }

    if (weekShiftTimes && typeof weekShiftTimes === 'object' && Object.keys(weekShiftTimes).length > 0) {
      return true
    }

    return false
  }

  const hydrateWeekFromPrevious = (
    employees,
    weekKey = selectedWeekKey,
    forceRegenerate = false,
    activeRollForwardDays = rollForwardDays,
  ) => {
    const allKnownWeekKeys = new Set()

    employees.forEach((person) => {
      Object.keys(person.daysOffByWeek || {}).forEach((storedWeekKey) => allKnownWeekKeys.add(storedWeekKey))
      Object.keys(person.shiftTimesByWeek || {}).forEach((storedWeekKey) => allKnownWeekKeys.add(storedWeekKey))
    })

    const knownWeekKeys = [...allKnownWeekKeys]
    const earliestKnownWeekKey = knownWeekKeys.length
      ? knownWeekKeys.reduce((earliest, candidate) =>
          new Date(`${candidate}T00:00:00`) < new Date(`${earliest}T00:00:00`) ? candidate : earliest,
          knownWeekKeys[0],
        )
      : weekKey

    const generatedWeekKeys = knownWeekKeys.length
      ? [...new Set([...knownWeekKeys, ...getWeekKeyRange(earliestKnownWeekKey, weekKey)])]
      : getWeekKeyRange(weekKey, weekKey)

    const updatedEmployees = employees.map((person) => {
      const weekSchedule = { ...(person.daysOffByWeek || {}) }
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
      const shiftSchedule = { ...(person.shiftTimesByWeek || {}) }

      for (const currentWeekKey of generatedWeekKeys) {
        const previousWeekKey = getPreviousWeekKey(currentWeekKey)
        const previousWeekDaysOff = Array.isArray(weekSchedule[previousWeekKey])
          ? weekSchedule[previousWeekKey]
          : []
        const hasStoredDataForWeek = hasStoredWeekData(person, currentWeekKey)
        const shouldRegenerate = forceRegenerate && weekMeta[currentWeekKey] !== 'manual'

        if (!hasStoredDataForWeek && (shouldRegenerate || !weekMeta[currentWeekKey])) {
          const generatedDaysOff = previousWeekDaysOff.map((day) =>
            shiftDayForward(day, activeRollForwardDays),
          )
          weekSchedule[currentWeekKey] = generatedDaysOff
          weekMeta[currentWeekKey] = 'generated'
        }

        if (!shiftSchedule[currentWeekKey] || typeof shiftSchedule[currentWeekKey] !== 'object') {
          const previousWeekShiftTimes = shiftSchedule[previousWeekKey] || {}
          const standardShift = {
            startTime: person.startTime || '09:00',
            endTime: person.endTime || '17:00',
          }

          shiftSchedule[currentWeekKey] = WEEK_DAYS.reduce((dayMap, day) => {
            const previousDayShift = previousWeekShiftTimes[day]

            dayMap[day] = {
              ...standardShift,
              ...(previousDayShift && typeof previousDayShift === 'object' ? previousDayShift : {}),
            }

            return dayMap
          }, {})
        }
      }

      return {
        ...person,
        daysOffByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
        shiftTimesByWeek: shiftSchedule,
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
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
      const currentDaysOff = getEmployeeDaysOffForWeek(person, selectedWeekKey)
      const nextDaysOff = currentDaysOff.includes(day)
        ? currentDaysOff.filter((item) => item !== day)
        : [...currentDaysOff, day]

      weekSchedule[selectedWeekKey] = nextDaysOff
      weekMeta[selectedWeekKey] = 'manual'

      return {
        ...person,
        daysOffByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
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

    const materializedEmployees = hydrateWeekFromPrevious(
      getSavedEmployees(),
      selectedWeekKey,
      true,
      validValue,
    )
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(materializedEmployees, null, 2))
    setSavedEmployees(materializedEmployees)
  }

  const handleResetSelectedWeekFromPrevious = () => {
    setIsResetWeekPressed(true)
    window.setTimeout(() => setIsResetWeekPressed(false), 120)

    const updatedEmployees = getSavedEmployees().map((person) => {
      const weekSchedule = { ...(person.daysOffByWeek || {}) }
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
      const shiftSchedule = { ...(person.shiftTimesByWeek || {}) }
      const previousWeekKey = getPreviousWeekKey(selectedWeekKey)
      const previousWeekDaysOff = Array.isArray(weekSchedule[previousWeekKey])
        ? weekSchedule[previousWeekKey]
        : []
      const regeneratedDaysOff = previousWeekDaysOff.map((day) => shiftDayForward(day, rollForwardDays))
      const standardShift = {
        startTime: person.startTime || '09:00',
        endTime: person.endTime || '17:00',
      }
      const previousWeekShifts = shiftSchedule[previousWeekKey] || {}

      shiftSchedule[selectedWeekKey] = WEEK_DAYS.reduce((dayMap, day) => {
        const previousDayShift = previousWeekShifts[day]

        dayMap[day] = {
          ...standardShift,
          ...(previousDayShift && typeof previousDayShift === 'object' ? previousDayShift : {}),
        }

        return dayMap
      }, {})

      weekSchedule[selectedWeekKey] = regeneratedDaysOff
      weekMeta[selectedWeekKey] = 'generated'

      return {
        ...person,
        daysOffByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
        shiftTimesByWeek: shiftSchedule,
        daysOff: regeneratedDaysOff,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
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
    const standardShift = {
      startTime: person.startTime || '09:00',
      endTime: person.endTime || '17:00',
    }

    if (dayShift && typeof dayShift === 'object') {
      return {
        ...standardShift,
        ...dayShift,
      }
    }

    const previousWeekKey = getPreviousWeekKey(weekKey)
    const previousWeekShift = weekSchedule[previousWeekKey]?.[day]

    if (previousWeekShift && typeof previousWeekShift === 'object') {
      return {
        ...standardShift,
        ...previousWeekShift,
      }
    }

    return standardShift
  }

  const handleEmployeeShiftChange = (employeeName, day, field, value) => {
    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const weekSchedule = { ...(person.shiftTimesByWeek || {}) }
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
      const currentWeekTimes = { ...(weekSchedule[selectedWeekKey] || {}) }

      currentWeekTimes[day] = {
        ...(currentWeekTimes[day] || {}),
        [field]: value,
      }

      weekSchedule[selectedWeekKey] = currentWeekTimes
      weekMeta[selectedWeekKey] = 'manual'

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
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
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
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
      weekMeta[selectedWeekKey] = 'manual'

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
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
      const weekMeta = { ...(person.daysOffByWeekMeta || {}) }
      const currentWeekTimes = { ...(weekSchedule[selectedWeekKey] || {}) }
      const mondayShift = currentWeekTimes.Mon || {
        startTime: person.startTime || '09:00',
        endTime: person.endTime || '17:00',
      }
      const mondayStartTime = mondayShift.startTime || person.startTime || '09:00'
      const mondayEndTime = mondayShift.endTime || person.endTime || '17:00'
      const mondayHours = getShiftHours(mondayStartTime, mondayEndTime)

      WEEK_DAYS.forEach((day) => {
        const nextEndTime = getEndTimeFromHours(mondayStartTime, mondayHours)

        currentWeekTimes[day] = {
          ...(currentWeekTimes[day] || {}),
          startTime: mondayStartTime,
          endTime: nextEndTime,
        }
      })

      weekSchedule[selectedWeekKey] = currentWeekTimes
      weekMeta[selectedWeekKey] = 'manual'

      return {
        ...person,
        shiftTimesByWeek: weekSchedule,
        daysOffByWeekMeta: weekMeta,
      }
    })

    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmployees, null, 2))
    setSavedEmployees(updatedEmployees)
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
    const breakMinutes = cappedHours > 0 ? 30 : 0
    const roundedMinutes = Math.round(
      (getMinutesFromTime(startTime) + (cappedHours + breakMinutes / 60) * 60) / 30,
    ) * 30
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

  const handleSaveEmployeeAsStandard = (employeeName) => {
    const updatedEmployees = getSavedEmployees().map((person) => {
      if (person.name !== employeeName) {
        return person
      }

      const currentWeekSchedule = person.shiftTimesByWeek?.[selectedWeekKey] || {}
      const preferredShift = WEEK_DAYS.map((day) => currentWeekSchedule[day]).find((dayShift) => {
        return dayShift && typeof dayShift === 'object'
      }) || {
        startTime: person.startTime || '09:00',
        endTime: person.endTime || '17:00',
      }

      return {
        ...person,
        startTime: preferredShift.startTime || person.startTime || '09:00',
        endTime: preferredShift.endTime || person.endTime || '17:00',
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

                    const shiftBarStyle = getShiftBarStyle(shift.startTime, shift.endTime)

                    return (
                      <td key={`${person.name}-${day}`} className="print-shift-cell">
                        <div className="print-shift-content">
                          <strong>{shift.startTime}</strong>
                          <span>to {shift.endTime}</span>
                          <span>{hours.toFixed(1)}h</span>
                        </div>

                        <div className="print-time-scale" aria-label={`${person.name} working hours on ${day}`}>
                          <div className="print-time-track" aria-hidden="true">
                            <div className="print-time-fill" style={shiftBarStyle} />
                          </div>
                          <div className="print-time-labels" aria-hidden="true">
                            <span>9a</span>
                            <span>6p</span>
                          </div>
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
                <select value={minimumStaff} onChange={handleMinimumStaffChange}>
                  {staffOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="maximum-staff-control">
                <span>Maximum staff</span>
                <select value={maximumStaff} onChange={handleMaximumStaffChange}>
                  {staffOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
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
                <select value={rollForwardDays} onChange={handleRollForwardDaysChange}>
                  {rollForwardOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={`reset-week-button ${isResetWeekPressed ? 'is-pressed' : ''}`}
                onClick={handleResetSelectedWeekFromPrevious}
              >
                Reset week
              </button>
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
                  onOpenDetails={setSelectedStaffingDay}
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
                    handleEditEmployee={openEditEmployeeModal}
                    handleSaveEmployeeAsStandard={handleSaveEmployeeAsStandard}
                    getShiftHours={getShiftHours}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedStaffingDay && (
          <div className="modal-backdrop" onClick={() => setSelectedStaffingDay(null)}>
            <div className="modal staffing-day-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedStaffingDay} shifts</h2>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setSelectedStaffingDay(null)}
                  aria-label={`Close ${selectedStaffingDay} staffing details`}
                >
                  ×
                </button>
              </div>

              <div className="staffing-day-details">
                {savedEmployees.filter(
                  (person) => !getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(selectedStaffingDay),
                ).length === 0 ? (
                  <p className="roster-empty">No employees working on {selectedStaffingDay}</p>
                ) : (
                  savedEmployees
                    .filter(
                      (person) => !getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(selectedStaffingDay),
                    )
                    .map((person) => {
                      const shift = getEmployeeShiftForDay(person, selectedStaffingDay, selectedWeekKey)
                      const hours = getShiftHours(shift.startTime, shift.endTime)
                      const shiftBarStyle = getShiftBarStyle(shift.startTime, shift.endTime)

                      return (
                        <div key={`${person.name}-${selectedStaffingDay}`} className="staffing-shift-row">
                          <div className="staffing-shift-header">
                            <strong>{person.name}</strong>
                            <span>
                              {shift.startTime} - {shift.endTime} ({hours.toFixed(1)}h)
                            </span>
                          </div>
                          <div className="print-time-scale" aria-label={`${person.name} working hours on ${selectedStaffingDay}`}>
                            <div className="print-time-track" aria-hidden="true">
                              <div className="print-time-fill" style={shiftBarStyle} />
                            </div>
                            <div className="print-time-labels" aria-hidden="true">
                              <span>9a</span>
                              <span>6p</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {(isModalOpen && (modalMode === 'employee' || modalMode === 'edit-employee')) && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'edit-employee' ? 'Edit employee' : 'Add employee'}</h2>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label={modalMode === 'edit-employee' ? 'Close edit employee form' : 'Close add employee form'}
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

                {modalMode === 'employee' && (
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
                )}

                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    {modalMode === 'edit-employee' ? 'Save changes' : 'Save employee'}
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
