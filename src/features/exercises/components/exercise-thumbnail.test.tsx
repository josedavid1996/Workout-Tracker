import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import iconExerciseGeneric from '../../../assets/icons/icon-exercise-generic.svg'
import { ExerciseThumbnail } from './exercise-thumbnail'

// PR12 (live audit fix): the real `exercises.image` URL was always available
// from the API (confirmed via a debug `console.log` left in
// `exercise-picker.tsx`) but was never actually rendered anywhere — only a
// generic placeholder icon was shown. This component is the single shared
// implementation for rendering that real photo, with a defensive fallback
// for rows that have no image or whose URL fails to load.
describe('ExerciseThumbnail', () => {
  it('renders the real image when a src is provided', () => {
    render(<ExerciseThumbnail src="https://example.com/photo.jpg" alt="Bench Press" />)
    const img = screen.getByAltText('Bench Press') as HTMLImageElement
    expect(img.src).toBe('https://example.com/photo.jpg')
  })

  it('falls back to the generic icon when src is null', () => {
    render(<ExerciseThumbnail src={null} alt="Bench Press" />)
    const img = screen.getByAltText('Bench Press') as HTMLImageElement
    expect(img.src).not.toBe('https://example.com/photo.jpg')
    expect(img.src).toBe(iconExerciseGeneric)
  })

  it('falls back to the generic icon when the real image fails to load', () => {
    render(<ExerciseThumbnail src="https://example.com/broken.jpg" alt="Bench Press" />)
    const img = screen.getByAltText('Bench Press') as HTMLImageElement
    fireEvent.error(img)
    expect(img.src).toBe(iconExerciseGeneric)
  })

  it('sets loading=lazy so long result lists do not fetch every photo eagerly', () => {
    render(<ExerciseThumbnail src="https://example.com/photo.jpg" alt="Bench Press" />)
    const img = screen.getByAltText('Bench Press') as HTMLImageElement
    expect(img.getAttribute('loading')).toBe('lazy')
  })
})
