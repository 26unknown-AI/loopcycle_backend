from django.urls import path
from .views import (
    InitiateTransactionView, 
    ConfirmReceiptView, 
    RaiseDisputeView,
    RazorpayWebhookView  # Added
)

urlpatterns = [
    path('transactions/', InitiateTransactionView.as_view(), name='transaction-initiate'),
    path('transactions/<uuid:pk>/confirm/', ConfirmReceiptView.as_view(), name='transaction-confirm'),
    path('transactions/<uuid:pk>/dispute/', RaiseDisputeView.as_view(), name='transaction-dispute'),
    path('webhooks/razorpay/', RazorpayWebhookView.as_view(), name='razorpay-webhook'), # Added
]
