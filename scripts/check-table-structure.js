#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function checkTableStructure() {
  const sql = neon(process.env.SOFTWARE_DATABASE_URL)
  
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'software' 
      ORDER BY ordinal_position
    `
    
    console.log('Software table columns:')
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
    })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkTableStructure()
