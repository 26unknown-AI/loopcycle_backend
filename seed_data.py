import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loopcycle.settings')
django.setup()

from users.models import User
from listings.models import Listing

# 1. Create demo users
users_data = [
    {"email": "rohan.eng@college.edu", "name": "Rohan Sharma", "uid": "demo_rohan", "trust": 15},
    {"email": "ananya.tech@college.edu", "name": "Ananya Sen", "uid": "demo_ananya", "trust": 30},
    {"email": "vikram.design@college.edu", "name": "Vikram Rao", "uid": "demo_vikram", "trust": 50},
    {"email": "priya.patel@college.edu", "name": "Priya Patel", "uid": "demo_priya", "trust": 25},
]

created_users = {}
for u in users_data:
    user, _ = User.objects.get_or_create(
        email=u["email"],
        defaults={"name": u["name"], "firebase_uid": u["uid"], "trust_score": u["trust"], "is_verified": True}
    )
    created_users[u["name"]] = user

# 2. Create marketplace listings
demo_listings = [
    {
        "seller": created_users["Rohan Sharma"],
        "title": "Engineering Mathematics (Vol 1 & 2)",
        "description": "Semester 1 textbooks in great condition. Willing to barter for Data Structures book.",
        "category": "books",
        "transaction_type": "barter",
        "condition": "working",
        "price": None
    },
    {
        "seller": created_users["Ananya Sen"],
        "title": "Lenovo ThinkPad T480 (Motherboard issue)",
        "description": "Screen and RAM intact, motherboard dead. Ideal for spare parts or authorized e-waste recycling.",
        "category": "electronics",
        "transaction_type": "sell",
        "condition": "broken",
        "price": 3200.00
    },
    {
        "seller": created_users["Vikram Rao"],
        "title": "Ergonomic Study Table & Chair",
        "description": "Sturdy wooden study desk with adjustable mesh chair. Moving out of hostel.",
        "category": "furniture",
        "transaction_type": "sell",
        "condition": "working",
        "price": 1800.00
    },
    {
        "seller": created_users["Priya Patel"],
        "title": "Hercules 21-Speed Mountain Bicycle",
        "description": "Campus cycle in smooth riding condition. Available for monthly rental.",
        "category": "vehicles",
        "transaction_type": "rent",
        "condition": "working",
        "price": 250.00
    }
]

for l in demo_listings:
    Listing.objects.get_or_create(
        title=l["title"],
        seller=l["seller"],
        defaults=l
    )

print("✅ SUCCESS: 4 Demo Users and Marketplace Listings created successfully!")
