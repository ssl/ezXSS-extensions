// <ezXSS extension>
// @name              Security Scanner
// @description       Security analysis including headers, CSP, cookies, secrets and vulnerability detection
// @author            ssl
// @version           2.0
// </ezXSS extension>

function performSecurityScan() {
    var data = {
        url: location.href,
        domain: location.hostname,
        protocol: location.protocol,
        securityHeaders: analyzeSecurityHeaders(),
        csp: analyzeCSP(),
        cookieAnalysis: analyzeCookies(),
        vulnerabilities: detectVulnerabilities(),
        jsContext: analyzeJavaScriptContext(),
        sensitiveData: detectSensitiveData(),
        formSecurity: analyzeFormSecurity(),
        thirdPartyResources: analyzeThirdPartyResources()
    };
    return data;
}

function analyzeSecurityHeaders() {
    var headers = {};
    var names = [
        "strict-transport-security", "content-security-policy",
        "x-frame-options", "x-content-type-options", "x-xss-protection",
        "referrer-policy", "permissions-policy",
        "cross-origin-embedder-policy", "cross-origin-opener-policy",
        "cross-origin-resource-policy"
    ];

    try {
        var metas = document.querySelectorAll("meta[http-equiv], meta[name]");
        for (var i = 0; i < metas.length; i++) {
            var n = (metas[i].getAttribute("http-equiv") || metas[i].getAttribute("name") || "").toLowerCase();
            if (names.indexOf(n) !== -1 || n.indexOf("csp") !== -1 || n.indexOf("security") !== -1) {
                headers[n] = metas[i].getAttribute("content");
            }
        }
    } catch (e) {
        headers._error = "Header analysis failed: " + e.message;
    }

    return headers;
}

function analyzeCSP() {
    var cspData = { present: false, policies: [], weaknesses: [] };

    try {
        var meta = document.querySelector('meta[http-equiv="content-security-policy"]');
        if (meta) {
            cspData.present = true;
            var policy = meta.getAttribute("content");
            cspData.policies.push({ source: "meta-tag", policy: policy });

            var lower = policy.toLowerCase();
            if (lower.indexOf("'unsafe-inline'") !== -1) cspData.weaknesses.push("unsafe-inline detected");
            if (lower.indexOf("'unsafe-eval'") !== -1) cspData.weaknesses.push("unsafe-eval detected");
            if (lower.indexOf("*") !== -1) cspData.weaknesses.push("Wildcard (*) detected");
            if (lower.indexOf("data:") !== -1) cspData.weaknesses.push("data: URI allowed");
            if (lower.indexOf("script-src") === -1) cspData.weaknesses.push("No script-src directive");
        }

        cspData.bypassTests = [];
        try {
            var s = document.createElement("script");
            s.textContent = "window.__cspTest=1;";
            document.head.appendChild(s);
            document.head.removeChild(s);
            if (window.__cspTest) {
                cspData.bypassTests.push("Inline script execution possible");
                delete window.__cspTest;
            }
        } catch (e) {
            cspData.bypassTests.push("Inline script blocked");
        }

        try {
            eval("window.__evalTest=1;");
            if (window.__evalTest) {
                cspData.bypassTests.push("eval() execution possible");
                delete window.__evalTest;
            }
        } catch (e) {
            cspData.bypassTests.push("eval() blocked");
        }
    } catch (e) {
        cspData.error = "CSP analysis failed: " + e.message;
    }

    return cspData;
}

function analyzeCookies() {
    var data = { total: 0, vulnerabilities: [] };
    var sessionPattern = /session|sess|token|auth|login|user/i;

    try {
        var cookies = document.cookie.split(";");
        data.total = cookies.filter(function (c) { return c.trim(); }).length;
        for (var i = 0; i < cookies.length; i++) {
            var t = cookies[i].trim();
            if (t && sessionPattern.test(t)) {
                data.vulnerabilities.push("Session cookie accessible: " + t.split("=")[0]);
            }
        }
    } catch (e) {
        data.error = "Cookie analysis failed: " + e.message;
    }

    return data;
}

function detectVulnerabilities() {
    var vulns = [];

    try {
        if (window.localStorage && Object.keys(localStorage).length > 0) {
            vulns.push("LocalStorage: " + Object.keys(localStorage).length + " items");
        }
        if (window.sessionStorage && Object.keys(sessionStorage).length > 0) {
            vulns.push("SessionStorage: " + Object.keys(sessionStorage).length + " items");
        }
        if (window.self === window.top) {
            vulns.push("Page can be framed (clickjacking)");
        }
        if (location.protocol !== "https:") {
            vulns.push("Not using HTTPS");
        }

        var resources = document.querySelectorAll("script[src], link[href], img[src], iframe[src]");
        for (var i = 0; i < resources.length; i++) {
            var src = resources[i].src || resources[i].href;
            if (src && src.indexOf("http:") === 0 && location.protocol === "https:") {
                vulns.push("Mixed content: " + src);
            }
        }
    } catch (e) {
        vulns.push("Detection failed: " + e.message);
    }

    return vulns;
}

