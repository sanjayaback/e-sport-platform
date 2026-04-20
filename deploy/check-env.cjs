const fs = require('fs')
const path = require('path')

const targetFile = process.argv[2] || '.env.production.local'
const envPath = path.resolve(process.cwd(), targetFile)

if (!fs.existsSync(envPath)) {
  console.error(`[env-check] Missing env file: ${envPath}`)
  process.exit(1)
}

function parseEnvFile(content) {
  const result = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue
    }
    const index = line.indexOf('=')
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    result[key] = value
  }
  return result
}

const parsed = parseEnvFile(fs.readFileSync(envPath, 'utf8'))

const required = [
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEET_ID',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
]

const placeholderPatterns = [
  'replace_with',
  'your_',
  'YOUR_',
  'example',
  'service-account@your-project',
]

const errors = []
const warnings = []

for (const key of required) {
  const value = parsed[key]
  if (!value || !String(value).trim()) {
    errors.push(`Missing required value: ${key}`)
    continue
  }

  if (placeholderPatterns.some((pattern) => String(value).includes(pattern))) {
    errors.push(`Placeholder value detected for: ${key}`)
  }
}

if (parsed.JWT_SECRET && parsed.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET should be at least 32 characters long')
}

if (parsed.NEXT_PUBLIC_APP_URL && parsed.NEXT_PUBLIC_APP_URL !== 'https://www.ikillpro.com') {
  warnings.push(`NEXT_PUBLIC_APP_URL is "${parsed.NEXT_PUBLIC_APP_URL}", expected "https://www.ikillpro.com"`)
}

if (parsed.GOOGLE_PRIVATE_KEY) {
  if (!parsed.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    errors.push('GOOGLE_PRIVATE_KEY does not look like a valid private key')
  }
  if (!parsed.GOOGLE_PRIVATE_KEY.includes('\\n')) {
    warnings.push('GOOGLE_PRIVATE_KEY should usually be stored on one line using \\n separators')
  }
}

if (parsed.NODE_ENV && parsed.NODE_ENV !== 'production') {
  warnings.push(`NODE_ENV is "${parsed.NODE_ENV}", expected "production"`)
}

if (parsed.EMAIL_FROM && !parsed.EMAIL_FROM.includes('@')) {
  warnings.push('EMAIL_FROM should be a valid email address')
}

if (parsed.ALLOW_MOCK_GOOGLE_SHEETS === 'true') {
  warnings.push('ALLOW_MOCK_GOOGLE_SHEETS=true should not be enabled in production')
}

if (errors.length > 0) {
  console.error('[env-check] Failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  if (warnings.length > 0) {
    console.error('[env-check] Warnings:')
    for (const warning of warnings) {
      console.error(`- ${warning}`)
    }
  }
  process.exit(1)
}

console.log('[env-check] Required env values look good.')
if (warnings.length > 0) {
  console.log('[env-check] Warnings:')
  for (const warning of warnings) {
    console.log(`- ${warning}`)
  }
}
