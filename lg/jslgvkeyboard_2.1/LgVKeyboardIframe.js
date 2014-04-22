/*
     LCD TV LABORATORY, LG ELECTRONICS INC., SEOUL, KOREA
     Copyright(c) 2010 by LG Electronics Inc.

     All rights reserved. Only for LG Smart TV Applications, Parts of this work can be reproduced,
     stored in a retrieval system, or transmitted by any means without prior written permission of LG Electronics Inc.
*/

(function(){
    var userAgent = new String(navigator.userAgent);
    var webOSTV = ((userAgent.search(/LG Browser/i) != -1) && (userAgent.search(/webOS.TV/i) != -1))? true : false;
    var lgKbTimerId;

    function initVKforIframe()
    {
        var lgKbBuf = lgKb;

        window.lgKb = parent.window.lgKb;

        window.addEventListener("unload", function(event) {lgKb.cleanKeyboard(event);}, false);

        if(lgKb.getVersionOfLgBrowser() > '4')
        {
            window.addEventListener("focusin", function(event) {lgKb.WindowFocusIn(event);}, false);
            window.addEventListener("focusout", function(event) {lgKb.WindowFocusOut(event);}, false);
        }
        else
        {
            window.addEventListener("DOMFocusIn", function(event) {lgKb.WindowFocusIn(event);}, false);e
            window.addEventListener("DOMFocusOut", function(event) {lgKb.WindowFocusOut(event);}, false);
        }
        
        if(lgKb.isLgBrowser())
        {
            window.addEventListener("keydown", function(event) {lgKb.onRemoteKeyDown(event);}, true);
            window.addEventListener("keyup", function(event) {lgKb.onRemoteKeyUp(event);}, true);
            window.addEventListener("mouseon", function(event) {lgKb.lgMouseOn(true);}, true);
            window.addEventListener("mouseoff", function(event) {lgKb.lgMouseOn(false);}, true);
        }

        lgKbBuf.onInitialized();
    }

    function checkVKReady()
    {
        if(parent.window.lgKb.isInitialized()) {
            clearInterval(lgKbTimerId);
            initVKforIframe();
        }
    }
    
    if(!webOSTV && parent.window.lgKb)
    {
        window.lgKb = {
            isInitialized :
                function ()
                {
                    return false;
                },
            setInitEventHandler :
                function(initEventHandler)
                {
                    lgKb.onInitialized = initEventHandler;
                }
        };
        
        lgKbTimerId = setInterval(checkVKReady, 10);

    }
    else
    {
        console.log("Add LG Virtual Keyboard to the top page");
    }
})();
