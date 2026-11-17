// <ezXSS extension>
// @name              Platform Info
// @description       Collects basic browser and system information
// @author            ssl
// @version           2.0
// </ezXSS extension>

function get_info() {
    try {
        return {
            "platform": navigator.platform,
            "language": navigator.language,
            "cookies-enabled": navigator.cookieEnabled,
            "do-not-track": navigator.doNotTrack,
            "vendor": navigator.vendor,
            "screen-width": screen.width,
            "screen-height": screen.height,
            "webgl-enabled": !!window.WebGLRenderingContext,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
            "hardware-concurrency": navigator.hardwareConcurrency || "unknown"
        };
    } catch (e) {
        return { "error": e.message };
    }
}
ez_a(get_info());