from rest_framework import serializers
from .models import Transaction, Dispute
from users.serializers import UserSerializer
from listings.serializers import ListingSerializer

class TransactionSerializer(serializers.ModelSerializer):
    buyer_details = UserSerializer(source='buyer', read_only=True)
    seller_details = UserSerializer(source='seller', read_only=True)
    listing_details = ListingSerializer(source='listing', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'listing',
            'listing_details',
            'buyer',
            'buyer_details',
            'seller',
            'seller_details',
            'amount',
            'payment_status',
            'escrow_reference_id',
            'created_at'
        ]
        read_only_fields = ['id', 'payment_status', 'created_at']


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_details = UserSerializer(source='raised_by', read_only=True)

    class Meta:
        model = Dispute
        fields = [
            'id',
            'transaction',
            'raised_by',
            'raised_by_details',
            'reason',
            'evidence',
            'status',
            'resolved_at',
            'created_at'
        ]
        read_only_fields = ['id', 'status', 'resolved_at', 'created_at']
