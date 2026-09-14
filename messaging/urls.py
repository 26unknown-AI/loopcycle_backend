from django.urls import path
from .views import SendMessageView, ListingMessageThreadView

urlpatterns = [
    path('messages/', SendMessageView.as_view(), name='send-message'),
    path('messages/<uuid:listing_id>/', ListingMessageThreadView.as_view(), name='message-thread'),
]
