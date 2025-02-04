# Generated by Django 5.1.5 on 2025-02-04 00:04

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="UserPreference",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.CharField(max_length=255, unique=True)),
                (
                    "preferred_transport",
                    models.CharField(
                        choices=[
                            ("bus", "Bus"),
                            ("train", "Train"),
                            ("bike", "Bike"),
                            ("car", "Car"),
                        ],
                        max_length=50,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SavedRoute",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("start_location", models.CharField(max_length=255)),
                ("end_location", models.CharField(max_length=255)),
                ("departure_time", models.DateTimeField()),
                ("preferred_mode", models.CharField(max_length=50)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.userpreference",
                    ),
                ),
            ],
        ),
    ]
