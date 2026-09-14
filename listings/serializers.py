from rest_framework import serializers
from .models import Listing, BarterOffer
from users.serializers import UserSerializer

class ListingSerializer(serializers.ModelSerializer):
    # Shows the full seller details when reading, but allows sending seller UUID when creating
    seller_details = UserSerializer(source='seller', read_only=True)

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

    def validate(self, data):
        # A barter listing shouldn't require a price
        if data.get('transaction_type') == 'barter' and data.get('price') is not None:
            data['price'] = None
        # But sell or rent should have a price
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