function analyzeJavaScriptContext() {
    var ctx = { globalVariables: [], frameworks: [], exposedAPIs: [] };

    try {
        var fwMap = {
            jQuery: window.jQuery || window.$,
            Angular: window.angular,
            React: window.React,
            Vue: window.Vue
        };
        for (var fw in fwMap) {
            if (fwMap[fw]) ctx.frameworks.push(fw);
        }

        var sensitive = /password|token|key|secret|api|auth|session|admin/i;
        var keys = Object.keys(window);
        for (var i = 0; i < keys.length; i++) {
            if (sensitive.test(keys[i])) ctx.globalVariables.push(keys[i]);
        }

        var apis = ["fetch", "XMLHttpRequest", "WebSocket", "postMessage", "localStorage", "sessionStorage"];
        for (var a = 0; a < apis.length; a++) {
            if (window[apis[a]]) ctx.exposedAPIs.push(apis[a]);
        }
    } catch (e) {
        ctx.error = e.message;
    }

    return ctx;
}

function detectSensitiveData() {
    var result = { inDOM: [], inComments: [] };
    var patterns = [
        { name: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
        { name: "credit_card", re: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
        { name: "password", re: /password\s*[:=]\s*['"][^'"]+['"]/gi },
        { name: "api_key", re: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi },
        { name: "secret", re: /secret\s*[:=]\s*['"][^'"]+['"]/gi }
    ];

    try {
        var text = document.body.textContent || "";
        for (var i = 0; i < patterns.length; i++) {
            var m = text.match(patterns[i].re);
            if (m) result.inDOM.push({ type: patterns[i].name, count: m.length });
        }

        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
        var comment;
        while (comment = walker.nextNode()) {
            for (var j = 0; j < patterns.length; j++) {
                if (patterns[j].re.test(comment.textContent)) {
                    result.inComments.push({ type: patterns[j].name, snippet: comment.textContent.substring(0, 100) });
                }
                patterns[j].re.lastIndex = 0;
            }
        }
    } catch (e) {
        result.error = e.message;
    }

    return result;
}

function analyzeFormSecurity() {
    var data = { totalForms: 0, vulnerableForms: [] };

    try {
        var forms = document.querySelectorAll("form");
        data.totalForms = forms.length;

        for (var i = 0; i < forms.length; i++) {
            var issues = [];
            if (forms[i].action && forms[i].action.indexOf("http:") === 0) {
                issues.push("Submits over HTTP");
            }
            var csrf = forms[i].querySelectorAll('input[name*="csrf"], input[name*="token"], input[type="hidden"]');
            if (csrf.length === 0) issues.push("No apparent CSRF protection");

            var pw = forms[i].querySelectorAll('input[type="password"]');
            for (var p = 0; p < pw.length; p++) {
                var ac = pw[p].getAttribute("autocomplete");
                if (ac !== "off" && ac !== "current-password" && ac !== "new-password") {
                    issues.push("Password field without proper autocomplete");
                }
            }

            if (issues.length > 0) {
                data.vulnerableForms.push({ index: i, action: forms[i].action, method: forms[i].method, issues: issues });
            }
        }
    } catch (e) {
        data.error = e.message;
    }

    return data;
}

function analyzeThirdPartyResources() {
    var tp = { domains: [], resources: [], tracking: [] };
    var trackingHosts = [
        "google-analytics.com", "googletagmanager.com", "facebook.net",
        "doubleclick.net", "hotjar.com", "mixpanel.com"
    ];

    try {
        var current = location.hostname;
        var seen = {};
        var els = document.querySelectorAll("script[src], link[href], img[src], iframe[src]");

        for (var i = 0; i < els.length; i++) {
            var url = els[i].src || els[i].href;
            if (!url) continue;
            try {
                var u = new URL(url);
                if (u.hostname === current) continue;

                if (!seen[u.hostname]) {
                    seen[u.hostname] = true;
                    tp.domains.push(u.hostname);
                }
                tp.resources.push({ type: els[i].tagName.toLowerCase(), domain: u.hostname });

                for (var t = 0; t < trackingHosts.length; t++) {
                    if (u.hostname.indexOf(trackingHosts[t]) !== -1) {
                        tp.tracking.push(trackingHosts[t]);
                    }
                }
            } catch (e) {}
        }
    } catch (e) {
        tp.error = e.message;
    }

    return tp;
}

try {
    ez_a({
        securityScan: performSecurityScan(),
        scanCompleted: true,
        scanVersion: "2.0"
    });
} catch (e) {
    ez_a({
        securityScan: { error: "Scan failed: " + e.message },
        scanCompleted: false,
        scanVersion: "2.0"
    });
}