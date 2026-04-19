from django.db import models


class Quest(models.Model):
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]
    COLUMN_CHOICES = [
        ('backlog', 'Backlog'),
        ('battle', 'In Battle'),
        ('defeated', 'Defeated'),
    ]

    title        = models.CharField(max_length=500)
    rarity       = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    column       = models.CharField(max_length=20, choices=COLUMN_CHOICES, default='backlog')
    tags         = models.JSONField(default=list, blank=True)
    due_date     = models.CharField(max_length=50, blank=True, default='')
    avatar       = models.CharField(max_length=10, blank=True, default='')
    xp           = models.IntegerField(default=5)
    order        = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f'[{self.rarity}] {self.title}'


class PlayerStats(models.Model):
    level            = models.IntegerField(default=1)
    xp               = models.IntegerField(default=0)
    streak           = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Player stats'

    def __str__(self):
        return f'Lv.{self.level} — {self.xp} XP'
