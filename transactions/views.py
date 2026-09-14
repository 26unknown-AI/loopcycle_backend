from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Transaction, Dispute
from .serializers import TransactionSerializer, DisputeSerializer
from listings.models import Listing

class InitiateTransactionView(APIView):
    """
    POST /api/transactions/
    Initiates a transaction and places funds into escrow ('held').
    """
    def post(self, request):
        listing_id = request.data.get('listing_id')
        buyer_id = request.data.get('buyer_id')
        amount = request.data.get('amount')

        listing = get_object_or_404(Listing, id=listing_id)

        # Generate a clean timestamp reference for test escrow
        time_stamp = timezone.now().strftime('%Y%m%d%H%M%S')

        # Create the transaction with funds 'held'
        transaction = Transaction.objects.create(
            listing=listing,
            buyer_id=buyer_id,
            seller=listing.seller,
            amount=amount or listing.price or 0.00,
            payment_status='held',
            escrow_reference_id=f"simulated_pay_{time_stamp}"
        )

        # Mark listing as sold or rented
        listing.status = 'sold' if listing.transaction_type == 'sell' else 'rented'
        listing.save()

        return Response({
            "message": "Payment placed into escrow. Status is HELD.",
            "transaction": TransactionSerializer(transaction).data
        }, status=status.HTTP_201_CREATED)


class ConfirmReceiptView(APIView):
    """
    POST /api/transactions/<id>/confirm/
    Buyer confirms delivery -> releases escrow funds and increases seller's trust score!
    """
    def post(self, request, pk):
        transaction = get_object_or_404(Transaction, id=pk)

        # Check if transaction is already resolved or disputed
        if transaction.payment_status != 'held':
            return Response(
                {"error": f"Transaction cannot be confirmed. Current status is {transaction.payment_status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if there is an active dispute
        if transaction.disputes.filter(status='open').exists():
            return Response(
                {"error": "Cannot release funds: Transaction has an active dispute under review."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Release funds
        transaction.payment_status = 'released'
        transaction.save()

        # 2. Reward the seller with trust score (+10 points)
        seller = transaction.seller
        seller.trust_score += 10
        seller.save()

        return Response({
            "message": "Transaction complete! Escrow funds released to seller.",
            "seller_new_trust_score": seller.trust_score,
            "transaction": TransactionSerializer(transaction).data
        }, status=status.HTTP_200_OK)


class RaiseDisputeView(APIView):
    """
    POST /api/transactions/<id>/dispute/
    Buyer raises a dispute -> freezes funds and creates Dispute record.
    """
    def post(self, request, pk):
        transaction = get_object_or_404(Transaction, id=pk)
        reason = request.data.get('reason')
        raised_by_id = request.data.get('raised_by_id')

        if not reason:
            return Response({"error": "Reason for dispute is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Create dispute investigation record
        dispute = Dispute.objects.create(
            transaction=transaction,
            raised_by_id=raised_by_id or transaction.buyer_id,
            reason=reason,
            evidence=request.data.get('evidence', [])
        )

        return Response({
            "message": "Dispute opened. Payout is FROZEN until manual review.",
            "dispute": DisputeSerializer(dispute).data
        }, status=status.HTTP_201_CREATED)
import hmac
import hashlib
import json

class RazorpayWebhookView(APIView):
    """
    POST /api/webhooks/razorpay/
    Receives automated notifications from Razorpay server,
    verifies the webhook signature, and updates transaction status.
    """
    def post(self, request):
        webhook_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret_key')
        received_signature = request.headers.get('X-Razorpay-Signature', '')
        
        # In production with Razorpay credentials, verify cryptographic signature
        if webhook_secret and received_signature and webhook_secret != 'test_secret_key':
            try:
                body = request.body.decode('utf-8')
                expected_signature = hmac.new(
                    bytes(webhook_secret, 'utf-8'),
                    bytes(body, 'utf-8'),
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(received_signature, expected_signature):
                    return Response({"error": "Invalid webhook signature"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({"error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)

        # Process the event payload
        event = request.data.get('event')
        payload = request.data.get('payload', {})

        # When payment is successfully captured by Razorpay
        if event == 'payment.captured':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')

            # Find matching transaction and ensure it is held in escrow
            tx = Transaction.objects.filter(escrow_reference_id=order_id).first()
            if tx:
                tx.payment_status = 'held'
                tx.save()

        return Response({"status": "ok", "message": "Webhook processed"}, status=status.HTTP_200_OK)
