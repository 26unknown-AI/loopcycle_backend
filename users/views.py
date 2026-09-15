import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer

def verify_recaptcha(token):
    secret = getattr(settings, 'RECAPTCHA_SECRET_KEY', None)
    if not secret or secret == 'dummy_recaptcha_key':
        return True, 1.0

    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={'secret': secret, 'response': token},
            timeout=5
        )
        data = response.json()
        return data.get('success', False), data.get('score', 0.0)
    except Exception:
        return True, 1.0


class VerifyAuthView(APIView):
    """
    POST /api/auth/verify/
    Bulletproof auth: checks by email first to prevent duplicate key crashes.
    """
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        firebase_uid = request.data.get('firebase_uid', '').strip()
        name = request.data.get('name', 'Loop Member').strip()
        phone = request.data.get('phone', None)
        fingerprint = request.data.get('device_fingerprint_id', None)
        recaptcha_token = request.data.get('recaptcha_token', None)

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Bot check
        if recaptcha_token:
            is_human, score = verify_recaptcha(recaptcha_token)
            if not is_human or score < 0.5:
                return Response({"error": "Bot activity detected."}, status=status.HTTP_403_FORBIDDEN)

        # 2. Fraud device check
        if fingerprint:
            banned = User.objects.filter(device_fingerprint_id=fingerprint, is_active=False).exists()
            if banned:
                return Response({"error": "This device has been flagged."}, status=status.HTTP_403_FORBIDDEN)

        # 3. Find user by email first (prevents Postgres unique key crash!)
        user = User.objects.filter(email=email).first()

        if user:
            created = False
            # Update user if new info is provided
            if firebase_uid and user.firebase_uid.startswith('usr_') and not firebase_uid.startswith('usr_'):
                user.firebase_uid = firebase_uid
            if name and user.name == 'Anonymous User':
                user.name = name
            if fingerprint and not user.device_fingerprint_id:
                user.device_fingerprint_id = fingerprint
            user.save()
        else:
            # Create fresh user
            final_uid = firebase_uid or f"usr_{email[:8]}_{timezone_stub := 1}"
            user = User.objects.create(
                email=email,
                firebase_uid=final_uid,
                name=name or "Loop Member",
                phone=phone,
                device_fingerprint_id=fingerprint
            )
            created = True

        serializer = UserSerializer(user)
        return Response({
            "message": "User registered successfully" if created else "Login successful",
            "user": serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
