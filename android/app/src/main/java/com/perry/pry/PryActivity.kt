package com.perry.pry

import android.app.Activity
import android.os.Bundle
import android.widget.FrameLayout
import com.perry.app.PerryBridge

class PryActivity : Activity() {

    private lateinit var rootLayout: FrameLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        rootLayout = FrameLayout(this)
        setContentView(rootLayout)

        PerryBridge.init(this, rootLayout)
        System.loadLibrary("pry")
        PerryBridge.nativeInit()

        // Run on UI thread — all Perry widget/callback state is thread-local,
        // and Android UI operations must happen on the UI thread.
        // App() returns immediately on Android (non-blocking).
        PerryBridge.nativeMain()
    }

    override fun onDestroy() {
        super.onDestroy()
        PerryBridge.nativeShutdown()
    }
}
