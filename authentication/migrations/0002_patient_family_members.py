from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='family_members',
            field=models.ManyToManyField(blank=True, related_name='family_patients', to=settings.AUTH_USER_MODEL),
        ),
    ]
