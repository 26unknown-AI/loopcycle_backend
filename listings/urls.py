from django.urls import path
from .views import (
    ListingListCreateView,
    ListingDetailView,
    BarterOfferCreateView,
    BarterOfferUpdateView,
    EWasteCollectionCentersView
)

urlpatterns = [
    path('listings/', ListingListCreateView.as_view(), name='listing-list-create'),
    path('listings/<uuid:pk>/', ListingDetailView.as_view(), name='listing-detail'),
    path('barter-offers/', BarterOfferCreateView.as_view(), name='barter-create'),
    path('barter-offers/<uuid:pk>/', BarterOfferUpdateView.as_view(), name='barter-update'),
    path('e-waste-centers/', EWasteCollectionCentersView.as_view(), name='e-waste-centers'),
]
