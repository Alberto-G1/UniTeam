from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import PublicPage
from .permissions import IsPublicFroAdmin
from .serializers import PublicPageSerializer, PublicPageWriteSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def public_page_list_view(request):
    queryset = PublicPage.objects.filter(is_published=True).prefetch_related('sections')
    serializer = PublicPageSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_page_detail_view(request, slug):
    page = get_object_or_404(PublicPage.objects.prefetch_related('sections'), slug=slug, is_published=True)
    serializer = PublicPageSerializer(page, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsPublicFroAdmin])
def admin_public_page_list_view(request):
    if request.method == 'GET':
        queryset = PublicPage.objects.all().prefetch_related('sections')
        serializer = PublicPageSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    serializer = PublicPageWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    page = serializer.save(updated_by=request.user)
    return Response(PublicPageSerializer(page, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsPublicFroAdmin])
def admin_public_page_detail_view(request, slug):
    page = get_object_or_404(PublicPage.objects.prefetch_related('sections'), slug=slug)

    if request.method == 'GET':
        return Response(PublicPageSerializer(page, context={'request': request}).data)

    if request.method == 'DELETE':
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = PublicPageWriteSerializer(page, data=request.data, partial=request.method == 'PATCH')
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    page = serializer.save(updated_by=request.user)
    return Response(PublicPageSerializer(page, context={'request': request}).data)
