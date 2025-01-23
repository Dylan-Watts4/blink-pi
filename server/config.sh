echo "Initializing server configuration..."
npm init -y
npm install express
npm install ping
npm install https
npm install bcrypt express-session connect-flash passport passport-local

echo "Adding storage management script..."
sudo chmod +x /home/jenga/server/storage.sh
sudo mv /home/jenga/server/storage.service /etc/systemd/system/storage.service
sudo systemctl enable --now storage.service

sudo useradd -r -s /bin/false cloudflared
sudo mkdir -p /home/cloudflared/.cloudflared
sudo chown -R cloudflared:cloudflared /home/cloudflared/.cloudflared

echo "Done!"