from rest_framework import serializers
from .models import Listing, BarterOffer
from users.serializers import UserSerializer

class ListingSerializer(serializers.ModelSerializer):
    seller_details = UserSerializer(source='seller', read_only=True)
    # Allow any condition string from frontend so it NEVER throws "not a valid choice"!
    condition = serializers.CharField(required=False, default='working')

    class Meta:
        model = Listing
        fields = [
            'id',
            'seller',
            'seller_details',
            'title',
            'description',
            'category',
            'transaction_type',
            'price',
            'condition',
            'photo_urls',
            'status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_condition(self, value):
        """Clean and sanitize any condition value sent from frontend"""
        v = str(value).lower()
        if 'broken' in v or 'waste' in v or 'repair' in v or 'used' in v:
            return 'broken'
        # Maps 'fair', 'good', 'like new', 'working' safely to 'working'
        return 'working'

    def validate(self, data):
        # Barter listings don't require price
        if data.get('transaction_type') == 'barter' and data.get('price') is not None:
            data['price'] = None
        # Sell or rent should have a price
        if data.get('transaction_type') in ['sell', 'rent'] and not data.get('price'):
            raise serializers.ValidationError({"price": "Price is required for sell or rent listings."})
        return data


class BarterOfferSerializer(serializers.ModelSerializer):
    offering_user_details = UserSerializer(source='offering_user', read_only=True)

    class Meta:
        model = BarterOffer
        fields = [
            'id',
            'listing',
            'offering_user',
            'offering_user_details',
            'offered_item_description',
            'status',
            'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']
