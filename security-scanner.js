// <ezXSS extension>
// @name              Security Scanner
// @description       Security analysis including headers, CSP, cookies, secrets and vulnerability detection
// @author            ssl
// @version           1.0
// </ezXSS extension>

function performSecurityScan() {
    const securityData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
    };

    // Analyze HTTP Security Headers
    securityData.securityHeaders = analyzeSecurityHeaders();
    
    // Analyze Content Security Policy
    securityData.csp = analyzeCSP();
    
    // Analyze Cookies
    securityData.cookieAnalysis = analyzeCookies();
    
    // Check for common vulnerabilities
    securityData.vulnerabilities = detectVulnerabilities();
    
    // Analyze JavaScript context
    securityData.jsContext = analyzeJavaScriptContext();
    
    // Check for sensitive data exposure
    securityData.sensitiveData = detectSensitiveData();
    
    // Analyze form security
    securityData.formSecurity = analyzeFormSecurity();
    
    // Check for third-party resources
    securityData.thirdPartyResources = analyzeThirdPartyResources();

    return securityData;
}

function analyzeSecurityHeaders() {
    const headers = {};
    const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy'
    ];

    // Try to detect headers through various methods
    try {
        // Check meta tags for CSP and other security directives
        const metaTags = document.querySelectorAll('meta[http-equiv], meta[name]');
        metaTags.forEach(meta => {
            const name = (meta.getAttribute('http-equiv') || meta.getAttribute('name') || '').toLowerCase();
            if (securityHeaders.includes(name) || name.includes('csp') || name.includes('security')) {
                headers[name] = meta.getAttribute('content');
            }
        });

        // Try to make a HEAD request to analyze response headers
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', window.location.href, false);
        try {
            xhr.send();
            securityHeaders.forEach(header => {
                const value = xhr.getResponseHeader(header);
                if (value) {
                    headers[header] = value;
                }
            });
        } catch (e) {
            headers._error = 'Could not fetch response headers: ' + e.message;
        }
    } catch (e) {
        headers._error = 'Header analysis failed: ' + e.message;
    }

    return headers;
}

function analyzeCSP() {
    const cspData = {
        present: false,
        policies: [],
        weaknesses: []
    };

    try {
        // Check for CSP in meta tags
        const cspMeta = document.querySelector('meta[http-equiv="content-security-policy"]');
        if (cspMeta) {
            cspData.present = true;
            cspData.policies.push({
                source: 'meta-tag',
                policy: cspMeta.getAttribute('content')
            });
        }

        // Analyze CSP weaknesses
        cspData.policies.forEach(policy => {
            const policyText = policy.policy.toLowerCase();
            
            if (policyText.includes("'unsafe-inline'")) {
                cspData.weaknesses.push('unsafe-inline directive detected');
            }
            if (policyText.includes("'unsafe-eval'")) {
                cspData.weaknesses.push('unsafe-eval directive detected');
            }
            if (policyText.includes('*')) {
                cspData.weaknesses.push('Wildcard (*) directive detected');
            }
            if (policyText.includes('data:')) {
                cspData.weaknesses.push('data: URI scheme allowed');
            }
            if (!policyText.includes('script-src')) {
                cspData.weaknesses.push('No script-src directive');
            }
        });

        // Test CSP bypass techniques
        cspData.bypassTests = testCSPBypasses();

    } catch (e) {
        cspData.error = 'CSP analysis failed: ' + e.message;
    }

    return cspData;
}

function testCSPBypasses() {
    const tests = [];
    
    try {
        // Test if we can create script elements
        const script = document.createElement('script');
        script.textContent = 'window.cspTestPassed = true;';
        document.head.appendChild(script);
        document.head.removeChild(script);
        
        if (window.cspTestPassed) {
            tests.push('Inline script execution possible');
            delete window.cspTestPassed;
        }
    } catch (e) {
        tests.push('Inline script blocked by CSP');
    }

    try {
        // Test eval
        eval('window.evalTestPassed = true;');
        if (window.evalTestPassed) {
            tests.push('eval() execution possible');
            delete window.evalTestPassed;
        }
    } catch (e) {
        tests.push('eval() blocked by CSP');
    }

    return tests;
}

