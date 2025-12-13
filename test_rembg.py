from rembg import remove
from PIL import Image
import io
import os

def test_rembg():
    input_path = "sample_assets/packshot_cereal.png"
    output_path = "sample_assets/test_nobg.png"
    
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        # Try finding any png
        import glob
        files = glob.glob("sample_assets/*.png")
        if files:
            input_path = files[0]
        else:
            print("No assets to test")
            return

    print(f"Processing {input_path}...")
    try:
        inp = Image.open(input_path)
        out = remove(inp)
        out.save(output_path)
        print(f"Success! Saved to {output_path}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_rembg()
