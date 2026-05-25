import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: 'chicago' }),
  usePathname: () => '/city/chicago',
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('react-map-gl/mapbox', () => ({
  Map: ({ children, style, initialViewState, ...props }: { children?: React.ReactNode; style?: React.CSSProperties; initialViewState?: { zoom?: number }; [key: string]: unknown }) => (
    <div data-testid="mock-map" data-zoom={initialViewState?.zoom} style={style} {...props}>
      {children}
    </div>
  ),
  useMap: () => ({ current: null }),
}))

global.fetch = vi.fn()
