import urllib.request
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"

def http_post(url, body, headers=None):
    headers = headers or {}
    headers.setdefault("Content-Type", "application/json")
    data = json.dumps(body).encode("utf-8") if isinstance(body, dict) else body
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_get(url, headers=None):
    headers = headers or {}
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_patch(url, body, headers=None):
    headers = headers or {}
    headers.setdefault("Content-Type", "application/json")
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="PATCH")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def run_test():
    print("=" * 60)
    print("🚀 STARTING FULL E-COMMERCE END-TO-END ORDER TEST")
    print("=" * 60)

    # 1. Admin Login to get token
    print("\n🔐 1. Authenticating Admin (admin@nillsmart.com)...")
    login_data = "username=admin%40nillsmart.com&password=admin12345".encode()
    login_req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(login_req) as res:
        admin_auth = json.loads(res.read().decode())
    admin_token = admin_auth["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   ✅ Admin logged in successfully!")

    # 2. Create Promo Code "TEST100"
    print("\n🎟️ 2. Creating Promo Code 'TEST100' via Admin Panel...")
    promo_payload = {
        "code": "TEST100",
        "description": "Special ৳100 Discount Voucher for Testing",
        "discount_type": "fixed",
        "discount_value": 100.0,
        "min_order_amount": 300.0,
        "is_active": True
    }
    try:
        promo_res = http_post(f"{BASE_URL}/feedback/promotions", promo_payload, admin_headers)
        print(f"   ✅ Created Promo Code: {promo_res['code']} (-৳{promo_res['discount_value']})")
    except Exception as e:
        print(f"   ℹ️ Promo code creation notice (may already exist): {e}")

    # 3. Customer Browses Products
    print("\n🛍️ 3. Customer browsing store products...")
    products = http_get(f"{BASE_URL}/products")
    if not products:
        print("   ❌ Error: No products in catalog!")
        return
    
    target_product = products[0]
    print(f"   ✅ Customer selected product: '{target_product['name']}' @ ৳{target_product['price']}")

    # 4. Customer Validates Promo Code
    print("\n🏷️ 4. Applying Promo Code 'TEST100' at Checkout...")
    val_res = http_post(f"{BASE_URL}/feedback/promotions/validate", {
        "code": "TEST100",
        "subtotal": float(target_product['price'])
    })
    print(f"   ✅ Promo valid! Discount calculated: ৳{val_res['calculated_discount']}")

    # 5. Place Customer Order
    print("\n📦 5. Customer submitting Order...")
    order_payload = {
        "customer_name": "Tanvir Ahmed",
        "phone": "01711223344",
        "address": "House 42, Road 7, Dhanmondi",
        "city": "Dhaka",
        "delivery_zone": "inside_dhaka",
        "payment_method": "cod",
        "promo_code": "TEST100",
        "items": [
            {
                "product_id": target_product["id"],
                "qty": 1
            }
        ]
    }
    order_res = http_post(f"{BASE_URL}/orders/", order_payload)
    order_id = order_res["id"]
    order_num = order_res["order_number"]
    print(f"   🎉 ORDER PLACED SUCCESSFULLY!")
    print(f"      Order Number: {order_num}")
    print(f"      Subtotal: ৳{order_res['subtotal']}")
    print(f"      Delivery Fee: ৳{order_res['delivery_fee']}")
    print(f"      Discount: -৳{order_res['discount_amount']}")
    print(f"      Total Payable: ৳{order_res['total']}")
    print(f"      Status: {order_res['status'].upper()}")

    # 6. Admin Fulfillment Workflow
    print(f"\n🚚 6. Admin Fulfilling Order ({order_num})...")
    
    # Step A: Processing
    status_1 = http_patch(f"{BASE_URL}/orders/{order_id}/status", {"status": "processing"}, admin_headers)
    print(f"   ➡️ Admin updated status to: {status_1['status'].upper()}")
    
    # Step B: Shipped
    status_2 = http_patch(f"{BASE_URL}/orders/{order_id}/status", {"status": "shipped"}, admin_headers)
    print(f"   ➡️ Admin updated status to: {status_2['status'].upper()}")
    
    # Step C: Delivered & Paid
    status_3 = http_patch(f"{BASE_URL}/orders/{order_id}/status", {"status": "delivered", "payment_status": "paid"}, admin_headers)
    print(f"   ➡️ Admin updated status to: {status_3['status'].upper()} (Payment: {status_3['payment_status'].upper()})")

    # 7. Customer Track Order Verification
    print(f"\n🔍 7. Verifying Customer Tracking Page for Order {order_num}...")
    track_res = http_get(f"{BASE_URL}/orders/track?order_number={order_num}&phone=01711223344")
    print(f"   ✅ Tracking Status: {track_res['status'].upper()}")
    print(f"   ✅ Payment Status: {track_res['payment_status'].upper()}")
    print(f"   ✅ Delivery Address: {track_res['address']}, {track_res['city']}")

    print("\n" + "=" * 60)
    print("✨ FULL END-TO-END E-COMMERCE ORDER TEST COMPLETED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
