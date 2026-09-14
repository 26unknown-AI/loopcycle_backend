from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Listing, BarterOffer
from .serializers import ListingSerializer, BarterOfferSerializer

class ListingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/listings/ -> List all active listings (supports ?category=books&transaction_type=barter)
    POST /api/listings/ -> Create a new listing
    """
    serializer_class = ListingSerializer

    def get_queryset(self):
        queryset = Listing.objects.filter(status='active').order_by('-created_at')
        
        category = self.request.query_params.get('category')
        transaction_type = self.request.query_params.get('transaction_type')

        if category:
            queryset = queryset.filter(category=category)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        return queryset


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/listings/<id>/ -> View one listing
    PATCH  /api/listings/<id>/ -> Update listing
    DELETE /api/listings/<id>/ -> Delete listing
    """
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer


class BarterOfferCreateView(generics.CreateAPIView):
    """
    POST /api/barter-offers/ -> Make a barter trade offer
    """
    queryset = BarterOffer.objects.all()
    serializer_class = BarterOfferSerializer


class BarterOfferUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/barter-offers/<id>/ -> Accept or Reject a barter offer
    """
    queryset = BarterOffer.objects.all()
    serializer_class = BarterOfferSerializer

    def patch(self, request, *args, **kwargs):
        offer = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['accepted', 'rejected']:
            return Response({"error": "Status must be 'accepted' or 'rejected'"}, status=status.HTTP_400_BAD_REQUEST)

        offer.status = new_status
        offer.save()

        if new_status == 'accepted':
            listing = offer.listing
            listing.status = 'sold'
            listing.save()

        return Response(BarterOfferSerializer(offer).data)


class EWasteCollectionCentersView(APIView):
    """
    GET /api/e-waste-centers/?city=Bengaluru
    Returns authorized collection points for broken items under SDG 12.
    """
    COLLECTION_CENTERS = [
        {
            "id": 1,
            "name": "Karo Sambhav E-Waste Collection Hub",
            "city": "Bengaluru",
            "address": "Indiranagar 100ft Road, Bengaluru, Karnataka",
            "contact": "+91-80-45678901",
            "accepted_items": ["Laptops", "Mobiles", "Cables", "Appliances"],
            "type": "Authorized E-Waste Recycler (CPCB Registered)"
        },
        {
            "id": 2,
            "name": "Saahas Zero Waste Center",
            "city": "Bengaluru",
            "address": "Electronic City Phase 1, Bengaluru, Karnataka",
            "contact": "+91-80-23456789",
            "accepted_items": ["Electronics", "Batteries", "Plastic casing"],
            "type": "Community E-Waste Drop Point"
        },
        {
            "id": 3,
            "name": "Eco-Birdd Recycling Facility",
            "city": "Delhi NCR",
            "address": "Okhla Industrial Area Phase II, New Delhi",
            "contact": "+91-11-26987123",
            "accepted_items": ["Computers", "Printers", "Monitors", "Circuit Boards"],
            "type": "CPCB Authorized Dismantler"
        },
        {
            "id": 4,
            "name": "Green Gene Enviro Protection",
            "city": "Mumbai",
            "address": "MIDC Andheri East, Mumbai, Maharashtra",
            "contact": "+91-22-28345670",
            "accepted_items": ["All Electronics", "Home Appliances"],
            "type": "Authorized E-Waste Collection Facility"
        },
        {
            "id": 5,
            "name": "Mahindra MSTC Recycling (RVSF)",
            "city": "Pune",
            "address": "Chakan MIDC Industrial Area, Pune, Maharashtra",
            "contact": "+91-20-66778899",
            "accepted_items": ["Two-wheelers", "Vehicles", "Metal Parts"],
            "type": "Registered Vehicle Scrapping Facility (RVSF)"
        }
    ]

    def get(self, request):
        city = request.query_params.get('city')
        if city:
            filtered = [
                c for c in self.COLLECTION_CENTERS 
                if c['city'].lower() == city.strip().lower()
            ]
            return Response({"city": city, "centers": filtered}, status=status.HTTP_200_OK)

        return Response({"total_centers": len(self.COLLECTION_CENTERS), "centers": self.COLLECTION_CENTERS}, status=status.HTTP_200_OK)
