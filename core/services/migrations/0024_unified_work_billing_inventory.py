from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def backfill_unified_fields(apps, schema_editor):
    JobCategory = apps.get_model('services', 'JobCategory')
    Material = apps.get_model('services', 'Material')
    Work = apps.get_model('services', 'Work')

    for category in JobCategory.objects.all().only('id', 'default_material_id', 'material_id'):
        if not category.material_id and category.default_material_id:
            category.material_id = category.default_material_id
            category.save(update_fields=['material'])

    Material.objects.filter(reorder_threshold=0).update(reorder_threshold=models.F('reorder_level'))
    Work.objects.filter(calculated_amount=0).update(
        calculated_amount=models.F('price'),
        net_amount=models.F('price'),
    )
    Work.objects.filter(material_used__isnull=True, material__isnull=False).update(
        material_used=models.F('material'),
    )
    Work.objects.filter(material_quantity__isnull=True, material_quantity_used__isnull=False).update(
        material_quantity=models.F('material_quantity_used'),
    )


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0023_work_material_and_category_default_material'),
    ]

    operations = [
        migrations.AlterField(
            model_name='work', name='material_quantity_used',
            field=models.FloatField(blank=True, null=True, help_text='Quantity deducted from material stock for this work'),
        ),
        migrations.AddField(
            model_name='jobcategory', name='unit_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='jobcategory', name='pricing_unit',
            field=models.CharField(choices=[('pages', 'Pages'), ('pieces', 'Pieces'), ('sq_ft', 'Square feet'), ('flat', 'Flat rate')], default='flat', max_length=10),
        ),
        migrations.AddField(
            model_name='jobcategory', name='material',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='categories', to='services.material'),
        ),
        migrations.AddField(
            model_name='material', name='base_unit',
            field=models.CharField(choices=[('sheets', 'Sheets'), ('sq_ft', 'Square feet'), ('pieces', 'Pieces'), ('liters', 'Liters')], default='pieces', max_length=10),
        ),
        migrations.AddField(
            model_name='material', name='bulk_unit_name',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='material', name='items_per_bulk_unit',
            field=models.FloatField(default=1),
        ),
        migrations.AddField(
            model_name='material', name='reorder_threshold',
            field=models.FloatField(default=0, help_text='Minimum stock level in base units before reorder alert'),
        ),
        migrations.AlterField(
            model_name='material', name='current_stock',
            field=models.FloatField(default=0, help_text='Current stock quantity in base units'),
        ),
        migrations.AlterField(
            model_name='material', name='reorder_level',
            field=models.FloatField(default=0, help_text='Legacy alias for reorder threshold'),
        ),
        migrations.AddField(
            model_name='work', name='material_used',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='material_used_works', to='services.material'),
        ),
        migrations.AddField(
            model_name='work', name='material_quantity',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='work', name='calculated_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='work', name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='work', name='net_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='work', name='due_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_unified_fields, migrations.RunPython.noop),
    ]
