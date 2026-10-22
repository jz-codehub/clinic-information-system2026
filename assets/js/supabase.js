/* ============================================================
   Rever Medical Center — Supabase Data Layer
   Connects to Supabase project: yebfhwzrosjzgqsordkx
   All DB reads/writes go through the `supabase` client below.
   ============================================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

const SUPABASE_URL = 'https://yebfhwzrosjzgqsordkx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYmZod3pyb3Nqemdxc29yZGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1Mjc4MTQsImV4cCI6MjEwODEwMzgxNH0.GA4C4HVmQghDOynLH2xSE9WU5QUKduH7vGJYx32HpBs'

/* -------------------------- DB KEYS -------------------------- */
/* -------------------------- CLINICS -------------------------- */
export const clinics = {
  async all() {
    const { data, error } = await supabase.from(DB_KEYS.clinics).select('*')
    if (error) console.error('Error fetching clinics:', error)
    return data || []
  },
  async insert(clinic) {
    const { data, error } = await supabase.from(DB_KEYS.clinics).insert([clinic]).select()
    if (error) console.error('Error inserting clinic:', error)
    return data
  },
  async update(id, updates) {
    const { data, error } = await supabase.from(DB_KEYS.clinics).update(updates).eq('id', id).select()
    if (error) console.error('Error updating clinic:', error)
    return data
  },
  async delete(id) {
    const { error } = await supabase.from(DB_KEYS.clinics).delete().eq('id', id)
    if (error) console.error('Error deleting clinic:', error)
  },
}

/* -------------------------- PATIENTS -------------------------- */
export const patients = {
  async all() {
    const { data, error } = await supabase.from(DB_KEYS.patients).select('*')
    if (error) console.error('Error fetching patients:', error)
    return data || []
  },
  async find(id) {
    const { data, error } = await supabase.from(DB_KEYS.patients).select('*').eq('id', id).single()
    if (error) console.error('Error finding patient:', error)
    return data
  },
  async save(patient) {
    const { data, error } = await supabase.from(DB_KEYS.patients).upsert([patient]).select()
    if (error) console.error('Error saving patient:', error)
    return data
  },
  async nextId() {
    const { data, error } = await supabase.from(DB_KEYS.patients).select('id')
    if (error) console.error('Error getting next patient ID:', error)
    const ids = (data || []).map(p => p.id)
    let max = 1000
    ids.forEach(id => {
      const n = parseInt(String(id).replace(/\D/g, ''), 10)
      if (!isNaN(n) && n > max) max = n
    })
    return 'P-' + (max + 1)
  },
  async byClinic(clinicId) {
    const { data, error } = await supabase.from(DB_KEYS.patients).select('*').eq('clinicId', clinicId)
    if (error) console.error('Error fetching patients by clinic:', error)
    return data || []
  },
  async byStatus(status) {
    const { data, error } = await supabase.from(DB_KEYS.patients).select('*').eq('status', status)
    if (error) console.error('Error fetching patients by status:', error)
    return data || []
  },
  async clearAll() {
    console.log('clearAll not implemented for Supabase - use supabase.from(DB_KEYS.patients).delete() instead')
  },
}
/* -------------------------- SCHEDULES -------------------------- */
export const schedules = {
  async all() {
    const { data, error } = await supabase.from(DB_KEYS.schedules).select('*')
    if (error) console.error('Error fetching schedules:', error)
    return data || []
  },
  async find(id) {
    const { data, error } = await supabase.from(DB_KEYS.schedules).select('*').eq('id', id).single()
    if (error) console.error('Error finding schedule:', error)
    return data
  },
  async save(schedule) {
    const { data, error } = await supabase.from(DB_KEYS.schedules).upsert([schedule]).select()
    if (error) console.error('Error saving schedule:', error)
    return data
  },
  async byClinic(clinicId) {
    const { data, error } = await supabase.from(DB_KEYS.schedules).select('*').eq('clinicId', clinicId)
    if (error) console.error('Error fetching schedules by clinic:', error)
    return data || []
  },
}
/* -------------------------- SERVICES -------------------------- */
export const services = {
  async all() {
    const { data, error } = await supabase.from(DB_KEYS.services).select('*')
    if (error) console.error('Error fetching services:', error)
    return data || []
  },
  async find(id) {
    const { data, error } = await supabase.from(DB_KEYS.services).select('*').eq('id', id).single()
    if (error) console.error('Error finding service:', error)
    return data
  },
}
/* -------------------------- SESSION -------------------------- */
export const session = {
  async get() {
    const { data, error } = await supabase.from(DB_KEYS.session).select('*').single()
    if (error) return null
    return data
  },
  async save(sess) {
    const { data, error } = await supabase.from(DB_KEYS.session).upsert([sess]).select()
    if (error) console.error('Error saving session:', error)
    return data
  },
  async clear() {
    const { error } = await supabase.from(DB_KEYS.session).delete().eq('userId', (await supabase.auth.getUser()).data.user.id)
    if (error) console.error('Error clearing session:', error)
  },
}
/* -------------------------- MIGRATION HELPER -------------------------- */
export const migrateFromLocalStorage = async () => {
  console.log('Migration from localStorage to Supabase - run once after setup')
  /*
  const lsPatients = localStorage.getItem('rmc_patients')
  const lsUsers = localStorage.getItem('rmc_users')
  const lsSchedules = localStorage.getItem('rmc_schedule_v5')
  
  if (lsPatients) await patients.save(JSON.parse(lsPatients))
  if (lsUsers) await users.save(JSON.parse(lsUsers))
  if (lsSchedules) await schedules.save(JSON.parse(lsSchedules))
  */
}
