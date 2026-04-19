from rest_framework import serializers
from .models import Quest, PlayerStats


class QuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quest
        fields = '__all__'
        read_only_fields = ('created_at',)


class PlayerStatsSerializer(serializers.ModelSerializer):
    xp_needed = serializers.SerializerMethodField()

    class Meta:
        model = PlayerStats
        fields = '__all__'

    def get_xp_needed(self, obj):
        return 100 + obj.level * 50
