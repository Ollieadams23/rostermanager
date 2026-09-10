export default function RosterDayCard({ day, availableEmployees, minimumStaff, maximumStaff }) {
  const staffingCount = availableEmployees.length
  const isUnderMinimum = staffingCount < minimumStaff
  const isOverMaximum = staffingCount > maximumStaff
  const dayStatusClass = isOverMaximum
    ? 'roster-overstaffed'
    : isUnderMinimum
      ? 'roster-understaffed'
      : 'roster-okay'

  return (
    <div key={day} className={`roster-day-card ${dayStatusClass}`}>
      <h3>{day}</h3>
      <p className="roster-available-count">
        {staffingCount} / {minimumStaff} min • {maximumStaff} max
      </p>
      {availableEmployees.length > 0 ? (
        <ul>
          {availableEmployees.map((person, index) => (
            <li key={`${day}-${person.name}-${index}`}>{person.name}</li>
          ))}
        </ul>
      ) : (
        <p className="roster-empty">Closed</p>
      )}
      {isOverMaximum && (
        <p className="roster-warning">Over staffed by {staffingCount - maximumStaff}</p>
      )}
      {!isOverMaximum && isUnderMinimum && (
        <p className="roster-warning">
          Need {minimumStaff - staffingCount} more
        </p>
      )}
      {!isOverMaximum && !isUnderMinimum && staffingCount > 0 && (
        <p className="roster-warning roster-ok-message">Staffing okay</p>
      )}
    </div>
  )
}
