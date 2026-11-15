# Room
-keep class androidx.room.** { *; }

# Firebase / Firestore model classes are kept because sync models are serialized by reflection
-keepclassmembers class com.fixibleit.onedesk.data.** {
    <init>(...);
    <fields>;
}

# Hilt
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager { *; }
