plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android {
    namespace = "com.airconnect.mesh"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.airconnect.mesh"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-alpha1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildFeatures { buildConfig = true }
    buildTypes { release { isMinifyEnabled = true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro") } }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-service:2.8.7")
    testImplementation("junit:junit:4.13.2")
}
