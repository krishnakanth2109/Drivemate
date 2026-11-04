# Add project specific ProGuard rules here.
# https://developer.android.com/studio/build/shrink-code

# React Native / Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

# Reanimated / Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.common.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class expo.modules.interfaces.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-dontwarn com.google.firebase.**

# ML Kit face detection (D2D visit photos)
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_** { *; }
-dontwarn com.google.mlkit.**

# react-native-pdf / pdfium
-keep class com.github.barteksc.** { *; }
-keep class com.shockwave.** { *; }

# Image pickers / crop
-keep class com.reactnative.ivpusic.imagepicker.** { *; }
-keep class com.imagepicker.** { *; }

# MMKV / Nitro
-keep class com.tencent.mmkv.** { *; }
-keep class com.margelo.nitro.** { *; }

# Video players
-keep class com.brentvatne.react.** { *; }
-keep class org.videolan.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# OkHttp / Retrofit style reflection used by RN networking
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Keep line numbers for crash reports (optional, small)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
