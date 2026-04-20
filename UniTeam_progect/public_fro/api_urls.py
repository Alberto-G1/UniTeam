from django.urls import path

from .api_views import (
    admin_public_page_detail_view,
    admin_public_page_list_view,
    public_page_detail_view,
    public_page_list_view,
)

urlpatterns = [
    path('pages/', public_page_list_view, name='public_fro_page_list'),
    path('pages/<slug:slug>/', public_page_detail_view, name='public_fro_page_detail'),
    path('admin/pages/', admin_public_page_list_view, name='public_fro_admin_page_list'),
    path('admin/pages/<slug:slug>/', admin_public_page_detail_view, name='public_fro_admin_page_detail'),
]
