from rest_framework import serializers

from .models import PublicPage, PublicPageSection


class PublicPageSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicPageSection
        fields = ['id', 'title', 'body', 'order', 'is_visible']


class PublicPageSerializer(serializers.ModelSerializer):
    sections = PublicPageSectionSerializer(many=True, read_only=True)
    hero_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PublicPage
        fields = [
            'id',
            'slug',
            'title',
            'meta_title',
            'meta_description',
            'hero_title',
            'hero_subtitle',
            'body',
            'cta_label',
            'cta_url',
            'hero_image_url',
            'is_published',
            'sections',
            'updated_at',
        ]

    def get_hero_image_url(self, obj):
        if not obj.hero_image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.hero_image.url) if request else obj.hero_image.url


class PublicPageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicPage
        fields = [
            'slug',
            'title',
            'meta_title',
            'meta_description',
            'hero_title',
            'hero_subtitle',
            'body',
            'cta_label',
            'cta_url',
            'hero_image',
            'is_published',
            'updated_by',
        ]
        extra_kwargs = {
            'updated_by': {'required': False},
        }
