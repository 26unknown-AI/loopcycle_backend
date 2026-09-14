import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    """Helper class to manage creating users"""
    def create_user(self, email, firebase_uid, name, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        if not firebase_uid:
            raise ValueError("Users must have a Firebase UID.")
            
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            firebase_uid=firebase_uid,
            name=name,
            **extra_fields
        )
        user.save(using=self._db)
        return user

    def create_superuser(self, email, firebase_uid="admin_uid", name="Admin", **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, firebase_uid, name, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model for LoopCycle matching project brief"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firebase_uid = models.CharField(max_length=128, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    trust_score = models.IntegerField(default=0)
    device_fingerprint_id = models.CharField(max_length=255, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Required admin/system fields for Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    # We use email to log in / identify users
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return f"{self.name} ({self.email})"
