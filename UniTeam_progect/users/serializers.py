from rest_framework import serializers
from .models import CustomUser, StudentProfile, LecturerProfile, AdminProfile
from taggit.serializers import TagListSerializerField, TaggitSerializer


class StudentProfileSerializer(TaggitSerializer, serializers.ModelSerializer):
    skills = TagListSerializerField()
    
    class Meta:
        model = StudentProfile
        fields = ['personal_email', 'university', 'department', 'course_name', 
                  'year_of_study', 'skills', 'bio']


class LecturerProfileSerializer(TaggitSerializer, serializers.ModelSerializer):
    courses_taught = TagListSerializerField()
    research_areas = TagListSerializerField()
    
    class Meta:
        model = LecturerProfile
        fields = ['department', 'courses_taught', 'office_location', 'research_areas']


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['role_title', 'responsibilities']


class UserSerializer(serializers.ModelSerializer):
    studentprofile = StudentProfileSerializer(read_only=True)
    lecturerprofile = LecturerProfileSerializer(read_only=True)
    adminprofile = AdminProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'role', 'avatar', 'is_approved', 'phone_number', 
                  'studentprofile', 'lecturerprofile', 'adminprofile']
        read_only_fields = ['id', 'is_approved']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'}, label='Confirm Password')
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'first_name', 
                  'last_name', 'role', 'phone_number']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data['role'],
            phone_number=validated_data.get('phone_number', ''),
        )
        # Profile is auto-created by signal
        return user


class StudentProfileUpdateSerializer(TaggitSerializer, serializers.ModelSerializer):
    skills = TagListSerializerField()
    
    class Meta:
        model = StudentProfile
        fields = ['personal_email', 'university', 'department', 'course_name', 
                  'year_of_study', 'skills', 'bio']


class LecturerProfileUpdateSerializer(TaggitSerializer, serializers.ModelSerializer):
    courses_taught = TagListSerializerField()
    research_areas = TagListSerializerField()
    
    class Meta:
        model = LecturerProfile
        fields = ['department', 'courses_taught', 'office_location', 'research_areas']
