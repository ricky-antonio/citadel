import { vi } from 'vitest'

export const mockSupabaseFrom = vi.fn()
export const mockSupabaseSelect = vi.fn()
export const mockSupabaseEq = vi.fn()
export const mockSupabaseGt = vi.fn()
export const mockSupabaseOrder = vi.fn()
export const mockSupabaseLimit = vi.fn()
export const mockSupabaseSingle = vi.fn()
export const mockSupabaseUpsert = vi.fn()
export const mockSupabaseInsert = vi.fn()

export const mockSupabase = {
  from: mockSupabaseFrom.mockReturnThis(),
  select: mockSupabaseSelect.mockReturnThis(),
  eq: mockSupabaseEq.mockReturnThis(),
  gt: mockSupabaseGt.mockReturnThis(),
  order: mockSupabaseOrder.mockReturnThis(),
  limit: mockSupabaseLimit.mockReturnThis(),
  single: mockSupabaseSingle,
  upsert: mockSupabaseUpsert,
  insert: mockSupabaseInsert,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))
