#!/usr/bin/env node

import { spawn } from 'child_process'

console.log('Running tests...')

const jest = spawn('npm', ['test'], {
  cwd: process.cwd(),
  stdio: 'inherit'
})

jest.on('close', (code) => {
  console.log(`Tests completed with exit code: ${code}`)
})

jest.on('error', (error) => {
  console.error('Error running tests:', error.message)
})