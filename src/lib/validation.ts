import Joi from 'joi'

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('player', 'host', 'admin').default('player'),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const tournamentSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(2000).optional().allow(''),
  gameName: Joi.string().valid('PUBG', 'Free Fire', 'Other').required(),
  entryFee: Joi.number().min(0).required(),
  maxPlayers: Joi.number().integer().min(2).max(100).required(),
  prizePool: Joi.number().min(0).required(),
  hostQRCodeURL: Joi.string().optional().allow(''), // Support for Base64 or URL
  roomId: Joi.string().min(1).max(50).required(),
  roomPassword: Joi.string().min(1).max(50).required(),
  scheduledAt: Joi.string().isoDate().required(),
})

export const tournamentUpdateSchema = Joi.object({
  status: Joi.string().valid('upcoming', 'live', 'finished').optional(),
  winnerId: Joi.string().optional(),
  hostQRCodeURL: Joi.string().optional().allow(''),
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  scheduledAt: Joi.string().isoDate().optional(),
})

export const joinTournamentSchema = Joi.object({
  gameID: Joi.string().min(2).max(50).required(),
  paymentScreenshot: Joi.string().optional(),
})

export const screenshotSchema = Joi.object({
  screenshotURL: Joi.string().required(), // Support for Base64 or URL
})

export const addFundsSchema = Joi.object({
  amount: Joi.number().min(1).max(10000).required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'bank_transfer', 'paypal').required()
})

export const withdrawSchema = Joi.object({
  amount: Joi.number().min(1).max(10000).required(),
  withdrawMethod: Joi.string().valid('bank_transfer', 'paypal', 'crypto').required()
})

export const adminAddFundsSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().min(1).max(50000).required(),
  paymentMethod: Joi.string().valid('admin_credit', 'bank_transfer', 'paypal', 'crypto', 'manual').required(),
  reason: Joi.string().optional().max(500)
})

export function validate<T>(schema: Joi.Schema, data: unknown): { value?: T; error?: string } {
  const { error, value } = schema.validate(data, { abortEarly: false })
  if (error) {
    return { error: error.details.map(d => d.message).join('; ') }
  }
  return { value: value as T }
}
