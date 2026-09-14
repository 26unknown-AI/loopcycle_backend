import uuid
from django.db import models
from django.conf import settings
from listings.models import Listing

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('held', 'Payment Held in Escrow'),
        ('released', 'Funds Released to Seller'),
        ('refunded', 'Refunded to Buyer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='transactions')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='purchases')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sales')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='held')
    escrow_reference_id = models.CharField(max_length=255, default="order_test_sandbox")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.id} - {self.payment_status} (₹{self.amount})"


class Dispute(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open / Under Investigation'),
        ('resolved', 'Resolved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='disputes')
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    evidence = models.JSONField(default=list, blank=True)  # List of URLs/details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispute on Tx {self.transaction.id} by {self.raised_by.name}"