function analyzeCookies() {
    const cookieData = {
        total: 0,
        secure: 0,
        httpOnly: 0,
        sameSite: 0,
        vulnerabilities: []
    };

    try {
        const cookies = document.cookie.split(';');
        cookieData.total = cookies.filter(c => c.trim()).length;

        cookies.forEach(cookie => {
            const trimmed = cookie.trim();
            if (!trimmed) return;

            if (trimmed.toLowerCase().includes('secure')) {
                cookieData.secure++;
            }
            if (trimmed.toLowerCase().includes('samesite')) {
                cookieData.sameSite++;
            }
        });

        // Check for potential session tokens
        const sessionPatterns = /session|sess|token|auth|login|user/i;
        cookies.forEach(cookie => {
            if (sessionPatterns.test(cookie)) {
                cookieData.vulnerabilities.push('Potential session cookie accessible via JavaScript: ' + cookie.split('=')[0]);
            }
        });

    } catch (e) {
        cookieData.error = 'Cookie analysis failed: ' + e.message;
    }

    return cookieData;
}

function detectVulnerabilities() {
    const vulnerabilities = [];

    try {
        // Check for DOM XSS sinks
        const dangerousFunctions = ['innerHTML', 'outerHTML', 'document.write', 'eval'];
        dangerousFunctions.forEach(func => {
            if (window[func] || document[func]) {
                vulnerabilities.push(`Dangerous function available: ${func}`);
            }
        });

        // Check for exposed sensitive objects
        if (window.localStorage) {
            const localStorageKeys = Object.keys(localStorage);
            if (localStorageKeys.length > 0) {
                vulnerabilities.push(`LocalStorage contains ${localStorageKeys.length} items`);
            }
        }

        if (window.sessionStorage) {
            const sessionStorageKeys = Object.keys(sessionStorage);
            if (sessionStorageKeys.length > 0) {
                vulnerabilities.push(`SessionStorage contains ${sessionStorageKeys.length} items`);
            }
        }

        // Check for clickjacking protection
        if (window.self === window.top) {
            vulnerabilities.push('Page can be framed (potential clickjacking)');
        }

        // Check for HTTPS
        if (window.location.protocol !== 'https:') {
            vulnerabilities.push('Site not using HTTPS');
        }

        // Check for mixed content
        const resources = document.querySelectorAll('script[src], link[href], img[src], iframe[src]');
        resources.forEach(resource => {
            const src = resource.src || resource.href;
            if (src && src.startsWith('http:') && window.location.protocol === 'https:') {
                vulnerabilities.push('Mixed content detected: ' + src);
            }
        });

    } catch (e) {
        vulnerabilities.push('Vulnerability detection failed: ' + e.message);
    }

    return vulnerabilities;
}

function analyzeJavaScriptContext() {
    const jsContext = {
        globalVariables: [],
        exposedAPIs: [],
        frameworks: []
    };

    try {
        // Detect common frameworks
        const frameworks = {
            'jQuery': window.jQuery || window.$,
            'Angular': window.angular,
            'React': window.React,
            'Vue': window.Vue,
            'Ember': window.Ember,
            'Backbone': window.Backbone,
            'Underscore': window._,
            'Lodash': window._
        };

        Object.keys(frameworks).forEach(name => {
            if (frameworks[name]) {
                jsContext.frameworks.push(name);
            }
        });

        // Check for exposed sensitive global variables
        const sensitivePatterns = /password|token|key|secret|api|auth|session|admin/i;
        Object.keys(window).forEach(key => {
            if (sensitivePatterns.test(key)) {
                jsContext.globalVariables.push(key);
            }
        });

        // Check for exposed APIs
        const commonAPIs = ['fetch', 'XMLHttpRequest', 'WebSocket', 'postMessage', 'localStorage', 'sessionStorage'];
        commonAPIs.forEach(api => {
            if (window[api]) {
                jsContext.exposedAPIs.push(api);
            }
        });

    } catch (e) {
        jsContext.error = 'JavaScript context analysis failed: ' + e.message;
    }

    return jsContext;
}

function detectSensitiveData() {
    const sensitiveData = {
        inDOM: [],
        inComments: [],
        inScripts: []
    };

    try {
        const sensitivePatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /password\s*[:=]\s*['"]\w+['"]/gi, // Password in code
            /api[_-]?key\s*[:=]\s*['"]\w+['"]/gi, // API key
            /secret\s*[:=]\s*['"]\w+['"]/gi // Secret
        ];

        const textContent = document.body.textContent || '';
        sensitivePatterns.forEach((pattern, index) => {
            const matches = textContent.match(pattern);
            if (matches) {
                sensitiveData.inDOM.push({
                    type: ['email', 'credit_card', 'ssn', 'password', 'api_key', 'secret'][index],
                    count: matches.length
                });
            }
        });

        // Check HTML comments
        const comments = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        let comment;
        while (comment = comments.nextNode()) {
            sensitivePatterns.forEach((pattern, index) => {
                if (pattern.test(comment.textContent)) {
                    sensitiveData.inComments.push({
                        type: ['email', 'credit_card', 'ssn', 'password', 'api_key', 'secret'][index],
                        content: comment.textContent.substring(0, 100)
                    });
                }
            });
        }

        // Check script contents
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent) {
                sensitivePatterns.forEach((pattern, index) => {
                    if (pattern.test(script.textContent)) {
                        sensitiveData.inScripts.push({
                            type: ['email', 'credit_card', 'ssn', 'password', 'api_key', 'secret'][index],
                            snippet: script.textContent.substring(0, 200)
                        });
                    }
                });
            }
        });

    } catch (e) {
        sensitiveData.error = 'Sensitive data detection failed: ' + e.message;
    }

    return sensitiveData;
}

