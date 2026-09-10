import EmployeeDayCell from './EmployeeDayCell'

export default function EmployeeTableRow({
  person,
  selectedWeekKey,
  getEmployeeDaysOffForWeek,
  getEmployeeShiftForDay,
  handleEmployeeShiftChange,
  handleEmployeeHoursChange,
  copyMondayTimesToWeek,
  toggleDayOff,
  getEmployeeWeekHours,
  getEmployeeHoursStatus,
  handleEmployeeMaxHoursChange,
  handleDeleteEmployee,
  getShiftHours,
}) {
  return (
    <tr className="employee-row">
      <td className="employee-name-cell">
        <div className="employee-name-group">
          <div className="employee-name-row">
            <strong>{person.name}</strong>
          </div>
          <div>
            <button
              type="button"
              className="delete-employee-button"
              onClick={() => handleDeleteEmployee(person.name)}
              aria-label={`Delete ${person.name}`}
            >
              Delete
            </button>
          </div>
          <span
            className={`employee-total-hours ${getEmployeeHoursStatus(person, selectedWeekKey)}`}
          >
            Total: {getEmployeeWeekHours(person, selectedWeekKey).toFixed(1)}h
          </span>
          <label className="employee-max-hours-control">
            <span>Max hours</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={person.maxHoursByWeek?.[selectedWeekKey] ?? person.maxHours ?? 0}
              onChange={(event) =>
                handleEmployeeMaxHoursChange(person.name, event.target.value)
              }
            />
          </label>
        </div>
      </td>

      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
        const shift = getEmployeeShiftForDay(person, day, selectedWeekKey)
        const isOff = getEmployeeDaysOffForWeek(person, selectedWeekKey).includes(day)

        return (
          <EmployeeDayCell
            key={`${person.name}-${day}`}
            person={person}
            day={day}
            isOff={isOff}
            shift={shift}
            hoursValue={getShiftHours(shift.startTime, shift.endTime)}
            onShiftChange={handleEmployeeShiftChange}
            onHoursChange={handleEmployeeHoursChange}
            onToggleDayOff={toggleDayOff}
            onCopyMondayTimes={copyMondayTimesToWeek}
          />
        )
      })}
    </tr>
  )
}
