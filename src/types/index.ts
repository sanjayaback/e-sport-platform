export type UserRole = 'player' | 'host' | 'admin'
export type TournamentStatus = 'upcoming' | 'live' | 'finished'
export type PaymentStatus = 'pending' | 'confirmed' | 'failed'
export type PaymentType = 'entryFee' | 'payout' | 'deposit' | 'withdraw'
export type GameName = 'PUBG' | 'Free Fire' | 'Other'

export interface IUser {
  _id: string
  username: string
  email: string
  role: UserRole
  walletBalance: number
  isSubscribed?: boolean
  createdAt: string
  updatedAt: string
}

export interface ITournamentPlayer {
  playerId: string
  gameID: string
  screenshotURL?: string
  paid: boolean
  paymentScreenshot?: string
  paymentApproved: boolean
  approved: boolean
  username?: string
  joinedAt?: string
}

export interface ITournament {
  _id: string
  hostId: string
  hostUsername?: string
  gameName: GameName
  title: string
  description?: string
  entryFee: number
  maxPlayers: number
  prizePool: number
  status: TournamentStatus
  players: ITournamentPlayer[]
  winnerId?: string
  winnerUsername?: string
  hostQRCodeURL?: string
  roomId?: string
  roomPassword?: string
  scheduledAt: string
  createdAt: string
  updatedAt: string
}

export interface IPayment {
  _id: string
  playerId: string
  tournamentId: string
  amount: number
  status: PaymentStatus
  type: PaymentType
  timestamp: string
}

export interface INotification {
  _id: string
  type: string
  userId: string
  tournamentId?: string
  message: string
  read: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: IUser
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AnalyticsData {
  totalPlayers: number
  totalTournaments: number
  totalPrizePool: number
  totalRevenue: number
  perGameStats: { game: string; count: number; players: number; prizePool: number }[]
  recentTournaments: ITournament[]
  monthlyRevenue: { month: string; revenue: number }[]
}

export interface JoinTournamentPayload {
  gameID: string
}

export interface ScreenshotPayload {
  screenshotURL: string
}

export interface CloudinaryImage {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  width: number
  height: number
  created_at: string
  resource_type: string
}

export interface QRCodeData {
  public_id: string
  secure_url: string
  tournamentId?: string
  uploadedAt: string
}

export interface TransactionScreenshotData {
  public_id: string
  secure_url: string
  transactionId?: string
  userId?: string
  uploadedAt: string
}
