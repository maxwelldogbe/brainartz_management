from django.contrib import admin
from .models import *


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ('username', 'email', 'is_worker', 'worker_role', 'is_admin')
	list_filter = ('is_worker', 'worker_role', 'is_admin')


admin.site.register(InvitationToken)
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'phone', 'created_at')
