# services/permissions.py

from rest_framework import permissions

class IsAuthenticatedOrAdminDelete(permissions.BasePermission):
    """
    Allow authenticated users to view/add/edit, but only admins can delete.
    """

    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return request.user and request.user.is_authenticated and request.user.is_staff
        return request.user and request.user.is_authenticated


class IsAdminOrReadCreate(permissions.BasePermission):
    """Allow list/retrieve/create for authenticated users; only admins can update/delete."""

    def has_permission(self, request, view):
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user and request.user.is_authenticated and request.user.is_staff
        # Allow authenticated users for other methods
        return request.user and request.user.is_authenticated


class IsOwnerOrAdminForUnsafeMethods(permissions.BasePermission):
    """Allow safe methods for authenticated users. For unsafe methods:
    - PUT/PATCH allowed if request.user is the owner (object.worker or object.processed_by)
    - DELETE allowed only for admins
    """

    def has_permission(self, request, view):
        # allow authenticated users to list/create
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # safe methods allowed
        if request.method in permissions.SAFE_METHODS:
            return True

        # delete only admins
        if request.method == 'DELETE':
            return request.user.is_staff

        # For updates, allow if user is owner: either obj.worker or obj.processed_by
        user = request.user
        # Work objects have `worker`
        if hasattr(obj, 'worker') and obj.worker is not None:
            return obj.worker == user or user.is_staff

        # Payment objects have `processed_by`
        if hasattr(obj, 'processed_by') and obj.processed_by is not None:
            return obj.processed_by == user or user.is_staff

        # Customer objects may have `creator`
        if hasattr(obj, 'creator') and obj.creator is not None:
            return obj.creator == user or user.is_staff

        # Fallback: only admins can modify
        return user.is_staff
