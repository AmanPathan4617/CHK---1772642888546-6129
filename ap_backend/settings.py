import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
def _load_dotenv_if_present() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k:
                os.environ.setdefault(k, v)
    except Exception:
        return


_load_dotenv_if_present()

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = True
ALLOWED_HOSTS = ["192.168.60.15", "localhost", "127.0.0.1"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "ap_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]


#Backend Configuration SQL Lite By deafault

WSGI_APPLICATION = "ap_backend.wsgi.application"
ASGI_APPLICATION = "ap_backend.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Session Configuration for OAuth
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 86400  # 24 hours



REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}


# Car Damage Detection API credentials

DAMAGE_API_KEY = os.environ.get("DAMAGE_API_KEY", "qJ6vVQBaalUpdl9LyuZJ8KjYHpZjkf1f")
DAMAGE_API_SECRET = os.environ.get("DAMAGE_API_SECRET", "")

DAMAGE_API_URL = os.environ.get("DAMAGE_API_URL", "")

#  Chatbot / Gemini API Key 

#GOOGLE_API_KEY = "AIzaSyDPd1wgX3vDMZN54pzfhD8UUIR8yAMtUm8"
#GOOGLE_API_KEY = "AIzaSyCzTN7YFxhvSwWEEYifLj_w7GRAtQcS9gY"
GOOGLE_API_KEY = 'AIzaSyD6y7FM2-gHqfHKH9RwQPrG4PwvDwKw2GE'

# --- Google OAuth2 for Login ---
# Get these from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
GOOGLE_OAUTH_CLIENT_ID = "518926046788-2djbpaougbh6m1rj8vbu8a4s5tt5gn44.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET = "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"
# Redirect URI registered in Google Cloud Console must match this (or the env var override)
GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:8000/api/auth/google/callback/"

# Chatbot behavior flags

CHATBOT_FORCE_GEMINI = os.environ.get("CHATBOT_FORCE_GEMINI", "1").lower() in {"1", "true", "yes", "on"}
CHATBOT_DISABLE_LOCAL = os.environ.get("CHATBOT_DISABLE_LOCAL", "1").lower() in {"1", "true", "yes", "on"}

#  Car Price Prediction API 

PRICE_API_KEY = os.environ.get("PRICE_API_KEY", "9620|M86mcpT7xpQNl78gVtdxLiM0lnXwLAQONtKIMV1H")

PRICE_API_URL = os.environ.get("PRICE_API_URL", "")

# Media (uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Email Configuration for E-Bill System
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'girishpawar1512@gmail.com'
EMAIL_HOST_PASSWORD = 'pclo lqhj nwmo csui'
DEFAULT_FROM_EMAIL = 'AutoPro Elite <girishpawar1512@gmail.com>'
SERVER_EMAIL = 'girishpawar1512@gmail.com'

# Email settings for e-bill system
EBILL_FROM_EMAIL = 'AutoPro Elite <girishpawar1512@gmail.com>'
EBILL_REPLY_TO_EMAIL = 'support@autoproelite.com'

