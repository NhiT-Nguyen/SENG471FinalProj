# Generated manually for updating Medication model for prescriptions

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('medications', '0002_add_medication_refill_reminder_fields'),
        ('authentication', '0003_merge_20260407_1538'),
    ]

    operations = [
        migrations.RenameField(
            model_name='medication',
            old_name='schedule',
            new_name='frequency',
        ),
        migrations.RenameField(
            model_name='medication',
            old_name='instructions',
            new_name='administration_instructions',
        ),
        migrations.AlterField(
            model_name='medication',
            name='prescribed_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='authentication.healthcareprovider'),
        ),
        migrations.AddField(
            model_name='medication',
            name='prescribed_date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='medication',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('discontinued', 'Discontinued'), ('completed', 'Completed')], default='active', max_length=20),
        ),
    ]