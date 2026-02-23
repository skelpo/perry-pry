# Perry JNI bridge — all methods called from native code
-keep class com.perry.app.PerryBridge { *; }

# Activity referenced in manifest
-keep class com.perry.pry.PryActivity { *; }

# Preserve all native method declarations
-keepclasseswithmembernames class * { native <methods>; }
