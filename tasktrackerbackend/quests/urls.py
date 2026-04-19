from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuestViewSet, PlayerStatsViewSet

router = DefaultRouter()
router.register(r'quests', QuestViewSet)
router.register(r'stats', PlayerStatsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
