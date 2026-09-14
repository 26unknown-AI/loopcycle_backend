import uuid
from django.db import models
from django.conf import settings

class Listing(models.Model):
    CATEGORY_CHOICES = [
        ('books', 'Books / Textbooks'),
        ('electronics', 'Electronics'),
        ('furniture', 'Furniture'),
        ('vehicles', 'Vehicles'),
    ]

    TRANSACTION_CHOICES = [
        ('sell', 'Sell'),
        ('rent', 'Rent'),
        ('barter', 'Barter'),
    ]

    CONDITION_CHOICES = [
        ('working', 'Working Condition'),
        ('broken', 'Broken / Needs Repair / E-Waste'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('sold', 'Sold'),
        ('rented', 'Rented'),
        ('removed', 'Removed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='working')
    photo_urls = models.JSONField(default=list, blank=True)  # Stores list of image URLs from Cloudinary/S3
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_transaction_type_display()}) - {self.status}"


class BarterOffer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='barter_offers')
    offering_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_barters')
    offered_item_description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Offer by {self.offering_user.name} on {self.listing.title}"
