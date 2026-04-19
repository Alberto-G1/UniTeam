from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ContactTicket, PublicAnnouncement
from .serializers import (
    ContactTicketCreateSerializer,
    ContactTicketPublicSerializer,
    PublicAnnouncementSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_submit_view(request):
    serializer = ContactTicketCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    ticket = serializer.save()

    support_email = getattr(settings, 'SUPPORT_CONTACT_EMAIL', None) or getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    subject = f"[UniTeam Contact] {ticket.reference}: {ticket.subject}"
    body = (
        f"Reference: {ticket.reference}\n"
        f"Name: {ticket.name}\n"
        f"Email: {ticket.email}\n"
        f"Type: {ticket.get_inquiry_type_display()}\n\n"
        f"Message:\n{ticket.message}\n"
    )

    if support_email:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', support_email),
            recipient_list=[support_email],
            fail_silently=True,
        )

    ack_subject = f"UniTeam Contact Received ({ticket.reference})"
    ack_body = (
        f"Hi {ticket.name},\n\n"
        f"Thanks for contacting UniTeam. We have received your message with reference {ticket.reference}.\n"
        f"Our team will get back to you as soon as possible.\n\n"
        f"Regards,\nUniTeam Support"
    )
    send_mail(
        subject=ack_subject,
        message=ack_body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', support_email or 'noreply@uniteam.local'),
        recipient_list=[ticket.email],
        fail_silently=True,
    )

    return Response(
        {
            'message': 'Contact request submitted successfully.',
            'ticket': ContactTicketPublicSerializer(ticket).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def news_list_view(request):
    queryset = PublicAnnouncement.objects.filter(is_published=True, published_at__lte=timezone.now())

    q = (request.query_params.get('q') or '').strip()
    if q:
        queryset = queryset.filter(title__icontains=q)

    serializer = PublicAnnouncementSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def news_detail_view(request, slug):
    item = PublicAnnouncement.objects.filter(
        slug=slug,
        is_published=True,
        published_at__lte=timezone.now(),
    ).first()

    if not item:
        return Response({'detail': 'News item not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PublicAnnouncementSerializer(item, context={'request': request})
    return Response(serializer.data)
