from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0019_add_credit_work_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailysalesreport',
            name='approval_status',
            field=models.CharField(
                choices=[('draft', 'Draft'), ('pending_approval', 'Pending approval'), ('approved', 'Approved')],
                default='draft',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='dailysalesreport',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dailysalesreport',
            name='approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sales_reports_approved',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunSQL(
            sql=(
                "UPDATE services_dailysalesreport "
                "SET approval_status = CASE WHEN is_submitted = 1 THEN 'approved' ELSE 'draft' END"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
