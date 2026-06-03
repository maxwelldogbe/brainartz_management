from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_alter_profile_phone'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='worker_role',
            field=models.CharField(
                choices=[
                    ('generalist', 'Generalist'),
                    ('operations', 'Operations (Works)'),
                    ('cashier', 'Cashier (Payments)'),
                    ('sales', 'Sales Reporting'),
                    ('inventory', 'Inventory'),
                    ('customer', 'Customer Relations'),
                ],
                default='generalist',
                help_text='Role used to scope worker feature access',
                max_length=32,
            ),
        ),
    ]
