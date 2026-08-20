import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PHOTOS_DIR = r"D:\Intern Projects\E-commerce\Product Photos"
OUTPUT_DIR = r"D:\Intern Projects\E-commerce\public\banners"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_hd_cutout(img_path: str, target_h: int) -> Image.Image:
    """
    Full HD solid cutout extractor.
    Preserves 100% of internal white labels and text by filling row-wise and column-wise product bounds.
    Zero black spots, zero noise, 100% crystal clear.
    """
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    is_product = (r < 242) | (g < 242) | (b < 242)
    H, W = is_product.shape
    
    row_mask = np.zeros((H, W), dtype=bool)
    for y in range(H):
        idx = np.where(is_product[y])[0]
        if len(idx) > 0:
            row_mask[y, idx[0]:idx[-1] + 1] = True
            
    col_mask = np.zeros((H, W), dtype=bool)
    for x in range(W):
        idx = np.where(is_product[:, x])[0]
        if len(idx) > 0:
            col_mask[idx[0]:idx[-1] + 1, x] = True
            
    solid_mask = row_mask & col_mask
    
    alpha_img = Image.fromarray((solid_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    img.putalpha(alpha_img)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    target_w = int(img.width * (target_h / img.height))
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)

def create_shadow(img: Image.Image, blur_radius=18, offset_y=12, opacity=0.32) -> Image.Image:
    """Create a soft contact drop shadow for the product."""
    alpha = img.split()[-1]
    shadow = Image.new("RGBA", img.size, (0, 0, 0, int(255 * opacity)))
    shadow.putalpha(alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))
    
    canvas = Image.new("RGBA", (img.width + blur_radius * 2, img.height + offset_y + blur_radius * 2), (0, 0, 0, 0))
    canvas.paste(shadow, (blur_radius, blur_radius + offset_y), shadow)
    canvas.paste(img, (blur_radius, blur_radius), img)
    return canvas

def make_gradient(W, H, c_start, c_end):
    """Generate a 100% smooth, continuous seamless horizontal gradient across the entire canvas."""
    base = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(base)
    for x in range(W):
        ratio = x / W
        r = int(c_start[0] + ratio * (c_end[0] - c_start[0]))
        g = int(c_start[1] + ratio * (c_end[1] - c_start[1]))
        b = int(c_start[2] + ratio * (c_end[2] - c_start[2]))
        draw.line([(x, 0), (x, H)], fill=(r, g, b, 255))
    return base

def build_banner_1():
    """GALENIA & SEBOTIC FULL HD BANNER"""
    W, H = 1920, 720
    bg = make_gradient(W, H, (10, 42, 48), (4, 18, 22))
    draw = ImageDraw.Draw(bg)

    p1 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--SEBOTIC--Physilogical-Shampoo.png"), 480)
    p2 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--SEBOTIC--Anti-Dandruff-Shampoo.png"), 440)
    p3 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--HY-SERUM--Hyaluronic-Acid.png"), 420)

    bg.paste(create_shadow(p2), (160, 130), create_shadow(p2))
    bg.paste(create_shadow(p1), (370, 105), create_shadow(p1))
    bg.paste(create_shadow(p3), (610, 140), create_shadow(p3))

    try:
        font_kicker = ImageFont.truetype("arialbd.ttf", 25)
        font_title = ImageFont.truetype("georgiab.ttf", 56)
        font_sub = ImageFont.truetype("arial.ttf", 28)
        font_offer = ImageFont.truetype("arialbd.ttf", 42)
        font_btn = ImageFont.truetype("arialbd.ttf", 26)
    except:
        font_kicker = font_title = font_sub = font_offer = font_btn = ImageFont.load_default()

    tx = 960
    draw.text((tx, 135), "ITALIAN DERMATOLOGICAL CARE", fill=(52, 211, 153, 255), font=font_kicker)
    draw.text((tx, 178), "GALENIA & SEBOTIC", fill=(255, 255, 255, 255), font=font_title)
    draw.text((tx, 255), "Physiological & Anti-Dandruff Scalp Solutions", fill=(210, 235, 230, 240), font=font_sub)
    draw.text((tx, 325), "UP TO 30% OFF · 100% GENUINE", fill=(251, 191, 36, 255), font=font_offer)
    draw.text((tx, 388), "Formulated in Italy for sensitive & flaky scalp conditions.", fill=(175, 205, 200, 220), font=font_sub)

    btn_box = [tx, 470, tx + 270, 540]
    draw.rounded_rectangle(btn_box, radius=35, fill=(16, 185, 129, 255))
    draw.text((tx + 50, 488), "SHOP NOW  >", fill=(255, 255, 255, 255), font=font_btn)

    bg.convert("RGB").save(os.path.join(OUTPUT_DIR, "hero-sebotic-galenia.jpg"), quality=98)
    print("Saved Full HD hero-sebotic-galenia.jpg")

