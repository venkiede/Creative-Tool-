import requests
import os
import glob

URL = "http://localhost:8000"
ASSETS_DIR = "sample_assets"

def test_upload_flow():
    files = glob.glob(os.path.join(ASSETS_DIR, "*.png"))
    if not files:
        print(f"No png files found in {ASSETS_DIR}")
        return

    file_path = files[0]
    print(f"Uploading {file_path}...")
    
    with open(file_path, "rb") as f:
        # Use proper file tuple (filename, file_object, content_type)
        files = {"file": (os.path.basename(file_path), f, "image/png")}
        try:
            r = requests.post(f"{URL}/upload", files=files)
            if r.status_code != 200:
                print(f"Upload failed: {r.status_code} {r.text}")
                return
                
            data = r.json()
            print("Upload Response:", data)
            
            image_url = f"{URL}{data['url']}"
            print(f"Checking access to: {image_url}")
            
            r_img = requests.get(image_url)
            if r_img.status_code == 200:
                print(f"Success! Image accessible (Size: {len(r_img.content)} bytes).")
            else:
                print(f"Failed to access image. Status: {r_img.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_upload_flow()
