export default function EmployeeDayCell({
  person,
  day,
  isOff,
  shift,
  hoursValue,
  onShiftChange,
  onHoursChange,
  onToggleDayOff,
  onCopyMondayTimes,
}) {
  return (
    <td key={`${person.name}-${day}`} className="day-cell">
      <div className="day-shift-controls">
        <label>
          <span>Start</span>
          <select
            value={shift.startTime}
            onChange={(event) =>
              onShiftChange(person.name, day, 'startTime', event.target.value)
            }
            aria-label={`${person.name} start time for ${day}`}
          >
            {Array.from({ length: 31 }, (_, index) => {
              const hour = 6 + Math.floor(index / 2)
              const minute = index % 2 === 0 ? '00' : '30'
              const time = `${String(hour).padStart(2, '0')}:${minute}`
              return (
                <option key={`${person.name}-${day}-start-${time}`} value={time}>
                  {time}
                </option>
              )
            })}
          </select>
        </label>
        <label>
          <span>Hours</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={Number.isFinite(hoursValue) ? Number(hoursValue.toFixed(2)) : 0}
            onChange={(event) => onHoursChange(person.name, day, event.target.value)}
            aria-label={`${person.name} hours for ${day}`}
          />
        </label>
        <label>
          <span>End</span>
          <select
            value={shift.endTime}
            onChange={(event) =>
              onShiftChange(person.name, day, 'endTime', event.target.value)
            }
            aria-label={`${person.name} end time for ${day}`}
          >
            {Array.from({ length: 31 }, (_, index) => {
              const hour = 6 + Math.floor(index / 2)
              const minute = index % 2 === 0 ? '00' : '30'
              const time = `${String(hour).padStart(2, '0')}:${minute}`
              return (
                <option key={`${person.name}-${day}-end-${time}`} value={time}>
                  {time}
                </option>
              )
            })}
          </select>
        </label>
      </div>
      <div className="day-actions">
        {day === 'Mon' && (
          <button
            type="button"
            className="copy-monday-times-button"
            onClick={() => onCopyMondayTimes(person.name)}
            aria-label={`Set all times for ${person.name}`}
          >
            Set all
          </button>
        )}
        <button
          type="button"
          className={`day-toggle ${isOff ? 'off' : ''}`}
          onClick={() => onToggleDayOff(person.name, day)}
          aria-label={`${person.name} off on ${day}`}
        >
          {isOff ? '×' : '•'}
        </button>
      </div>
    </td>
  )
}
