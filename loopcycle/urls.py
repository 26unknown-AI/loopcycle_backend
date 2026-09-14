from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # All REST API endpoints
    path('api/', include('users.urls')),
    path('api/', include('listings.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('messaging.urls')),

    # Load your frontend directly at http://127.0.0.1:8000/
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

# Serve CSS and JS files cleanly
urlpatterns += static('/', document_root=settings.BASE_DIR / 'frontend')
