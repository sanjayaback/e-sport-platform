import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER) return // Skip if not configured
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Email send error:', err)
  }
}

export async function sendDiscordNotification(message: string, embeds?: object[]): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, embeds }),
    })
  } catch (err) {
    console.error('Discord webhook error:', err)
  }
}

export async function notifyTournamentCreated(tournament: {
  title: string; gameName: string; prizePool: number; hostEmail?: string
}): Promise<void> {
  const message = `🏆 New Tournament: **${tournament.title}** | Game: ${tournament.gameName} | Prize Pool: $${tournament.prizePool}`
  await sendDiscordNotification(message, [{
    title: `New Tournament: ${tournament.title}`,
    color: 0x00ff88,
    fields: [
      { name: 'Game', value: tournament.gameName, inline: true },
      { name: 'Prize Pool', value: `$${tournament.prizePool}`, inline: true },
    ],
  }])
}

export async function notifyPlayerJoined(params: {
  playerEmail: string; playerUsername: string; tournamentTitle: string; hostEmail?: string
}): Promise<void> {
  const { playerEmail, playerUsername, tournamentTitle, hostEmail } = params

  await sendEmail(playerEmail, `You joined ${tournamentTitle}!`, `
    <h2>Tournament Registration Confirmed</h2>
    <p>Hi ${playerUsername}, you have successfully joined <strong>${tournamentTitle}</strong>.</p>
    <p>Please complete your payment using the host's QR code and submit your screenshot.</p>
    <p>Good luck! 🎮</p>
  `)

  if (hostEmail) {
    await sendEmail(hostEmail, `New player joined ${tournamentTitle}`, `
      <h2>New Player Registration</h2>
      <p><strong>${playerUsername}</strong> has joined your tournament <strong>${tournamentTitle}</strong>.</p>
    `)
  }

  await sendDiscordNotification(`👤 **${playerUsername}** joined tournament **${tournamentTitle}**`)
}

export async function notifyWinnerSelected(params: {
  winnerEmail: string; winnerUsername: string; tournamentTitle: string; prizePool: number
}): Promise<void> {
  const { winnerEmail, winnerUsername, tournamentTitle, prizePool } = params

  await sendEmail(winnerEmail, `🏆 You won ${tournamentTitle}!`, `
    <h2>Congratulations! You Won!</h2>
    <p>Hi ${winnerUsername}, you are the winner of <strong>${tournamentTitle}</strong>!</p>
    <p>Your prize: <strong>$${prizePool}</strong> will be paid by the host shortly.</p>
  `)

  await sendDiscordNotification(`🏆 **${winnerUsername}** won tournament **${tournamentTitle}**! Prize: $${prizePool}`, [{
    title: `🎉 Winner Announced: ${tournamentTitle}`,
    color: 0xffd700,
    fields: [
      { name: 'Winner', value: winnerUsername, inline: true },
      { name: 'Prize', value: `$${prizePool}`, inline: true },
    ],
  }])
}
