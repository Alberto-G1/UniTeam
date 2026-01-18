from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, StudentProfile, LecturerProfile, AdminProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    StudentProfileUpdateSerializer, LecturerProfileUpdateSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login with username/email and password"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide both username/email and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Custom backend handles both username and email
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    
    return Response(
        {'error': 'Invalid credentials or account not approved'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for users
    Admin-only for list/create/update/delete
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Only admins can manage users (except reading own profile)
        if self.action in ['list', 'create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def approve_lecturer(self, request, pk=None):
        """Approve a lecturer account (admin only)"""
        if request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'Only admins can approve lecturers'},
                          status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        if user.role != CustomUser.Role.LECTURER:
            return Response({'error': 'User is not a lecturer'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        user.is_approved = True
        user.save()
        
        return Response({'message': 'Lecturer approved successfully'})


class StudentProfileViewSet(viewsets.ModelViewSet):
    """API endpoint for student profiles"""
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Students can only see their own profile
        if self.request.user.role == CustomUser.Role.STUDENT:
            return StudentProfile.objects.filter(user=self.request.user)
        # Admins and lecturers can see all
        return StudentProfile.objects.all()


class LecturerProfileViewSet(viewsets.ModelViewSet):
    """API endpoint for lecturer profiles"""
    queryset = LecturerProfile.objects.all()
    serializer_class = LecturerProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Lecturers can only see their own profile
        if self.request.user.role == CustomUser.Role.LECTURER:
            return LecturerProfile.objects.filter(user=self.request.user)
        # Admins and students can see all
        return LecturerProfile.objects.all()
