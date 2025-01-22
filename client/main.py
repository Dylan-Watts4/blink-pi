# Import private data
from config import SERVER, USER, PASS

import os
import time
from ftplib import FTP

directory = "/mnt/usb"
video_directory = "/mnt/usb/blink"

def upload_file(file_path):
    with FTP(SERVER) as ftp:
        ftp.login(user=USER, passwd=PASS)
        with open(file_path, "rb") as file:
            ftp.storbinary(f"STOR {os.path.basename(file_path)}", file)
        print(f"File {file_path} uploaded successfully")

def check_directory():
    mp4_files = []
    mount()
    for root, dirs, files in os.walk(video_directory):
        for file in files:
            if file.endswith(".mp4"):
                mp4_files.append(os.path.join(root, file))
    return mp4_files

def remount():
    os.system(f"sudo umount {directory}")
    os.system(f"sudo mount -o offset=31744 /usb-drive.img {directory}")

def mount():
    os.system(f"sudo mount -o offset=31744 /usb-drive.img {directory}")

def unmount():
    os.system("sudo sync")
    os.system(f"sudo umount {directory}")

def clean():
    os.system("sudo sync")
    os.system("sudo modprobe -r g_mass_storage")
    os.system(f"sudo rm -rf {video_directory}/*")
    time.sleep(5)
    os.system("sudo modprobe g_mass_storage file=/usb-drive.img stall=0 ro=0 removable=1")
    os.system("sudo sync")

def check_and_reload_g_mass_storage():
    with open("/sys/module/g_mass_storage/parameters/ro", "r") as file:
        ro = file.read().strip()
    if ro == "Y":
        print("Reloading g_mass_storage")
        os.system("sudo modprobe -r g_mass_storage")
        os.system("sudo modprobe g_mass_storage file=/usb-drive.img stall=0 ro=0 removable=1")
        os.system("sudo sync")

def ensure_usb_connection():
    usb_status = os.popen("ls /sys/class/udc").read().strip()
    if not usb_status:
        print("Reconnecting USB")
        os.system("sudo modprobe -r g_mass_storage")
        time.sleep(1)
        os.system("sudo modprobe g_mass_storage file=/usb-drive.img stall=0 ro=0 removable=1")
        os.system("sudo sync")

files = check_directory()
if len(files) > 0:
    for file in files:
        print(f"Processing {file}")
        upload_file(f"{file}")
    clean()
unmount()
check_and_reload_g_mass_storage()
ensure_usb_connection()