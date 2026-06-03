from django.db import migrations, models


def copy_worker_role_to_worker_roles(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    for user in User.objects.filter(is_worker=True):
        role = user.worker_role or 'generalist'
        user.worker_roles = [role]
        user.save(update_fields=['worker_roles'])


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0006_user_worker_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='worker_roles',
            field=models.JSONField(blank=True, default=list, help_text='List of worker roles for multi-role assignment'),
        ),
        migrations.RunPython(copy_worker_role_to_worker_roles, migrations.RunPython.noop),
    ]
