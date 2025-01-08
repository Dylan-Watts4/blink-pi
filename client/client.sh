iterations=0
sleep_time=5m

# Calculate the max_iterations before restart
sleep_minutes=$(echo $sleep_time | sed 's/m//')
max_iterations=$((24 * 60 / sleep_minutes))

while :
do
    sleep $sleep_time
    /usr/bin/python /home/jenga/client/main.py

    iterations=$((iterations + 1))
    if [ "$iterations" -ge "$max_iterations" ]; then
        /sbin/shutdown -r now
    fi
done