import test from 'node:test'
import assert from 'node:assert/strict'
import { getShiftBarStyle, getShiftHours, shiftDayForward } from './shiftUtils.js'

test('Sunday rolls to Monday when a day off is carried into the next week', () => {
  assert.equal(shiftDayForward('Sun', 1), 'Mon')
})

test('a 9:00 to 17:00 shift counts as 7.5 hours after the daily 30 minute break', () => {
  assert.equal(getShiftHours('09:00', '17:00'), 7.5)
})

test('shift bar uses a 9:00 to 18:00 day scale and fills only for working time', () => {
  const style = getShiftBarStyle('09:00', '17:00')

  assert.equal(style.left, '0%')
  assert.equal(style.width, '88.88888888888889%')
})

test('shift bar clips to the visible day range when a shift starts before 9 or ends after 18', () => {
  const style = getShiftBarStyle('08:00', '19:00')

  assert.equal(style.left, '0%')
  assert.equal(style.width, '100%')
})
