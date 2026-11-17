// <ezXSS extension>
// @name              Enhanced Platform Info
// @description       System and browser platform info with fingerprinting
// @author            ssl
// @version           2.0
// </ezXSS extension>

function getEnhancedInfo() {
    try {
        var info = {
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages || [],
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            vendor: navigator.vendor,

            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: screen.orientation ? screen.orientation.type : "unknown"
            },

            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            },

            capabilities: {
                webgl: !!window.WebGLRenderingContext,
                webgl2: !!window.WebGL2RenderingContext,
                webrtc: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
                geolocation: !!navigator.geolocation,
                notifications: !!window.Notification,
                serviceWorker: !!navigator.serviceWorker,
                webAssembly: !!window.WebAssembly,
                webSocket: !!window.WebSocket,
                fetch: !!window.fetch,
                crypto: !!(window.crypto && window.crypto.subtle)
            },

            timezone: {
                name: Intl.DateTimeFormat().resolvedOptions().timeZone,
                offset: new Date().getTimezoneOffset(),
                locale: Intl.DateTimeFormat().resolvedOptions().locale
            },

            hardware: {
                concurrency: navigator.hardwareConcurrency || "unknown",
                memory: navigator.deviceMemory || "unknown",
                maxTouchPoints: navigator.maxTouchPoints || 0,
                connection: getConnectionInfo()
            },

            browser: detectBrowser(),
            webglFingerprint: getWebGLFingerprint(),
            canvasFingerprint: getCanvasFingerprint(),
            fonts: detectFonts()
        };

        return info;
    } catch (e) {
        return { error: e.message };
    }
}

function getConnectionInfo() {
    try {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (c) {
            return {
                effectiveType: c.effectiveType,
                downlink: c.downlink,
                rtt: c.rtt,
                saveData: c.saveData
            };
        }
        return "not available";
    } catch (e) {
        return "error: " + e.message;
    }
}

function detectBrowser() {
    var ua = navigator.userAgent;
    var browsers = {
        chrome: /Chrome\/(\d+)/.exec(ua),
        firefox: /Firefox\/(\d+)/.exec(ua),
        safari: /Safari\/(\d+)/.exec(ua),
        edge: /Edg\/(\d+)/.exec(ua),
        opera: /OPR\/(\d+)/.exec(ua)
    };

    var detected = {};
    for (var name in browsers) {
        if (browsers[name]) {
            detected.name = name;
            detected.version = browsers[name][1];
        }
    }
    detected.userAgent = ua;
    return detected;
}

function getWebGLFingerprint() {
    try {
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return "not supported";

        var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "not available",
            unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "not available",
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
        };
    } catch (e) {
        return "error: " + e.message;
    }
}

function getCanvasFingerprint() {
    try {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("fp", 2, 2);
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(10, 10, 50, 50);
        return hashCode(canvas.toDataURL());
    } catch (e) {
        return "error: " + e.message;
    }
}

function detectFonts() {
    try {
        var baseFonts = ["monospace", "sans-serif", "serif"];
        var testFonts = [
            "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana",
            "Georgia", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact",
            "Lucida Console", "Tahoma", "Lucida Sans Unicode"
        ];

        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var testString = "mmmmmmmmmmlli";
        var testSize = "72px";

        var baselines = {};
        for (var i = 0; i < baseFonts.length; i++) {
            ctx.font = testSize + " " + baseFonts[i];
            baselines[baseFonts[i]] = ctx.measureText(testString).width;
        }

        var detected = [];
        for (var f = 0; f < testFonts.length; f++) {
            for (var b = 0; b < baseFonts.length; b++) {
                ctx.font = testSize + " " + testFonts[f] + ", " + baseFonts[b];
                if (ctx.measureText(testString).width !== baselines[baseFonts[b]]) {
                    if (detected.indexOf(testFonts[f]) === -1) detected.push(testFonts[f]);
                    break;
                }
            }
        }
        return detected;
    } catch (e) {
        return "error: " + e.message;
    }
}

function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString();
}

ez_a(getEnhancedInfo());