import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='medication',
            name='prescribed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='prescribed_medications', to='auth.user'),
        ),
        migrations.AddField(
            model_name='medication',
            name='instructions',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='medication',
            name='reminder_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='medication',
            name='reminder_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='medication',
            name='reminder_days',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='medication',
            name='refill_reminder_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='medication',
            name='refill_reminder_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='medication',
            name='refill_reminder_days_before',
            field=models.PositiveIntegerField(default=7),
        ),
    ]
