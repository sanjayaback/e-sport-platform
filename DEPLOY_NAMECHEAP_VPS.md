# Deploying On a Namecheap VPS

This project runs well on a standard Ubuntu VPS with:

- Node.js 20.9+ or 22 LTS
- Nginx as a reverse proxy
- PM2 to keep the Next.js app running

## Your Server Values

- Domain: `www.ikillpro.com`
- Root domain: `ikillpro.com`
- VPS IP: `162.0.228.211`
- OS: `Ubuntu 20.04 blank (64-bit)`
- Recommended public app URL: `https://www.ikillpro.com`

## 1. Prepare DNS in Namecheap

In Namecheap `Domain List -> Manage -> Advanced DNS`:

- Set an `A Record` for `@` to `162.0.228.211`
- Set `www` as a `CNAME` to `@`
- Remove old parking or redirect records if they conflict

Wait for DNS propagation before enabling SSL.

## 2. Connect to the VPS

For a typical Ubuntu VPS:

```bash
ssh root@162.0.228.211
```

If Namecheap gave you a custom SSH port, use:

```bash
ssh root@162.0.228.211 -p YOUR_PORT
```

## 3. Install system packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx ufw certbot python3-certbot-nginx git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
```

If the repo is already on the VPS and you want a shortcut for Ubuntu 20.04, you can run:

```bash
bash deploy/setup-ubuntu-20.04.sh
```

## 4. Upload the project

GitHub repo:

```bash
https://github.com/sanjayaback/gmae.git
```

If the repo is public, clone it like this:

```bash
sudo mkdir -p /var/www/kill-pro-esports
sudo chown -R $USER:$USER /var/www/kill-pro-esports
cd /var/www/kill-pro-esports
git clone https://github.com/sanjayaback/gmae.git .
```

If the repo is private, use one of these options instead:

Option 1: clone with a GitHub personal access token

```bash
git clone https://YOUR_GITHUB_USERNAME:YOUR_GITHUB_PAT@github.com/sanjayaback/gmae.git .
```

Option 2: upload the project by ZIP/SFTP instead of cloning from GitHub

If the repo is already on the server, just `git pull`.

## 5. Create production env

Use the domain-ready template:

```bash
cd /var/www/kill-pro-esports
cp deploy/env.production.ikillpro.example .env.production.local
nano .env.production.local
```

Validate the env before building:

```bash
node deploy/check-env.cjs .env.production.local
```

Required values for this app:

- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NODE_ENV=production`
- `ALLOW_MOCK_GOOGLE_SHEETS=false`

Optional values:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `DISCORD_WEBHOOK_URL`

Important:

- Set `NEXT_PUBLIC_APP_URL=https://www.ikillpro.com`
- Keep the Google private key in one line with `\n` characters. The app already converts that format at runtime.
- This app uses Google Sheets, so the old `MONGODB_URI` lines from your local env are not needed in production.
- Do not copy your current local `.env.local` to production until you rotate exposed secrets first.

## 6. Install dependencies and build

```bash
cd /var/www/kill-pro-esports
npm ci
node deploy/check-env.cjs .env.production.local
npm run build
```

## 7. Start the app with PM2

```bash
cd /var/www/kill-pro-esports
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs kill-pro-esports
pm2 restart kill-pro-esports --update-env
```

## 8. Configure Nginx

Copy the included domain-ready config:

```bash
sudo cp deploy/namecheap-nginx.conf /etc/nginx/sites-available/kill-pro-esports
```

Enable it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/kill-pro-esports /etc/nginx/sites-enabled/kill-pro-esports
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 10. Enable HTTPS

After DNS is pointing correctly:

```bash
sudo certbot --nginx -d ikillpro.com -d www.ikillpro.com
```

Then test renewal:

```bash
sudo certbot renew --dry-run
```

## 11. Update the app later

```bash
cd /var/www/kill-pro-esports
git pull
bash deploy/deploy.sh
```

If the repo is private and `git pull` asks for credentials, either:

- configure a deploy key or GitHub PAT on the VPS
- or upload updated files manually and then run `bash deploy/deploy.sh`

## Troubleshooting

If the site does not open:

- Check DNS first
- Check PM2: `pm2 logs kill-pro-esports`
- Check Nginx: `sudo systemctl status nginx`
- Check the reverse proxy config: `sudo nginx -t`
- Make sure port `3000` is only local and Nginx is serving `80/443`

If uploads fail:

- Confirm `client_max_body_size 25M` is present in Nginx
- Confirm Cloudinary keys are correct

If Google Sheets fails:

- Confirm the spreadsheet is shared with the service account email
- Confirm `GOOGLE_PRIVATE_KEY` still contains valid `\n` separators

## Copy-Paste First Run

If this is a fresh VPS and your repo URL is ready, these are the main commands:

```bash
ssh root@162.0.228.211
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx ufw certbot python3-certbot-nginx git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo mkdir -p /var/www/kill-pro-esports
sudo chown -R $USER:$USER /var/www/kill-pro-esports
cd /var/www/kill-pro-esports
git clone https://github.com/sanjayaback/gmae.git .
cp deploy/env.production.ikillpro.example .env.production.local
nano .env.production.local
node deploy/check-env.cjs .env.production.local
bash deploy/deploy.sh
sudo cp deploy/namecheap-nginx.conf /etc/nginx/sites-available/kill-pro-esports
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/kill-pro-esports /etc/nginx/sites-enabled/kill-pro-esports
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo certbot --nginx -d ikillpro.com -d www.ikillpro.com
```

If GitHub says the repository is not found during clone, that usually means the repo is private or the URL is wrong. In that case, use a PAT-based clone or upload the project manually.
