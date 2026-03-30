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
  username?: string
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
