from rest_framework import generics
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer

class SendMessageView(generics.CreateAPIView):
    """
    POST /api/messages/
    Send a message from buyer to seller (or vice-versa) regarding an item.
    """
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


class ListingMessageThreadView(generics.ListAPIView):
    """
    GET /api/messages/<listing_id>/
    Fetch the conversation thread for a specific listing.
    """
    serializer_class = MessageSerializer

    def get_queryset(self):
        listing_id = self.kwargs['listing_id']
        # Returns all messages exchanged for this listing ordered by timestamp
        return Message.objects.filter(listing_id=listing_id).order_by('timestamp')
