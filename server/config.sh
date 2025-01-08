echo "Initializing server configuration..."
npm init -y
npm install express
npm install ping

echo "Adding storage management script..."
sudo chmod +x /home/jenga/server/storage.sh
sudo mv /home/jenga/server/storage.service /etc/systemd/system/storage.service
sudo systemctl enable --now storage.service

echo "Done!"