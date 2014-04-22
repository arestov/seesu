/*
     LCD TV LABORATORY, LG ELECTRONICS INC., SEOUL, KOREA
     Copyright(c) 2010 by LG Electronics Inc.

     All rights reserved. Only for LG Smart TV Applications, Parts of this work can be reproduced,
     stored in a retrieval system, or transmitted by any means without prior written permission of LG Electronics Inc.
*/

(function(){
    var userAgent = new String(navigator.userAgent);
    var webOSTV = ((userAgent.search(/LG Browser/i) != -1) && (userAgent.search(/webOS.TV/i) != -1))? true : false;
    
    if(webOSTV)
    {
        window.NetCastSystemKeyboardVisible(true);
    }
    else
    {
        window.lgKb = {
            isInitialized :
                function ()
                {
                    return false;
                },
            setInitEventHandler :   // set initialized event handler
                function(initEventHandler)
                {
                    lgKb.onInitialized = initEventHandler;
                }
        };

        var head = document.getElementsByTagName('HEAD')[0];
        var mainSrc = document.getElementById("mainVKScript").src.replace("LgVKeyboard.js", "LgVKeyboardMain.js");
        
        var script = document.createElement('script');
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", mainSrc);
        head.appendChild(script);
    }
})();
