import os 

DIRECTORY = "/media/blink/videos"
# MB
DEDICATED_SPACE = 300 * 1024 # 300 GB

def get_files():
    return os.listdir(DIRECTORY)

def get_used_storage():
    total_size = 0
    for file in get_files():
        filepath = os.path.join(DIRECTORY, file)
        if os.path.isfile(filepath):
            total_size += os.path.getsize(filepath)
    return total_size

def get_used_storage_mb():
    return get_used_storage() / 1024 / 1024

def is_full():
    return get_used_storage_mb() >= DEDICATED_SPACE

def get_sorted_files():
    files = get_files()
    files_with_time = [(file, os.path.getmtime(os.path.join(DIRECTORY, file))) for file in files]
    sorted_files = sorted(files_with_time, key=lambda x: x[1])
    return [file for file, _ in sorted_files]

def free_storage():
    files = get_sorted_files()
    for file in files:
        print(f"Removing {file}")
        os.remove(os.path.join(DIRECTORY, file))
        if get_used_storage_mb() < DEDICATED_SPACE:
            break

if __name__ == "__main__":
    print("Beginning storage management")
    if is_full():
        print("Storage is full")
        free_storage()