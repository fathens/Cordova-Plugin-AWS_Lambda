package org.fathens.cordova.plugin.aws

import android.content.pm.PackageManager.GET_META_DATA
import android.os.Bundle
import com.amazonaws.auth.CognitoCachingCredentialsProvider
import com.amazonaws.regions.Regions
import com.amazonaws.services.lambda.AWSLambdaClient
import com.amazonaws.services.lambda.model.InvokeRequest
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject
import java.nio.ByteBuffer

public class AwsLambda : CordovaPlugin() {
    private class PluginContext(val holder: AwsLambda, val action: String, val callback: CallbackContext) {
        fun error(msg: String?) = callback.error(msg)
        fun success(msg: String? = null) = callback.success(msg)
        fun success(v: Boolean) = callback.sendPluginResult(PluginResult(PluginResult.Status.OK, v))
        fun success(m: Map<*, *>) = callback.success(JSONObject(m))
        fun success(list: List<*>) = callback.success(JSONArray(list))
        fun success(obj: JSONObject) = callback.success(obj)
    }

    private var context: PluginContext? = null

    private val metaData: Bundle by lazy {
        cordova.activity.packageManager.getApplicationInfo(cordova.activity.packageName, GET_META_DATA).metaData
    }

    private val credentialProvider: CognitoCachingCredentialsProvider by lazy {
        CognitoCachingCredentialsProvider(
                cordova.activity.applicationContext,
                metaData.getString("org.fathens.aws.cognito.identityPool"),
                Regions.fromName(metaData.getString("org.fathens.aws.region")))
    }

    override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext): Boolean {
        try {
            val method = javaClass.getMethod(action, args.javaClass)
            if (method != null) {
                cordova.threadPool.execute {
                    context = PluginContext(this, action, callbackContext)
                    try {
                        method.invoke(this, args)
                    } catch (ex: Exception) {
                        context?.error(ex.message)
                    }
                }
                return true
            } else {
                return false
            }
        } catch (e: NoSuchMethodException) {
            return false
        }
    }

    // plugin commands

    fun invoke(args: JSONArray) {
        val funcName = args.getString(0)
        val payload = args.getString(1)

        val names = funcName.split(':')

        val req = InvokeRequest().withFunctionName(names[0])
        req.payload = ByteBuffer.wrap(payload.toByteArray())
        if (names.size > 1) req.qualifier = names[1]

        val lambda = AWSLambdaClient(credentialProvider)
        val res = lambda.invoke(req)
        if (res.statusCode % 100 != 2) {
            context?.error("Http error: ${res.statusCode}")
        } else {
            if (res.functionError != null) {
                context?.error(res.functionError)
            } else {
                val buf = res.payload
                val json = String(buf.array())
                context?.success(JSONObject(json))
            }
        }
    }
}
