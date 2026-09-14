from rest_framework import serializers
from .models import Message
from users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    receiver_details = UserSerializer(source='receiver', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'listing',
            'sender',
            'sender_details',
            'receiver',
            'receiver_details',
            'content',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
