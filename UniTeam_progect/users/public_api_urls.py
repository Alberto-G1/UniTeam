from django.urls import path

from .public_api_views import contact_submit_view, news_list_view, news_detail_view

urlpatterns = [
    path('contact/', contact_submit_view, name='public_contact_submit'),
    path('news/', news_list_view, name='public_news_list'),
    path('news/<slug:slug>/', news_detail_view, name='public_news_detail'),
]
