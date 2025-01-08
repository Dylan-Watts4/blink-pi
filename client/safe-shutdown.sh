echo "Shutting down the system safely..."
sudo systemctl stop --now blink-client.service
sudo sync
sudo modprobe -r g_mass_storage
sleep 2
if ! sudo umount /mnt/usb ; then
    echo "Device is already unmounted."
fi
echo "Safe shutdown complete."

exit 0