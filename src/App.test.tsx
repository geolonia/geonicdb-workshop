import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('地図は index.html 側の静的な div が担うので、何も描画しない', () => {
    const { container } = render(<App />)
    expect(container).toBeEmptyDOMElement()
  })
})
