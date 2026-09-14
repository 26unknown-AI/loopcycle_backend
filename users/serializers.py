from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """Converts User database records to JSON and vice-versa"""
    class Meta:
        model = User
        fields = [
            'id', 
            'firebase_uid', 
            'name', 
            'email', 
            'phone', 
            'trust_score', 
            'device_fingerprint_id', 
            'is_verified', 
            'created_at'
        ]
        read_only_fields = ['id', 'trust_score', 'created_at']
