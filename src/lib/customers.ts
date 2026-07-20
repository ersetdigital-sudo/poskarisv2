import { supabase, Customer } from './supabase'

/**
 * Find or create a customer by phone number.
 * If customer exists, returns existing. Otherwise creates new one.
 */
export async function findOrCreateCustomer(
  nama: string,
  noWa: string,
  alamat?: string
): Promise<Customer | null> {
  if (!noWa || !nama) return null

  try {
    // Try to find existing customer by phone
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('no_wa', noWa)
      .maybeSingle()

    if (existing) {
      // Update name if different (customer might have changed their name)
      if (existing.nama !== nama) {
        const { data: updated } = await supabase
          .from('customers')
          .update({ nama })
          .eq('id', existing.id)
          .select()
          .single()
        return updated
      }
      return existing
    }

    // Create new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        nama,
        no_wa: noWa,
        alamat: alamat || null,
      })
      .select()
      .single()

    if (error) {
      // Handle race condition - another insert might have created the customer
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('customers')
          .select('*')
          .eq('no_wa', noWa)
          .single()
        return retry
      }
      console.error('Error creating customer:', error)
      return null
    }

    return newCustomer
  } catch (e) {
    console.error('Error in findOrCreateCustomer:', e)
    return null
  }
}
