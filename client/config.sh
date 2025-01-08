echo "Configuring modules..."
sudo echo "dwc2" >> /etc/modules-load.d/modules.conf
sudo echo "dtoverlay=dwc2" >> /boot/firmware/config.txt
sudo echo "g_mass_storage" >> /etc/modules-load.d/modules.conf
sudo echo "options g_mass_storage file=/usb-drive.img stall=0 ro=0 removable=1" >> /etc/modprobe.d/g_mass_storage.conf

echo "Creating USB drive image..."
echo "This will take a while..."
sudo dd if=/dev/zero of=/usb-drive.img bs=1M count=2048

echo "Creating filesystem..."
sudo mkfs.exfat /usb-drive.img

echo "Making mount point..."
sudo mkdir /mnt/usb

echo "Mounting USB drive..."
sudo mount sudo mount -o offset=31744 /usb-drive.img /mnt/usb

echo "Enable on boot..."
sudo chmod +x /home/jenga/client/client.sh
sudo mv /home/jenga/client/blink-client.service /etc/systemd/system/blink-client.service
sudo systemctl enable blink-client.service

echo "Adding shutdown script..."
sudo chmod +x /home/jenga/client/safe-shutdown.sh
sudo mv /home/jenga/client/blink-shutdown.service /etc/systemd/system/blink-shutdown.service
sudo systemctl enable blink-shutdown.service

echo "Done!"
echo "Reboot to enable USB drive."

read -p "Do you want to reboot now? [y/N] " answer
if [[ "$answer" == [Yy]* ]] ;then
    sudo reboot
fi