// <ezXSS extension>
// @name              Platform Info
// @description       Adds the user's platform information to the report
// @author            ssl
// @version           1.0
// </ezXSS extension>

function get_info() {
    try {
        return {
            "platform": window.navigator.platform,
            "language": window.navigator.language,
            "cookies-enabled": window.navigator.cookieEnabled,
            "do-not-track": window.navigator.doNotTrack,
            "vendor": window.navigator.vendor,
            "java-enabled": window.navigator.enabled,
            "screen-width": window.screen.width,
            "screen-height": window.screen.height,
            "permissions": navigator.permissions,
            "webgl-enabled": !!window.WebGLRenderingContext,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
    } catch (e) {
        return {
            "error": e.message,
        }
    }
}
ez_rD.extra = get_info();