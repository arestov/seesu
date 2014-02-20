/*
	 LCD TV LABORATORY, LG ELECTRONICS INC., SEOUL, KOREA
	 Copyright(c) 2010 by LG Electronics Inc.

	 All rights reserved. No part of this work may be reproduced, stored in a
	 retrieval system, or transmitted by any means without prior written
	 permission of LG Electronics Inc.
	 
	 Developer : Sungsik Kim (sungsik74.kim@lge.com)
	 			 Yejeong Park (yejeong.park@lge.com)
*/

(function(){
	
	if(parent.window.lgKb)
	{
		window.lgKb = parent.window.lgKb;

		window.addEventListener("unload", function(event) {lgKb.cleanKeyboard(event);}, false);

		window.addEventListener("DOMFocusIn", function(event) {lgKb.WindowFocusIn(event);}, false);
		window.addEventListener("DOMFocusOut", function(event) {lgKb.WindowFocusOut(event);}, false);
		
		if(lgKb.isLgBrowser())
		{
			window.addEventListener("keydown", function(event) {lgKb.onRemoteKeyDown(event);}, true);
			window.addEventListener("keyup", function(event) {lgKb.onRemoteKeyUp(event);}, true);
			window.addEventListener("mouseon", function(event) {lgKb.lgMouseOn(true);}, true);
			window.addEventListener("mouseoff", function(event) {lgKb.lgMouseOn(false);}, true);
		}
	}
	else
	{
//		alert("Add LG Virtual Keyboard to the top page")
	}
})();
