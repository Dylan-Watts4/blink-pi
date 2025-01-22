sleep_time=5m

# Calculate the max_iterations before restart
sleep_minutes=$(echo $sleep_time | sed 's/m//')

while :
do
    sleep $sleep_time
    /usr/bin/python /home/jenga/client/main.py
done