def build_banner_2():
    """LIPIOL DERM FULL HD BANNER"""
    W, H = 1920, 720
    bg = make_gradient(W, H, (250, 246, 240), (238, 230, 220))
    draw = ImageDraw.Draw(bg)

    p1 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--LIPIOL--Crema-Detergente.png"), 480)
    p2 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--LIPIOL--Viso.png"), 440)
    p3 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--LIPIOL--Olio-Detergente.png"), 460)
    p4 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--LIPIOL--Emulsione.png"), 430)

    bg.paste(create_shadow(p4), (130, 140), create_shadow(p4))
    bg.paste(create_shadow(p1), (300, 105), create_shadow(p1))
    bg.paste(create_shadow(p3), (510, 115), create_shadow(p3))
    bg.paste(create_shadow(p2), (700, 135), create_shadow(p2))

    try:
        font_kicker = ImageFont.truetype("arialbd.ttf", 25)
        font_title = ImageFont.truetype("georgiab.ttf", 56)
        font_sub = ImageFont.truetype("arial.ttf", 28)
        font_offer = ImageFont.truetype("arialbd.ttf", 42)
        font_btn = ImageFont.truetype("arialbd.ttf", 26)
    except:
        font_kicker = font_title = font_sub = font_offer = font_btn = ImageFont.load_default()

    tx = 980
    draw.text((tx, 135), "DRY & SENSITIVE SKIN SOLUTIONS", fill=(180, 83, 9, 255), font=font_kicker)
    draw.text((tx, 178), "LIPIOL DERM CARE", fill=(26, 44, 49, 255), font=font_title)
    draw.text((tx, 255), "Intense Hydration & Barrier Repair", fill=(60, 75, 80, 255), font=font_sub)
    draw.text((tx, 325), "UP TO 25% OFF · DERMA TESTED", fill=(217, 119, 6, 255), font=font_offer)
    draw.text((tx, 388), "Lipid-replenishing formula for severe skin dryness.", fill=(90, 105, 110, 255), font=font_sub)

    btn_box = [tx, 470, tx + 290, 540]
    draw.rounded_rectangle(btn_box, radius=35, fill=(180, 83, 9, 255))
    draw.text((tx + 40, 488), "EXPLORE RANGE  >", fill=(255, 255, 255, 255), font=font_btn)

    bg.convert("RGB").save(os.path.join(OUTPUT_DIR, "hero-lipiol-collection.jpg"), quality=98)
    print("Saved Full HD hero-lipiol-collection.jpg")

