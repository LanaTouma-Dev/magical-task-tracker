from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Quest, PlayerStats
from .serializers import QuestSerializer, PlayerStatsSerializer

XP_BY_RARITY = {'common': 5, 'rare': 20, 'epic': 50, 'legendary': 100}


def xp_for_level(level):
    return 100 + level * 50


def get_or_create_stats():
    stats, _ = PlayerStats.objects.get_or_create(pk=1)
    return stats


def award_xp(stats, amount):
    stats.xp += amount
    while stats.xp >= xp_for_level(stats.level):
        stats.xp -= xp_for_level(stats.level)
        stats.level += 1
    today = timezone.now().date()
    if stats.last_active_date:
        from datetime import timedelta
        yesterday = today - timedelta(days=1)
        if stats.last_active_date == yesterday:
            stats.streak += 1
        elif stats.last_active_date < yesterday:
            stats.streak = 1
    else:
        stats.streak = 1
    stats.last_active_date = today
    stats.save()


class QuestViewSet(viewsets.ModelViewSet):
    queryset = Quest.objects.all()
    serializer_class = QuestSerializer

    def get_queryset(self):
        qs = Quest.objects.all()
        column = self.request.query_params.get('column')
        if column:
            qs = qs.filter(column=column)
        return qs

    def perform_create(self, serializer):
        rarity = serializer.validated_data.get('rarity', 'common')
        xp = XP_BY_RARITY.get(rarity, 5)
        # place new quest at top of its column
        max_order = Quest.objects.filter(
            column=serializer.validated_data.get('column', 'backlog')
        ).count()
        serializer.save(xp=xp, order=max_order)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_column = serializer.validated_data.get('column', instance.column)
        was_defeated = instance.column == 'defeated'
        now_defeated = new_column == 'defeated'

        if not was_defeated and now_defeated:
            serializer.save(completed_at=timezone.now())
            stats = get_or_create_stats()
            award_xp(stats, instance.xp)
        elif was_defeated and not now_defeated:
            serializer.save(completed_at=None)
        else:
            serializer.save()

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Accepts {column, ids: [id, ...]} and re-saves order."""
        column = request.data.get('column')
        ids = request.data.get('ids', [])
        for idx, quest_id in enumerate(ids):
            Quest.objects.filter(pk=quest_id, column=column).update(order=idx)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        quest = self.get_object()
        quest.pk = None
        quest.title = quest.title + ' (clone)'
        quest.column = 'backlog'
        quest.completed_at = None
        quest.save()
        return Response(QuestSerializer(quest).data, status=status.HTTP_201_CREATED)


class PlayerStatsViewSet(viewsets.ModelViewSet):
    queryset = PlayerStats.objects.all()
    serializer_class = PlayerStatsSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        stats = get_or_create_stats()
        return Response(PlayerStatsSerializer(stats).data)