function analyzeFormSecurity() {
    const formSecurity = {
        totalForms: 0,
        httpsSubmission: 0,
        csrfProtection: 0,
        autocompleteOff: 0,
        vulnerableForms: []
    };

    try {
        const forms = document.querySelectorAll('form');
        formSecurity.totalForms = forms.length;

        forms.forEach((form, index) => {
            const formData = {
                index: index,
                action: form.action,
                method: form.method,
                issues: []
            };

            // Check HTTPS submission
            if (form.action && form.action.startsWith('https:')) {
                formSecurity.httpsSubmission++;
            } else if (form.action && form.action.startsWith('http:')) {
                formData.issues.push('Form submits over HTTP');
            }

            // Check for CSRF protection
            const csrfInputs = form.querySelectorAll('input[name*="csrf"], input[name*="token"], input[type="hidden"]');
            if (csrfInputs.length > 0) {
                formSecurity.csrfProtection++;
            } else {
                formData.issues.push('No apparent CSRF protection');
            }

            // Check autocomplete
            if (form.getAttribute('autocomplete') === 'off') {
                formSecurity.autocompleteOff++;
            }

            // Check for password fields without proper attributes
            const passwordFields = form.querySelectorAll('input[type="password"]');
            passwordFields.forEach(field => {
                if (field.getAttribute('autocomplete') !== 'off' && 
                    field.getAttribute('autocomplete') !== 'current-password' &&
                    field.getAttribute('autocomplete') !== 'new-password') {
                    formData.issues.push('Password field without proper autocomplete attribute');
                }
            });

            if (formData.issues.length > 0) {
                formSecurity.vulnerableForms.push(formData);
            }
        });

    } catch (e) {
        formSecurity.error = 'Form security analysis failed: ' + e.message;
    }

    return formSecurity;
}

function analyzeThirdPartyResources() {
    const thirdParty = {
        domains: new Set(),
        resources: [],
        cdnUsage: [],
        trackingScripts: []
    };

    try {
        const currentDomain = window.location.hostname;
        const resources = document.querySelectorAll('script[src], link[href], img[src], iframe[src]');

        resources.forEach(resource => {
            const url = resource.src || resource.href;
            if (url) {
                try {
                    const urlObj = new URL(url);
                    if (urlObj.hostname !== currentDomain) {
                        thirdParty.domains.add(urlObj.hostname);
                        thirdParty.resources.push({
                            type: resource.tagName.toLowerCase(),
                            url: url,
                            domain: urlObj.hostname
                        });

                        // Check for known CDNs
                        const cdnPatterns = [
                            'cdnjs.cloudflare.com',
                            'ajax.googleapis.com',
                            'code.jquery.com',
                            'maxcdn.bootstrapcdn.com',
                            'unpkg.com',
                            'jsdelivr.net'
                        ];

                        cdnPatterns.forEach(cdn => {
                            if (urlObj.hostname.includes(cdn)) {
                                thirdParty.cdnUsage.push(cdn);
                            }
                        });

                        // Check for tracking scripts
                        const trackingPatterns = [
                            'google-analytics.com',
                            'googletagmanager.com',
                            'facebook.net',
                            'doubleclick.net',
                            'hotjar.com',
                            'mixpanel.com'
                        ];

                        trackingPatterns.forEach(tracker => {
                            if (urlObj.hostname.includes(tracker)) {
                                thirdParty.trackingScripts.push(tracker);
                            }
                        });
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            }
        });

        thirdParty.domains = Array.from(thirdParty.domains);

    } catch (e) {
        thirdParty.error = 'Third-party resource analysis failed: ' + e.message;
    }

    return thirdParty;
}

// Execute the security scan and add results to the report
try {
    const securityScanResults = performSecurityScan();
    ez_a({
        securityScan: securityScanResults,
        scanCompleted: true,
        scanVersion: '1.0'
    });
} catch (e) {
    ez_a({
        securityScan: {
            error: 'Security scan failed: ' + e.message
        },
        scanCompleted: false,
        scanVersion: '1.0'
    });
} 