def build_banner_3():
    """SWISS FORMULA SERUMS FULL HD BANNER"""
    W, H = 1920, 720
    bg = make_gradient(W, H, (10, 32, 54), (4, 14, 28))
    draw = ImageDraw.Draw(bg)

    p1 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--SWISS-FORMULA--Face-Serum.png"), 480)
    p2 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--SWISS-FORMULA--Hair-Serum.png"), 480)
    p3 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--HY-SERUM--Hyaluronic-Acid.png"), 440)

    bg.paste(create_shadow(p2), (160, 115), create_shadow(p2))
    bg.paste(create_shadow(p1), (400, 105), create_shadow(p1))
    bg.paste(create_shadow(p3), (650, 135), create_shadow(p3))

    try:
        font_kicker = ImageFont.truetype("arialbd.ttf", 25)
        font_title = ImageFont.truetype("georgiab.ttf", 56)
        font_sub = ImageFont.truetype("arial.ttf", 28)
        font_offer = ImageFont.truetype("arialbd.ttf", 42)
        font_btn = ImageFont.truetype("arialbd.ttf", 26)
    except:
        font_kicker = font_title = font_sub = font_offer = font_btn = ImageFont.load_default()

    tx = 960
    draw.text((tx, 135), "ADVANCED RADIANCE & HYDRATION", fill=(56, 189, 248, 255), font=font_kicker)
    draw.text((tx, 178), "SWISS FORMULA", fill=(255, 255, 255, 255), font=font_title)
    draw.text((tx, 255), "Hyaluronic Acid & Active Face/Hair Serums", fill=(205, 230, 250, 240), font=font_sub)
    draw.text((tx, 325), "INSTANT GLOW · 100% AUTHENTIC", fill=(251, 191, 36, 255), font=font_offer)
    draw.text((tx, 388), "Clinical strength pure skin & hair nourishment.", fill=(175, 205, 230, 220), font=font_sub)

    btn_box = [tx, 470, tx + 290, 540]
    draw.rounded_rectangle(btn_box, radius=35, fill=(14, 165, 233, 255))
    draw.text((tx + 40, 488), "DISCOVER NOW  >", fill=(255, 255, 255, 255), font=font_btn)

    bg.convert("RGB").save(os.path.join(OUTPUT_DIR, "hero-swiss-formula.jpg"), quality=98)
    print("Saved Full HD hero-swiss-formula.jpg")

def build_banner_4():
    """PROTELION 50 & KERALISE FULL HD BANNER"""
    W, H = 1920, 720
    bg = make_gradient(W, H, (28, 36, 48), (14, 18, 26))
    draw = ImageDraw.Draw(bg)

    p1 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--PROTELION50--Emulsion-Emulsione.png"), 480)
    p2 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--KERALISE--Gel-Scrub.png"), 440)
    p3 = extract_hd_cutout(os.path.join(PHOTOS_DIR, "Nills-Mart--Product-Photo--1500px--KERALISE--Crema-Comedolitica.png"), 420)

    bg.paste(create_shadow(p2), (150, 130), create_shadow(p2))
    bg.paste(create_shadow(p1), (370, 105), create_shadow(p1))
    bg.paste(create_shadow(p3), (630, 145), create_shadow(p3))

    try:
        font_kicker = ImageFont.truetype("arialbd.ttf", 25)
        font_title = ImageFont.truetype("georgiab.ttf", 56)
        font_sub = ImageFont.truetype("arial.ttf", 28)
        font_offer = ImageFont.truetype("arialbd.ttf", 42)
        font_btn = ImageFont.truetype("arialbd.ttf", 26)
    except:
        font_kicker = font_title = font_sub = font_offer = font_btn = ImageFont.load_default()

    tx = 960
    draw.text((tx, 135), "MAXIMUM UV DEFENSE · SPF 50+", fill=(251, 191, 36, 255), font=font_kicker)
    draw.text((tx, 178), "PROTELION 50", fill=(255, 255, 255, 255), font=font_title)
    draw.text((tx, 255), "Elevated UVB + UVA Solar Protection", fill=(230, 238, 245, 240), font=font_sub)
    draw.text((tx, 325), "OILY & SENSITIVE SKIN CARE", fill=(52, 211, 153, 255), font=font_offer)
    draw.text((tx, 388), "Non-greasy, water-resistant daily solar shield.", fill=(185, 200, 210, 220), font=font_sub)

    btn_box = [tx, 470, tx + 300, 540]
    draw.rounded_rectangle(btn_box, radius=35, fill=(245, 158, 11, 255))
    draw.text((tx + 40, 488), "SHOP SUNCARE  >", fill=(255, 255, 255, 255), font=font_btn)

    bg.convert("RGB").save(os.path.join(OUTPUT_DIR, "hero-protelion-sunscreen.jpg"), quality=98)
    print("Saved Full HD hero-protelion-sunscreen.jpg")

if __name__ == "__main__":
    build_banner_1()
    build_banner_2()
    build_banner_3()
    build_banner_4()
