// Simple test to verify our fixes
try {
  console.log('Testing imports...')
  
  // This should work now
  const types = await import('./src/types.js')
  console.log('✓ Types import successful')
  
  const index = await import('./src/index.js') 
  console.log('✓ Index import successful')
  
  console.log('All imports working!')
} catch (error) {
  console.error('Import failed:', error.message)
}