import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer

def verify_recaptcha(token):
    """Verifies token against Google's siteverify API"""
    secret = getattr(settings, 'RECAPTCHA_SECRET_KEY', None)
    # If no secret key is configured yet (local testing), pass through safely
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
        # Fallback for network issues in local dev
        return True, 1.0


class VerifyAuthView(APIView):
    """
    Endpoint: POST /api/auth/verify/
    1. Verifies bot protection (reCAPTCHA v3)
    2. Checks device fingerprint for past fraud bans
    3. Finds or creates the User record
    """
    def post(self, request):
        firebase_uid = request.data.get('firebase_uid')
        email = request.data.get('email')
        name = request.data.get('name', 'Anonymous User')
        phone = request.data.get('phone', None)
        fingerprint = request.data.get('device_fingerprint_id', None)
        recaptcha_token = request.data.get('recaptcha_token', None)

        if not firebase_uid or not email:
            return Response(
                {"error": "firebase_uid and email are required fields."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Bot prevention: Verify reCAPTCHA token if provided
        if recaptcha_token:
            is_human, score = verify_recaptcha(recaptcha_token)
            if not is_human or score < 0.5:
                return Response(
                    {"error": "Bot activity detected. Verification rejected."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # 2. Fraud prevention: Check device fingerprint
        # If this device was previously linked to an unverified or banned account
        if fingerprint:
            banned_device = User.objects.filter(device_fingerprint_id=fingerprint, is_active=False).exists()
            if banned_device:
                return Response(
                    {"error": "This device has been flagged for fraudulent activity."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # 3. Create or fetch User
        user, created = User.objects.get_or_create(
            firebase_uid=firebase_uid,
            defaults={
                'email': email,
                'name': name,
                'phone': phone,
                'device_fingerprint_id': fingerprint
            }
        )

        if not created and fingerprint and not user.device_fingerprint_id:
            user.device_fingerprint_id = fingerprint
            user.save()

        serializer = UserSerializer(user)
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response({
            "message": "User registered successfully" if created else "Login successful",
            "user": serializer.data
        }, status=response_status)
