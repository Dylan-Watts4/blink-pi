counter=0

while :
do
    sleep 10m
    /usr/bin/python /home/jenga/client/main.py
    counter=$((counter + 1))
    echo "Counter: $counter"
    if [ $counter -eq 18 ]; then
        echo "Restarting the gadget..."
        sudo modprobe -r g_mass_storage
        sleep 10s
        sudo modprove g_mass_storage file=/usb-drive.img stall=0 ro=0 removable=1
        counter=0
    fi
done