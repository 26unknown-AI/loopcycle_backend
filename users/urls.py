from django.urls import path
from .views import VerifyAuthView

urlpatterns = [
    path('auth/verify/', VerifyAuthView.as_view(), name='auth-verify'),
]
