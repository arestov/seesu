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

	function languageInfo(id, code, title, langJs, bSel)
	{
		this.id = id;
		this.code = code;
		this.title = title;
		this.langJs = langJs;
		this.bSel = bSel;
		this.bCandidate = false;
	}

	window.lgKb = {
		nUpperPos : "0px",
		nLowerPos : "408px",
		bKeyMouseOver : false,
		bShowVKeyboard : false,
		bShowPopupLangSel : false,
		bShowMouseMoveBlockWnd : false,
		bMouseOn : true,
		bCapsLock : false,
		bShift : false,
		bKeyDown : false,
		targetElement : "",
		targetClass : "",
		targetCssText : "",
		targetBgColor : "#ffc0a0",
		targetTextColor : "black",
		mouseOverKeyId : "wkk_key_206", 
		popOverKeyId : "popup_item_00",
		vKeyboard : null,
		popupLangSel : null,
		miniKeyPopup : null,
		selectedLangPopup : null,
		mouseMoveBlockWnd : null,
		vKbJsRootPath : "",
		category : "",
		selectedLang : "",
		selectedCaps : "unshift",
		selectedChar : "",
		nextLang : "",
		nextCaps : "shift",
		nextChar : "",
		langInfoList: Array(),
		toggleKeyId : "wkk_key_kb_up",

		bCaretActivated : false,
		currentCaretIdx : 0,
		nPageFullItemCnt : 21,
		popPageIdx : 0,
		maxPageCnt : 1,
		nSelLangCnt : 0,
		nMaxSelLangCnt : 3,
		itemCnt : 0,
		downPosition : "wkk_key_305",
		bVoiceEnabled : false,
		mainKbDoc : null,
		
		miniPopOverkeyId : "",
		miniPopKeyLength : 0,
		bMiniPopupshow : false,
		timerMiniPopup : null,

		bHIDSessionInit : false,
		hidSelectedLangCodeList : "",
		
		onKeyDown :				//	 user's keydown event handler
			function (event)
			{
			},
		onKeyUp :				//	 user's keyup event handler
			function (event)
			{
			},
		onKeyboardHide :
			function (event)
			{
			},
		keyMouseOver : 
			function (event)
			{
				lgKb.bKeyMouseOver = true;
				lgKb.doHighlight(event);
			},
		keyMouseOut : 
			function (event)
			{
				lgKb.bKeyMouseOver = false;
				lgKb.doHighlight(event);
			},
		keyMouseDown : 
			function (event)
			{
				if(event.target.keyArrStr != undefined)
				{
					// show minipopup
					lgKb.timerMiniPopup = setTimeout(function (event) {lgKb.showMiniPopup(true, event); lgKb.timerMiniPopup = null;}, 600, event);
				}
			},
		keyMouseUp : 
			function (event)
			{
				if(lgKb.timerMiniPopup != null)
				{
					clearTimeout(lgKb.timerMiniPopup);
					lgKb.timerMiniPopup = null;
				}
			},
		onMouseMoveBlock :
			function (event)
			{
				lgKb.showMouseMoveBlockWnd(false);
			},
		kbClick :
			function (event)
			{
				lgKb.keyStroke(event);
				lgKb.refreshFocus();
			},
		popupMouseOver : 
			function (event)
			{
				lgKb.popHighlight(event);
			},
		popupMouseOut : 
			function (event)
			{
				lgKb.popHighlight(event);
			},
		popupMouseDown : 
			function (event)
			{
				lgKb.popHighlight(event);
			},
		popupMouseUp : 
			function (event)
			{
				lgKb.popHighlight(event);
			},
		minipopupMouseOver : 
			function (event)
			{
				lgKb.miniPopHighlight(event);
			},
		minipopupMouseOut : 
			function (event)
			{
				lgKb.miniPopHighlight(event);
			},
		minipopupMouseDown : 
			function (event)
			{
				lgKb.miniPopHighlight(event);
			},
		minipopupMouseUp : 
			function (event)
			{
				lgKb.miniPopHighlight(event);
			},
		lgMouseOn :
			function (bOn)
			{
				lgKb.bMouseOn = bOn;
				if(bOn)
				{
					if(lgKb.bMiniPopupshow)
					{
						lgKb.fireMouseOut(lgKb.miniPopOverkeyId);
					}
					else if(lgKb.bShowPopupLangSel)
					{
						lgKb.fireMouseOut(lgKb.popOverKeyId);
					}
					else if(lgKb.bShowVKeyboard)
					{
						lgKb.fireMouseOut(lgKb.mouseOverKeyId);	
					}
				}
				else
				{
					if(lgKb.bMiniPopupshow)
					{
						lgKb.fireMouseOver(lgKb.miniPopOverkeyId);
					}
					else if(lgKb.bShowPopupLangSel)
					{
						lgKb.fireMouseOver(lgKb.popOverKeyId);
					}
					else if(lgKb.bShowVKeyboard)
					{
						lgKb.fireMouseOver(lgKb.mouseOverKeyId);	
					}
				}
			},
		onRemoteKeyDown :
			function (event)
			{
				if(lgKb.bMiniPopupshow || lgKb.bShowPopupLangSel || lgKb.bShowVKeyboard)
				{
					if(lgKb.bKeyDown)
					{
						event.returnValue = false;
						return;
					}
					
					var rtnVal = false;
					
					if(lgKb.bMiniPopupshow)
					{
						lgKb.miniPopKeydown(event);
						event.returnValue = false;
					}
					else if(lgKb.bShowPopupLangSel)
					{
						lgKb.popKeyDown(event);
						event.returnValue = false;
					}
					else if(lgKb.bShowVKeyboard)
					{					
						var keyCode = event.keyCode;
						
						//	change keycode of number pad key to keycode of number key
						if((keyCode >= VK_NUMPAD_0) && (keyCode <= VK_NUMPAD_9))
						{
							keyCode -= 48;
						}
						
						var keyId = "";
						switch(keyCode)
						{
							case VK_HID_ESC :
								lgKb.focusOut();
								break;
							case VK_UP :
								keyId = lgKb.moveUp();
								break;
								
							case VK_DOWN :
								keyId = lgKb.moveDown();
								break;
								
							case VK_LEFT :
								keyId = lgKb.moveLeft();
								break;
								
							case VK_RIGHT :
								keyId = lgKb.moveRight();
								break;
								
							case VK_ENTER :
								if(document.getElementById(lgKb.mouseOverKeyId).keyArrStr == undefined)
								{
									lgKb.fireMouseClick(lgKb.mouseOverKeyId);
								}
								else
								{
									lgKb.bKeyDown = true;
									lgKb.fireMouseDown(lgKb.mouseOverKeyId);
								}

								break;
								
							case VK_SHIFT :
								if(!lgKb.bShift)
								{
									keyCode = VK_CAPS_LOCK;
									lgKb.insertKeyFromInputDevice(keyCode);					
									lgKb.bShift = true;
								}
								break;
							default :
								rtnVal = true;
								break;
						}
						
						if(keyId != "")
						{
							lgKb.fireMouseOut(lgKb.mouseOverKeyId);
							lgKb.fireMouseOver(keyId);
						}
						
						event.returnValue = rtnVal;
					}
				}
				else
				{
					lgKb.onKeyDown(event);
				}
				
				return;
			},
		onRemoteKeyUp :
			function (event)
			{
				if(lgKb.bMiniPopupshow || lgKb.bShowPopupLangSel || lgKb.bShowVKeyboard)
				{
					lgKb.bKeyDown = false;
					
					if(lgKb.bMiniPopupshow)
					{
						event.returnValue = false;
					}
					else if(lgKb.bShowPopupLangSel)
					{
						event.returnValue = false;
					}
					else if(lgKb.bShowVKeyboard)
					{
						var keyCode = event.keyCode;
						
						switch(keyCode)
						{				
							case VK_SHIFT :
								keyCode = VK_CAPS_LOCK;
								lgKb.insertKeyFromInputDevice(keyCode);
								lgKb.bShift = false;
								break;
							case VK_HID_ALT:
							case VK_HID_RT_ALT:
//								lgKb.changeLangJs(lgKb.nextLang);		//	this is called HIDLanguageChange event
								break;
							case VK_ENTER :
								if(lgKb.timerMiniPopup != null)
								{
									clearTimeout(lgKb.timerMiniPopup);
									lgKb.timerMiniPopup = null;
									
									lgKb.fireMouseClick(lgKb.mouseOverKeyId);
								}
								break;
							default :
								break;
						}
						event.returnValue = false;
					}
				}
				else
				{
					lgKb.onKeyUp(event);
				}
				
				return;
			},
		fireMouseOver :
			function (keyId)
			{
				var event = document.createEvent("MouseEvents");
				event.initEvent("mouseover", true, true);
				document.getElementById(keyId).dispatchEvent(event);
			},
		fireMouseOut :
			function (keyId)
			{
				var event = document.createEvent("MouseEvents");
				event.initEvent("mouseout", true, true);
				document.getElementById(keyId).dispatchEvent(event);
			},
		fireMouseClick :
			function (keyId)
			{
				var event = document.createEvent("MouseEvent");
				event.initEvent("click", true, true);
				document.getElementById(keyId).dispatchEvent(event);
			},
		fireMouseDown :
			function (keyId)
			{
				var event = document.createEvent("MouseEvent");
				event.initEvent("mousedown", true, true);
				document.getElementById(keyId).dispatchEvent(event);
			},
		fireMouseUp :
			function (keyId)
			{
				var event = document.createEvent("MouseEvent");
				event.initEvent("mouseup", true, true);
				document.getElementById(keyId).dispatchEvent(event);
			},
		WindowFocusIn : 
	        function (event)
	        {
	        	var allowed_input_types = ['text', 'password', 'search', 'number'];
               if(lgKb.targetElement)
               {
                       //      add your codes
               }
               else if( ( (event.target.tagName=="TEXTAREA") || ( (event.target.tagName=="INPUT") && ( allowed_input_types.indexOf(event.target.type) != -1 ) ) )
                              && (!event.target.readOnly) && (!event.target.disabled) )
               {
                       lgKb.focusIn(event);
               }
	        },
		WindowFocusOut :
			function (event)
			{
				if(lgKb.bMiniPopupshow)
				{
					//	add your codes
				}
				else if(lgKb.bShowPopupLangSel)
				{
					//	add your codes
				}
				else if(lgKb.bKeyMouseOver)
				{
					lgKb.currentCaretIdx = lgKb.targetElement.selectionStart;
				}
				else
				{
					lgKb.focusOut();
				}	
			},
		onClearCaretInfo :
			function ()
			{
				lgKb.clearCaretInfo();
			},
		clearCaretInfo :
			function (caretPos)
			{
				setNewMode(0);	
				lgKb.bCaretActivated = false;

				if(caretPos == "EndOfValue")
				{
					lgKb.setCaretPosition(lgKb.targetElement.value.length, 0);
				}
				else if(caretPos == "EndOfSelection")
				{
					lgKb.setCaretPosition(lgKb.targetElement.selectionEnd, 0);
				}
				else
				{
					lgKb.setCaretPosition(lgKb.targetElement.selectionStart, 0);
				}
			},
		insertKeyFromInputDevice :
			function (keyCode)
			{
				var keyElement = lgKb.getTextFromKeyCode(keyCode);
				if(keyElement)
				{
					var bKeyMouseOver = lgKb.bKeyMouseOver;
					
					lgKb.fireMouseOut(lgKb.mouseOverKeyId);
					lgKb.fireMouseOver(keyElement.id);
					lgKb.fireMouseClick(keyElement.id);
					
					lgKb.bKeyMouseOver = bKeyMouseOver;
				}
			},
		isLgBrowser :
			function ()
			{
				var userAgent = new String(navigator.userAgent);
				var nLgBrowser = userAgent.search(/LG Browser/i);
				
				if(nLgBrowser != -1)
				{
					return true;
				}
				else
				{
					return false;
				}
			},
		initKeyboard :
			function (event)
			{
				lgKb.mainKbDoc = event.target;
				
				if(!lgKb.isLgBrowser())
				{
//						return;		//	Virtual Keyboard works well on LG Smart TV
				}
				else
				{
					lgKb.addObjects();
				}
				
				if(!lgKb.vKeyboard)
				{
					lgKb.setLangInfo();
					
					var mainVKScript = document.getElementById("mainVKScript").src;
					lgKb.vKbJsRootPath = mainVKScript.replace("LgVKeyboard.js", "");
					
					//	load keycode.js
					lgKb.loadKeycodeJs();

					//	create keyboard layout
					var body = document.getElementsByTagName( 'BODY' )[ 0 ];
					lgKb.vKeyboard = body.appendChild( lgKb.generateMarkup() );
				
					//	create Language Selection Popup layout
					lgKb.popupLangSel = body.appendChild( lgKb.generatePopup() );

					// create Language mini popup
					lgKb.miniKeyPopup = body.appendChild( lgKb.generateMiniPopup() );

					// create selected language popup
					lgKb.selectedLangPopup = body.appendChild( lgKb.generateSelectedLangPopup() );
					
					// create window to block the mouse move event after voice recognition
					lgKb.mouseMoveBlockWnd = body.appendChild( lgKb.generateMouseMoveBlockWnd() );
					
					lgKb.setVKbLanguage();
				}
			},
		loadKeycodeJs :
			function ()
			{
				var strKeycodeJs = lgKb.vKbJsRootPath + "keycode.js";
				var head = document.getElementsByTagName( 'HEAD' )[ 0 ];
				
				var script = document.createElement("script");
				script.type = "text/javascript";
				script.src = strKeycodeJs;
				head.appendChild(script);
			},
		getAbsOffsetTop :
			function (event)
			{
				var offset = lgKb.getElementOffsetTop(event.target);
				var objParent = event.view;
				
				while(objParent.frameElement)
				{
					offset += objParent.frameElement.offsetTop;
					objParent = objParent.parent;
				}
				return offset;
			},
		getElementOffsetTop :
			function (element)
			{
				var offsetTop = element.offsetTop;
				if(element.offsetParent)
				{
					offsetTop += lgKb.getElementOffsetTop(element.offsetParent);
				}
				
				return offsetTop;
			},
		moveKeboard :
			function (position)
			{
				var element;
				element = document.getElementById(lgKb.toggleKeyId);
				if(position == "up")
				{
					lgKb.vKeyboard.style.top = lgKb.nUpperPos;
					if(element != null)
					{
						element.setAttribute("id", 'wkk_key_kb_down');
						lgKb.setElementBackground("wkk_key_kb_down","url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Down_N.png')");
						lgKb.toggleKeyId = "wkk_key_kb_down";
						document.getElementById("langPopUpDiv").style.top = "208px";
						
						if(lgKb.mouseOverKeyId == "wkk_key_kb_up")
						{
							lgKb.mouseOverKeyId = "wkk_key_kb_down";
						}
					}
				}
				else
				{
					lgKb.vKeyboard.style.top = lgKb.nLowerPos;
					
					if(element != null)
					{
						element.setAttribute("id", 'wkk_key_kb_up');
						lgKb.setElementBackground("wkk_key_kb_up","url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Up_N.png')");
						lgKb.toggleKeyId = "wkk_key_kb_up";
						document.getElementById("langPopUpDiv").style.top = "568px";
						
						if(lgKb.mouseOverKeyId == "wkk_key_kb_down")
						{
							lgKb.mouseOverKeyId = "wkk_key_kb_up";
						}
					}
				}
			},
		focusIn :
			function (event)
				{
					var absOffsetTop = lgKb.getAbsOffsetTop(event);
					
					lgKb.targetElement = event.target;
					lgKb.targetClass = event.target.className;
					lgKb.targetCssText = event.target.style.cssText;

					event.target.style.backgroundColor = lgKb.targetBgColor;
					event.target.style.color = lgKb.targetTextColor;
					
					if(absOffsetTop > 360)
					{
						lgKb.moveKeboard("up");
					}
					else
					{
						lgKb.moveKeboard("down");
					}
					
					if(!lgKb.bMouseOn)
					{
						lgKb.fireMouseOver(lgKb.mouseOverKeyId);
					}
					
					lgKb.vKeyboard.style.display = 'block';
					lgKb.bShowVKeyboard = true;

					lgKb.targetElement.addEventListener("click", lgKb.onClearCaretInfo, false);

					if(lgKb.bMouseOn)
					{
						lgKb.clearCaretInfo();
					}
					else
					{
						lgKb.clearCaretInfo("EndOfValue");
					}
				},
		focusOut :
			function ()
			{	
				if(lgKb.targetElement)
				{
					lgKb.closeHIDSession();
					
					lgKb.removeAllSelection();
					
					lgKb.fireMouseOut(lgKb.mouseOverKeyId);
					lgKb.targetElement.removeEventListener("click", lgKb.clearCaretInfo, false);

					lgKb.targetElement.removeAttribute("class");
					if(lgKb.targetClass != "")
					{
						lgKb.targetElement.className = lgKb.targetClass;
					}
					
					lgKb.targetElement.removeAttribute("style");

					var target_node = lgKb.targetElement;

				

					if(lgKb.targetCssText != "")
					{
						lgKb.targetElement.style.cssText = lgKb.targetCssText;
					}
					
					lgKb.targetClass = "";
					lgKb.targetCssText = "";
					lgKb.targetElement = "";
					
					lgKb.vKeyboard.style.display = 'none';
					lgKb.bShowVKeyboard = false;
					
					if(lgKb.bShowPopupLangSel)
					{
						lgKb.showPopupLangSel(false);
					}
                    
                    if(lgKb.bMiniPopupshow)
                    {
                    	lgKb.showMiniPopup(false);
                    }

                    lgKb.onKeyboardHide();
                    setTimeout(function() {
                    	target_node.blur();
                    }, 100)
                   
				}
			},
		removeAllSelection :
			function ()
			{
				var doc = lgKb.targetElement.ownerDocument;
				var win = doc.defaultView;
				var sel = win.getSelection ? win.getSelection() : doc.selection;
				if(sel)
				{
					if(sel.removeAllRanges)
					{
						sel.removeAllRanges();
					}
					else if(sel.empty)
					{
						sel.empty();
					}
				}
			},
		generateMarkup :
			function ()
			{
				var newNode = document.createElement( 'DIV' );
				newNode.id = "VirtualKeyboard";
				newNode.onclick = function(event) { lgKb.kbClick(event); };
				newNode.onmouseover = function(event) { lgKb.keyMouseOver(event); };
				newNode.onmouseout = function(event) { lgKb.keyMouseOut(event); };
				newNode.onmousedown = function(event) { lgKb.keyMouseDown(event); };
				newNode.onmouseup = function(event) { lgKb.keyMouseUp(event); };
				newNode.className = 'keyboardArea';
				newNode.style.display = 'none';
				newNode.style.fontFamily = "'LG Display_Eng_Kor', 'LG Display'";
				newNode.innerHTML = "<!-- Level 1 Start -->" +
					"<div class='horBtnLayer'>" +
						"<div id='wkk_key_voice' class='btnHorNormalImgMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Voice_D.png &quot;);'></div>" +
						"<div id='wkk_key_001' name='keyCode_192' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_002' name='keyCode_49' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_003' name='keyCode_50' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_004' name='keyCode_51' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_005' name='keyCode_52' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_006' name='keyCode_53' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_007' name='keyCode_54' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_008' name='keyCode_55' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_009' name='keyCode_56' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_010' name='keyCode_57' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_011' name='keyCode_48' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_012' name='keyCode_189' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_013' name='keyCode_187' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_014' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_clear' class='btnHorNormalMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_N2.png &quot;);'>Clear</div>" +
					"</div>" +
					"<!-- Level 1 End -->" +
					"<!-- Level 2 Start -->" +
					"<div class='horBtnLayer'>" +
						"<!-- Lang Select -->" +
						"<div id='wkk_key_lang_sel' class='btnHorNormalImgMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn4_N.png &quot;);'></div>" +
						"<div id='wkk_key_101' name='keyCode_81' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_102' name='keyCode_87' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_103' name='keyCode_69' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_104' name='keyCode_82' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_105' name='keyCode_84' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_106' name='keyCode_89' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_107' name='keyCode_85' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_108' name='keyCode_73' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_109' name='keyCode_79' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_110' name='keyCode_80' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_111' name='keyCode_219' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_112' name='keyCode_221' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_113' name='keyCode_220' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_114' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<!--Back space -->" +
						"<div id='wkk_key_backspace' name='keyCode_8' class='btnHorNormalMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn6_N.png &quot;);'></div>" +
					"</div>" +
					"<!-- Level 2 End -->" +

					"<!-- Level 3 Start -->" +
					"<div class='horBtnLayer'>" +
						"<!-- Lang Toggle -->" +
						"<div id='wkk_key_lang_toggle' name='keyCode_229' class='horBtnNormal'  style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn2_N.png &quot;);'></div>" +
						"<!-- Shift Toggle -->" +
						"<div id='wkk_key_shift_toggle' name='keyCode_20' class='horBtnNormal'  style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn13_N.png &quot;);'></div>" +
						"<div id='wkk_key_201' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_202' name='keyCode_65' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_203' name='keyCode_83' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_204' name='keyCode_68' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_205' name='keyCode_70' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_206' name='keyCode_71' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_207' name='keyCode_72' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_208' name='keyCode_74' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_209' name='keyCode_75' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_210' name='keyCode_76' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_211' name='keyCode_186' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_212' name='keyCode_222' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_213' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_214' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<!-- Enter -->" +
						"<div id='wkk_key_enter' name='keyCode_13' class='btnHorNormalMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn7_N.png &quot;);'></div>" +
					"</div>" +
					"<!-- Level 3 End -->" +
					"<!-- Level 4 Start -->" +
					"<div class='horBtnLayer'>" +
						"<!-- Char Select -->" +
						"<div id='wkk_key_char_sel' class='btnHorNormalMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_N.png &quot;);'></div>" +
						"<div id='wkk_key_301' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_302' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_303' name='keyCode_90' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_304' name='keyCode_88' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_305' name='keyCode_67' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_306' name='keyCode_86' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_307' name='keyCode_66' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_308' name='keyCode_78' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_309' name='keyCode_77' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_310' name='keyCode_188' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_311' name='keyCode_190' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_312' name='keyCode_191' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_313' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_314' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<!-- Left arrow -->" +
						"<div id='wkk_key_left' name='keyCode_' class='horBtnNormal' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn8_N.png &quot;);'></div>" +
						"<!-- Right arrow -->" +
						"<div id='wkk_key_right' name='keyCode_' class='horBtnNormal' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn9_N.png &quot;);'></div>" +
					"</div>" +
					"<!-- Level 4 End -->" +

					"<!-- Level 5 Start -->" +
					"<div class='horBtnLayer'>" +
						"<div id='wkk_key_kb_up' class='btnHorNormalImgMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Up_N.png &quot;);'></div>" +
						"<div id='wkk_key_401' class='horBtnSmall'>&nbsp;</div>" +
						"<div id='wkk_key_402' class='horBtnSmall'>&nbsp;</div>" +
						"<div id='wkk_key_403' class='horBtnSmall'>&nbsp;</div>" +
						"<div id='wkk_key_404' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_spacebar' name='keyCode_32' class='btnHorNormalLong' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn11_N.png &quot;);'>&nbsp;</div>" +
						"<div id='wkk_key_411' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_412' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_413' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<div id='wkk_key_414' name='keyCode_' class='horBtnNormal'>&nbsp;</div>" +
						"<!-- Hidden -->" +
						"<div id='wkk_key_hide' class='btnHorNormalMiddle' style = 'background-image: url(&quot;" + lgKb.vKbJsRootPath + "image/Qwerty_Btn10_N.png &quot;);'></div>" +
					"</div>" +
					"<!-- Level 3 End -->";
				
				return newNode;
			},
		generatePopup :
			function()
			{
				var newNode = document.createElement( 'DIV' );
				newNode.id = "languageSelection";
				newNode.onclick = function(event) { lgKb.popupKeyStroke(event); };
				newNode.onmouseover = function(event) { lgKb.popupMouseOver(event); };
				newNode.onmouseout = function(event) { lgKb.popupMouseOut(event); };
				newNode.onmousedown = function(event) { lgKb.popupMouseDown(event); };
				newNode.onmouseup = function(event) { lgKb.popupMouseUp(event); };
				newNode.className = 'marskedPopup';
				newNode.style.display = 'none';
				newNode.style.fontFamily = "'LG Display_Eng_Kor', 'LG Display'";
				newNode.innerHTML = "<div id='LangPopup' class='popupLangSelection'>" +
					
						"<!-- Title area Start-->" +
						"<div class='popupLangTitleTopLeft'></div> <div class='popupLangTitleTop'></div> <div class='popupLangTitleTopRight'></div>" + 
						"<div class='popupLangTitleBodyLeft'></div>" +
						"<div class='popupLangTitleBody'>" +
							"<div id='LangTitle' class='popupLangTitle'>" +
								"Language Selection" +
							"</div>" +
							"<div id='LangInfo' class='popupLangInfo'>" +
								"<!--  selected lang. Cnt -->" +
								"<div id='langCnt' class='popupLangSelCount'>&nbsp;</div>" +
								"<!--  page Cnt -->" +
								"<div id='pageCnt' class='popupLangPageCount'>&nbsp;</div>" +
							"</div>" +
						"</div>" +
						"<div class='popupLangTitleBodyRight'></div>" +
						"<!-- Title area End-->" +
						
						"<!-- Language Area Start -->" +
						"<div class=popupLangBodyLeft></div>" +
						"<div class=popupLangBodyArrowArea></div>" +
						"<div class=popupLangBody>" +
							"<div id='LangList' class='popupLangList'>" +
								"<div id='popup_item_00' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_01' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_02' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_03' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_04' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_05' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_06' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_07' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_08' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_09' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_10' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_11' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_12' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_13' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_14' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_15' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_16' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_17' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_18' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_19' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<div id='popup_item_20' class='popupLangItemNone' langId = ''>&nbsp;</div>" +
								"<!-- Seventh Row End -->" +
							"</div>" +
							"<!-- Message -->" +
							"<div id='message' class='popupLangMessage'>" +	
								"<b>You can select no more than 3 languages.</b>" +					
							"</div>" +
						"</div>" +
						"<div class=popupLangBodyArrowArea></div>" +
						"<div class=popupLangBodyRight></div>" +
						"<!-- Language Area End -->" +
						
						"<!-- button Area Start -->" +
						"<div class='popupLangBottomLeft'></div>" +
						"<div class='popupLangBottom'>" +								
							"<!-- OK Button -->" +
							"<div class='popupBtnDiv'>" +
								"<div id='popup_btn_ok' class='popupBtnNormal' style='float: right'>OK</div>" +
							"</div>" +
							
							"<!-- Cancel Button -->" +
							"<div class='popupBtnDiv'>" +
								"<div id='popup_btn_cancel' class='popupBtnNormal' style='float: left'>CANCEL</div>" +
							"</div>" +
						"</div>" +
						"<div class='popupLangBottomRight'></div>" +
						"<!-- button Area End -->" +
						
						"<!-- arrow Area Start -->" +
						"<div id='arrowLeft'  class='popupLeftArrow'></div>" +
						
						"<!-- right arrow -->" +
						"<div id='arrowRight' class='popupRightArrow'></div>" +
						"<!-- arrow Area End -->" +						
					"</div>";
				
				return newNode;  
			},
		generateMiniPopup :
			function()
			{
				var newNode = document.createElement( 'DIV' );
				newNode.id = "miniKeySelection";
				newNode.onclick = function(event) { lgKb.minipopupKeyStroke(event); };
				newNode.onmouseover = function(event) { lgKb.minipopupMouseOver(event); };
				newNode.onmouseout = function(event) { lgKb.minipopupMouseOut(event); };
				newNode.onmousedown = function(event) { lgKb.minipopupMouseDown(event); };
				newNode.onmouseup = function(event) { lgKb.minipopupMouseUp(event); };
				newNode.className = 'marskedPopup';
				newNode.style.display = 'none';
				newNode.style.fontFamily = "'LG Display_Eng_Kor', 'LG Display'";
				newNode.innerHTML = "<div id='miniKeyPopupDiv' class='miniKeyPopup'></div>";
				
				return newNode;	
			},
		generateSelectedLangPopup :
			function ()
			{
				var newNode = document.createElement( 'DIV' );
				newNode.id = "selectedLangPopup";
				newNode.style.display = 'block';
				newNode.style.fontFamily = "'LG Display_Eng_Kor', 'LG Display'";
				newNode.innerHTML = "<div id='langPopUpDiv' class='langPopUp' style='visibility:hidden;'></div>";
				
				return newNode;
			},
		generateMouseMoveBlockWnd :
			function ()
			{
				var newNode = document.createElement( 'DIV' );
				newNode.id = "mouseMoveBlockDiv";
				newNode.onmousemove = function(event) { lgKb.onMouseMoveBlock(event); };
				newNode.className = 'marskedPopup';
				newNode.style.display = 'none';
				newNode.style.fontFamily = "'LG Display_Eng_Kor', 'LG Display'";
				
				return newNode;
			},
		showMouseMoveBlockWnd :
			function (bShow)
			{
				bShowMouseMoveBlockWnd = bShow;
				
				if(bShow)
				{
					lgKb.mouseMoveBlockWnd.style.display = "block";
				}
				else
				{
					lgKb.mouseMoveBlockWnd.style.display = "none";
				}
			},
		showPopupLangSel :
			function (bShow)
			{
				lgKb.bShowPopupLangSel = bShow;
				if(bShow)
				{
					lgKb.popupInit(true);
					lgKb.popupLangSel.style.display = "block";
					lgKb.popOverKeyId="popup_item_00";
					
					if(!lgKb.bMouseOn)
					{
						lgKb.fireMouseOver(lgKb.popOverKeyId);
					}
					else
					{
						lgKb.fireMouseOut(lgKb.popOverKeyId);
					}
					
					lgKb.fireMouseOver('popup_item_00');
				}
				else
				{
					lgKb.popupLangSel.style.display = "none";
					if(lgKb.targetElement)
					{
						lgKb.targetElement.focus();
					}
					document.getElementById('popup_btn_ok').className = "popupBtnNormal";
					document.getElementById('popup_btn_cancel').className = "popupBtnNormal";
					
					lgKb.lgMouseOn(lgKb.bMouseOn);
				}
			},
		setLangInfo :
			function ()
			{
				lgKb.langInfoList.push(new languageInfo("en", "ENG", "English", "english.js", false)); 
				lgKb.langInfoList.push(new languageInfo("al", "ALB", "Shqip", "albanian.js", false));//Albanian
				lgKb.langInfoList.push(new languageInfo("ar", "ARA", "العربية", "arabic.js", false));
	            lgKb.langInfoList.push(new languageInfo("bo", "BOS", "Bosanski", "bosnian.js", false));//Bosnian
	            lgKb.langInfoList.push(new languageInfo("bu", "BUL", "БЪЛГАРСКИ", "bulgarian.js", false));
				lgKb.langInfoList.push(new languageInfo("cr", "SCR", "Hrvatski", "croatian.js", false));
				lgKb.langInfoList.push(new languageInfo("cz", "CZE", "Česky", "czech.js", false));
				lgKb.langInfoList.push(new languageInfo("da", "DAN", "Dansk", "danish.js", false));
				lgKb.langInfoList.push(new languageInfo("de", "DEU", "Nederlands", "deutsch.js", false));
				lgKb.langInfoList.push(new languageInfo("es", "EST", "Eesti", "estonian.js", false));
				lgKb.langInfoList.push(new languageInfo("fi", "FIN", "Suomi", "finnish.js", false));
				lgKb.langInfoList.push(new languageInfo("fr", "FRE", "Français", "french.js", false)); //french
				lgKb.langInfoList.push(new languageInfo("ge", "GER", "Deutsch", "german.js", false));
				lgKb.langInfoList.push(new languageInfo("gr", "GRE", "Ελληνικά", "greek.js", false));
				lgKb.langInfoList.push(new languageInfo("hr", "HEB", "עברית", "hebrew.js", false));
				lgKb.langInfoList.push(new languageInfo("hu", "HUN", "Magyar", "hungarian.js", false));
				lgKb.langInfoList.push(new languageInfo("hi", "HIN", "हिन्दी", "hindi.js", false)); //Hindi
				lgKb.langInfoList.push(new languageInfo("in", "IND", "Indonesia", "english.js", false));//Indonesian
				lgKb.langInfoList.push(new languageInfo("it", "ITA", "Italiano", "italian.js", false));
				lgKb.langInfoList.push(new languageInfo("kz", "KAZ", "Қазақ", "kazakh.js", false));
				lgKb.langInfoList.push(new languageInfo("ko", "KOR", "한국어", "korean.js", false));//Korean					
				lgKb.langInfoList.push(new languageInfo("lt", "LAT", "Latviešu", "latvian.js", false));
				lgKb.langInfoList.push(new languageInfo("li", "LIT", "Lietuvių", "lithuanian.js", false));
				lgKb.langInfoList.push(new languageInfo("md", "MAD", "Македонски", "macedonian.js", false));
				lgKb.langInfoList.push(new languageInfo("my", "MAY", "Melayu", "english.js", false));
				lgKb.langInfoList.push(new languageInfo("no", "NOR", "Norsk", "norwegian.js", false));
				lgKb.langInfoList.push(new languageInfo("pe", "PER", "فارسي", "persian.js", false));
				lgKb.langInfoList.push(new languageInfo("pl", "POL", "Polski", "polish.js", false));
				lgKb.langInfoList.push(new languageInfo("pr", "POR", "Português", "portuguese.js", false));
				lgKb.langInfoList.push(new languageInfo("rm", "RUM", "Româneşte", "romanian.js", false));					
				lgKb.langInfoList.push(new languageInfo("ru", "RUS", "Русский", "russian.js", false));//Russian
				lgKb.langInfoList.push(new languageInfo("sc", "SCC", "Srpski", "serbian.js", false));//Serbian
				lgKb.langInfoList.push(new languageInfo("so", "SLO", "Slovenčina", "slovak.js", false));//Slovak
				lgKb.langInfoList.push(new languageInfo("sl", "SLV", "Slovenščina", "slovenian.js", false));//Slovenian
				lgKb.langInfoList.push(new languageInfo("sp", "SPA", "Español", "spanish.js", false));//Spanish
				lgKb.langInfoList.push(new languageInfo("sw", "SWE", "Svenska", "swedish.js", false));//Swedish
				lgKb.langInfoList.push(new languageInfo("th", "THA", "ภาษาไทย", "thai.js", false)); //Thai
				lgKb.langInfoList.push(new languageInfo("tu", "TUR", "Türkçe", "turkish.js", false));//Turkish
				lgKb.langInfoList.push(new languageInfo("uk", "UKR", "Українська", "ukrainian.js", false));//Ukrainian
				lgKb.langInfoList.push(new languageInfo("uc", "UZC", "uzbek_Cyrrilic", "uzbek_cyrrilic.js", false));//Cyril 
				lgKb.langInfoList.push(new languageInfo("um", "UZM", "uzbek_Modern", "uzbek_modern_latin.js", false)); //Modern Latin
				lgKb.langInfoList.push(new languageInfo("vi", "VIE", "Tiếng Việt", "vietnam.js", false)); //Vietnamese
			},
		refreshVKeyboard :
			function (bRefreshAll)
			{
				if(bRefreshAll)
				{
					lgKb.changeLangJs(lgKb.getNextLangCode(lgKb.getFirstLang()));
				}
				else
				{
					lgKb.nextLang = lgKb.getNextLangCode(lgKb.selectedLang);
					lgKb.toggleKeyChange();
				}
				
				lgKb.showPopupLangSel(false);
			},
		cleanKeyboard :
			function (event)
			{
				if((lgKb.targetElement) && (lgKb.targetElement.ownerDocument == event.target))
				{
					lgKb.focusOut();
				}
			},
		setSelLang :
			function (langId, bSel)
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(langId == lgKb.langInfoList[index].id)
					{
						lgKb.langInfoList[index].bSel = bSel;
						lgKb.langInfoList[index].bCandidate = bSel;
						return;
					}
				}
			},
		setLangCandidate :
			function (langId, bCandidate)
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(langId == lgKb.langInfoList[index].id)
					{
						lgKb.langInfoList[index].bCandidate = bCandidate;
						return;
					}
				}
			},
		getFirstLang :
			function ()
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(lgKb.langInfoList[index].bSel)
					{
						return lgKb.langInfoList[index].id;
					}
				}
			},
		getFirstLangCode :
			function ()
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(lgKb.langInfoList[index].bSel)
					{
						return lgKb.langInfoList[index].code;
					}
				}
			},
		getNextLangCode :
			function (langId)
			{
				var index;
				for(index=0; index<lgKb.langInfoList.length; index++)
				{
					if(lgKb.langInfoList[index].bSel)
					{
						if(langId == lgKb.langInfoList[index].id)
						{
							for(index++; index<lgKb.langInfoList.length; index++)
							{
								if(lgKb.langInfoList[index].bSel)
								{
									return lgKb.langInfoList[index].code;
								}
							}
							
							return lgKb.getFirstLangCode();
						}
					}
				}
			},
		getLangIdFromCode :
			function (langCode)
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(langCode.search(lgKb.langInfoList[index].code) >= 0)
					{
						return lgKb.langInfoList[index].id;
					}
				}
				
				return "";
			},
		getLangCodeFromId :
			function (langId)
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(langId.search(lgKb.langInfoList[index].id) >= 0)
					{
						return lgKb.langInfoList[index].code;
					}
				}
				
				return "";
			},	
		getLangNameFromCode:
			function(langCode)
			{
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(langCode.search(lgKb.langInfoList[index].code) >= 0)
					{
						return lgKb.langInfoList[index].title;
					}
				}
				
				return "";
			},
		addObjects :
			function ()
			{
				var body = document.getElementsByTagName( 'BODY' )[ 0 ];
				var newNode;

				//	Device Info Object
				newNode = document.createElement( 'DIV' );
				newNode.id = "deviceObjDiv";
				body.appendChild(newNode);
				
				var device = document.createElement('object');
				device.id = "lgVkDevice";
				device.type = "application/x-netcast-info";
				device.height = 0;
				device.width = 0;
				newNode.appendChild(device);

				//	Voice Object
				newNode = document.createElement( 'DIV' );
				newNode.id = "voiceObjDiv";
				body.appendChild(newNode);
				
				var voice = document.createElement('object');
				voice.id = "lgVkVoice";
				voice.type = "application/x-netcast-voice";
				voice.height = 0;
				voice.width = 0;
				newNode.appendChild(voice);
			},
		setVKbLanguage :
			function ()
			{
				var selLang = lgKb.getCookie("VKbSelectedLang");
				var langList = lgKb.getCookie("VKbLangList");
				if(selLang == '' || (langList.indexOf(selLang) == -1))
				{
					lgKb.setDefaultLanguage();
				}
				else
				{
					lgKb.setCookieLanguage(selLang, langList);
				}

				lgKb.nextLang = lgKb.getNextLangCode(lgKb.selectedLang);
				if(lgKb.isLgBrowser())
				{
					lgKb.bMouseOn = (window.NetCastGetMouseOnOff() == 'on') ? true : false;
					
					//HID initialize
					lgKb.initHID();
					
					//voice
					lgKb.voiceInit();
				}

				lgKb.addLangJs(lgKb.selectedLang);
			},
		initHID :
			function ()
			{
				lgKb.hidSelectedLangCodeList = "";
				if(window.NetCastHIDInitialize)
				{
					for(var index=0; index<lgKb.langInfoList.length; index++)
					{
						if(lgKb.langInfoList[index].bSel)
						{
							lgKb.hidSelectedLangCodeList += lgKb.langInfoList[index].code + " ";
						}
					}
					
					lgKb.hidSelectedLangCodeList = lgKb.hidSelectedLangCodeList.substring(0, lgKb.hidSelectedLangCodeList.length - 1);
					window.NetCastHIDInitialize(lgKb.hidSelectedLangCodeList);
					window.addEventListener("HIDLanguageChange", function() { lgKb.changeLangJs(lgKb.nextLang); }, true);
					window.NetCastHIDChangeLanguage(lgKb.getLangCodeFromId(lgKb.selectedLang));
					lgKb.bHIDSessionInit = true;
				}
			},
		initHIDSession :
			function ()
			{
				if(window.NetCastHIDLanguageList && (lgKb.bHIDSessionInit == false))
				{
					window.NetCastHIDLanguageList(lgKb.hidSelectedLangCodeList);
					window.NetCastHIDChangeLanguage(lgKb.getLangCodeFromId(lgKb.selectedLang));
					lgKb.bHIDSessionInit = true;
				}
			},
		closeHIDSession :
			function ()
			{
				if(window.NetCastSystemKeyboardSession && (lgKb.bHIDSessionInit == true))
				{
					window.NetCastSystemKeyboardSession("CLOSE");
				}
				lgKb.bHIDSessionInit = false;
			},
		changeHIDLanguage :
			function (strLangCode)
			{
				if(window.NetCastHIDChangeLanguage && (lgKb.bHIDSessionInit == true))
				{
					window.NetCastHIDChangeLanguage(strLangCode);
				}
			},
		setCookieLanguage :
			function (selLang, langList)
			{
				lgKb.selectedLang = selLang;
				var arrLang = langList.split("|");
				
				for(var i=0; i<arrLang.length; i++)
				{
					lgKb.setSelLang(arrLang[i], true);
				}
			},
		setDefaultLanguage :	
			function ()
			{
				var cookieList = "";
			
				lgKb.setSelLang("en", true);
				lgKb.selectedLang = "en";
									
				if(lgKb.isLgBrowser())
				{
					if(lgVkDevice.tvLanguage2 != "")
					{
						lgKb.selectedLang = lgVkDevice.tvLanguage2;
						lgKb.setSelLang(lgKb.selectedLang, true);				
					}
				}
				
				lgKb.setCookie("VKbLangList", cookieList);
				lgKb.setCookie("VKbSelectedLang", lgKb.selectedLang);
			},
		changeLangJs :
			function (strLangCode)
			{
				lgKb.category = "";
				lgKb.removeLangJs(lgKb.selectedLang);
				lgKb.selectedLang = lgKb.getLangIdFromCode(strLangCode);
				lgKb.nextLang = lgKb.getNextLangCode(lgKb.selectedLang);
				lgKb.addLangJs(lgKb.selectedLang);
				
				// show language popup on changing lang
				var selLang = lgKb.getLangNameFromCode(strLangCode);
				lgKb.showLangPopup(selLang);
				setTimeout(function () {lgKb.hideLangPopup();}, 1000);
				
				if(lgKb.isLgBrowser())
				{
					//hid language change
					lgKb.changeHIDLanguage(strLangCode);
				}
				
				lgKb.setCookie("VKbSelectedLang", lgKb.selectedLang);
			},
		addLangJs :
			function (strLang)
			{
				//	Load Keyboard Language
				var strLangJs = lgKb.vKbJsRootPath + "lang/" + lgKb.getLangJs(strLang);

				var head = document.getElementsByTagName( 'HEAD' )[ 0 ];
				
				var script = document.createElement("script");
				script.id = "lang_" + strLang;
				script.type = "text/javascript";
				script.src = strLangJs;
				script.onload = function() { lgKb.initKeyboardLayout(); };
				head.appendChild(script);
			},
		removeLangJs :
			function (strLang)
			{
				if(strLang == "")
				{
					return;
				}
				
				var head = document.getElementsByTagName( 'HEAD' )[ 0 ];
				
				var script = document.getElementById("lang_" + strLang);
				head.removeChild(script);
			},
		getLangJs :
			function (strLang)
			{
				var langJs = "english.js";
					
				for(var index=0; index<lgKb.langInfoList.length; index++)
				{
					if(strLang == lgKb.langInfoList[index].id)
					{
						langJs = lgKb.langInfoList[index].langJs;
						break;
					}
				}

				return langJs;
			},
		setCookie :
			function (name, value, day)
			{
				cookies = name + '=' + escape(value) + '; path=/ '; // 한글 깨짐을 막기위해 escape(value)를 합니다.
				if(typeof day == 'undefined')
				{
					day = 356;
				}
				
				var expire = new Date();
				expire.setDate(expire.getDate() + day);
				cookies += ';expires=' + expire.toGMTString() + ';';
				
				document.cookie = cookies;
			},
		getCookie :
			function (name)
			{
				name = name + '=';
				var cookieData = document.cookie;
				var start = cookieData.indexOf(name);
				var value = '';
				if(start != -1)
				{
					start += name.length;
					var end = cookieData.indexOf(';', start);
					if(end == -1)
					{
						end = cookieData.length;
					}
					value = cookieData.substring(start, end);
				}
				return unescape(value);
			},
		setPreviousFocus :
			function ()
			{
				if(lgKb.targetElement)
				{
					lgKb.targetElement.focus();
				}
			},
		refreshFocus :
			function ()
			{
				if(lgKb.targetElement)
				{
					lgKb.targetElement.blur();
					lgKb.targetElement.focus();
				}
			},
		initKeyboardLayout :
			function ()
			{
				lgKb.miniPopUpInfoObjects = new Array();
				
				changeKeyValue(lgKb.category);
				setNewMode(0);
				lgKb.toggleKeyChange();
				lgKb.setKeyName();
				initialize();
				if(!lgKb.bShowVKeyboard)
				{
					lgKb.vKeyboard.style.display = 'none';
					lgKb.popupLangSel.style.top = "0px";
					lgKb.popupLangSel.style.display = 'none';
				}					
			},
		toggleKeyChange :
			function ()
			{
				lgKb.setInnerHtml("wkk_key_lang_toggle", lgKb.nextLang.toUpperCase());	// Lang Toggle	
				lgKb.setInnerHtml("wkk_key_char_sel", lgKb.nextChar);					// Character
				
				lgKb.toggleShiftKey(false);
			},
		setKeyName :
			function ()
			{
				lgKb.setInnerHtml("wkk_key_clear", STR_VK_CLEAR);
				lgKb.setInnerHtml("LangTitle", LANG_POPUP_TITLE);
				lgKb.setInnerHtml("message", LANG_POPUP_MAX_SEL_DESC);
				lgKb.setInnerHtml("popup_btn_ok", LANG_POPUP_OK);
				lgKb.setInnerHtml("popup_btn_cancel", LANG_POPUP_CANCEL);
			},
		toggleShiftKey :
			function (bOver)
			{
				if(bOver)
				{
					if(lgKb.selectedCaps == 'shift')
					{
						lgKb.setElementBackground("wkk_key_shift_toggle", "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn12_F.png')");
					}
					else
					{
						lgKb.setElementBackground("wkk_key_shift_toggle" ,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn13_F.png')");
					}
					
					lgKb.mouseOverKeyId = "wkk_key_shift_toggle";
				}
				else
				{
					if(lgKb.selectedCaps == 'shift')
					{
						lgKb.setElementBackground("wkk_key_shift_toggle", "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn12_N.png')");
					}
					else
					{
						lgKb.setElementBackground("wkk_key_shift_toggle" ,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn13_N.png')");
					}
				}
			},
		doHighlight :
			function (event)
			{
				keyId = event.target.id;
				
				if(keyId.search(/wkk_key/)>=0)
				{
					if(event.type == 'mouseover')
					{
						if((event.target.firstChild == null) || (event.target.firstChild.nodeValue != " "))
						{	
							if(keyId == 'wkk_key_voice')
							{
								if(lgKb.bVoiceEnabled)
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Voice_F.png')");
							}
							else if(keyId == 'wkk_key_kb_up')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Up_F.png')");
							}
							else if(keyId == 'wkk_key_lang_sel')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn4_F.png')");
							}
							else if(keyId == 'wkk_key_clear' || keyId == 'wkk_key_clear_p')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_F.png')");
							}
							else if(keyId == 'wkk_key_enter')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn7_F.png')");
							}
							else if(keyId == 'wkk_key_backspace')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn6_F.png')");
							}
							else if(keyId == 'wkk_key_shift_toggle')
							{
								if(lgKb.selectedCaps == 'shift')
								{
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn12_F.png')");
								}
								else
								{
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn13_F.png')");
								}
							}
							else if(keyId == 'wkk_key_left')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn8_F.png')");
							}
							else if(keyId == 'wkk_key_right')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn9_F.png')");
							}
							else if(keyId == 'wkk_key_char_sel')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_F.png')");
							}
							else if(keyId == 'wkk_key_kb_down')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Down_F.png')");
							}
							else if(keyId == 'wkk_key_spacebar')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn11_F.png')");
							}
							else if(keyId == 'wkk_key_hide')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn10_F.png')");
							}
							else
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_F.png')");		
							}
							
							lgKb.mouseOverKeyId = keyId;
						}
						
						if(lgKb.bMiniPopupshow)
						{
							lgKb.showMiniPopup(false);
						}	
					}
					else if(event.type == 'mouseout')
					{
						if((event.target.firstChild == null) || (event.target.firstChild.nodeValue != " "))
						{
							if(keyId == 'wkk_key_voice')
							{
								if(lgKb.bVoiceEnabled)
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Voice_N.png')");
							}
							else if(keyId == 'wkk_key_kb_up')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Up_N.png')");
							}
							else if(keyId == 'wkk_key_lang_sel')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn4_N.png')");
							}
							else if(keyId == 'wkk_key_clear' || keyId == 'wkk_key_clear_p')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_N2.png')");
							}
							else if(keyId == 'wkk_key_enter')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn7_N.png')");
							}
							else if(keyId == 'wkk_key_backspace')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn6_N.png')");
							}
							else if(keyId == 'wkk_key_lang_toggle')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn2_N.png')");
							}
							else if(keyId == 'wkk_key_shift_toggle')
							{
								if(lgKb.selectedCaps == 'shift')
								{
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn12_N.png')");
								}
								else
								{
									lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn13_N.png')");
								}
							}
							else if(keyId == 'wkk_key_left')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn8_N.png')");
							}
							else if(keyId == 'wkk_key_right')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn9_N.png')");
							}
							else if(keyId == 'wkk_key_char_sel')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn3_N.png')");
							}
							else if(keyId == 'wkk_key_kb_down')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Down_N.png')");
							}
							else if(keyId == 'wkk_key_spacebar')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn11_N.png')");
							}
							else if(keyId == 'wkk_key_hide')
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn10_N.png')");
							}
							else
							{
								lgKb.setElementBackground(keyId,"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_N.png')");		
							}	
						}
					}
				}	
			},
		keyStroke :
			function (event)
			{
				var keyId = event.target.id;
				
				if(lgKb.bShowMouseMoveBlockWnd)
				{
					lgKb.showMouseMoveBlockWnd(false);
				}
				
				if(keyId.search(/wkk_key/)>=0)
				{
					switch(keyId)
					{
						case 'wkk_key_voice' :
							lgKb.startVoiceRecognition();
							break;
						case 'wkk_key_kb_up' :
							lgKb.moveKeboard("up");
							break;
						case 'wkk_key_kb_down' :
							lgKb.moveKeboard("down");
							break;
						case 'wkk_key_lang_sel' :
							lgKb.showPopupLangSel(true);
							break;
						case 'wkk_key_clear' :
			  				lgKb.clearText();
			  				break;
						case 'wkk_key_clear_p' :
			  				lgKb.clearText();
			  				break;	
						case 'wkk_key_lang_toggle' :
							lgKb.changeLangJs(event.target.firstChild.nodeValue);
							break;
						case 'wkk_key_shift_toggle' :
							lgKb.toggleShift();
							break;
						case 'wkk_key_enter' :
							lgKb.enterInputField();
							break;
						case 'wkk_key_backspace' : 
							backspaceText();
							break;
						case 'wkk_key_left' : 
							lgKb.inputBoxControl('left');
							break;
						case 'wkk_key_right' :
							lgKb.inputBoxControl('right');
							break;
						case 'wkk_key_char_sel' : 
							lgKb.category = event.target.firstChild.nodeValue;
							changeKeyValue(lgKb.category);
							break;
						case 'wkk_key_spacebar' :
							addSpaceText();
							break;
						case 'wkk_key_hide' :
							lgKb.focusOut();
							break;
						default : 
							if(event.target.firstChild.nodeValue != " ")
							{
								appendText(event.target);
							}
							break;
					}
				}
			},
		toggleShift :
			function ()
			{
				lgKb.category = lgKb.nextCaps;
				changeKeyValue(lgKb.category);
				lgKb.toggleShiftKey(true);
			},
		getTextContent :
			function ()
			{
				var textItem = lgKb.targetElement;
				if(textItem != null)
				{
					return textItem.value;
				}
				return null;
			},
		setTextContent :
			function (value)
			{
				var textItem = lgKb.targetElement;
				if(textItem != null)
				{		
					textItem.value = value;
					if (lgKb.onChange) {
						setTimeout(function() {
							lgKb.onChange(textItem);
						}, 0);
					}
					
				}
			},
		getKeyValue :
			function (keyId)
			{
				var keyItem = document.getElementById(keyId);	
				if(keyItem != null)
				{
					return keyItem.firstChild.nodeValue;
				}
				else
				{
					return null;
				}
			},
		clearText :
			function ()
			{
				lgKb.targetElement.value = "";
				lgKb.clearCaretInfo();
			},
		voiceInit :
			function ()
			{
				if (!lgVkDevice.supportVoiceRecog || !lgVkVoice.isEnable || !lgVkVoice.isInitialized)
				{
			        //disable  the voice button ? in keyboard make the voice button not accessible to key navigation and mouse click
					lgKb.bVoiceEnabled = false;
				}
				else
				{
					lgKb.bVoiceEnabled = true;
					lgKb.setElementBackground('wkk_key_voice',"url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn_KB_Voice_N.png')");
					//add on voice received handler
					lgVkVoice.onrecognizevoice = lgKb.handleRecognizeVoiceEvent;
				}
			},
		startVoiceRecognition :
			function ()
			{
				lgKb.showMouseMoveBlockWnd(true);
				lgVkVoice.startRecognition();
			},
		handleRecognizeVoiceEvent :
			function (event)
			{
				if (event)
				{
					lgKb.addStrIntoFld(event, true);
					lgKb.clearCaretInfo();
				}
				
				if(window.NetCastGetMouseOnOff() == 'on')
				{
					lgKb.lgMouseOn(true);
				}
				else
				{
					lgKb.lgMouseOn(false);
				}
			},
		popupInit :
			function (bReopen)
			{
				if(bReopen == true)// first open
				{
					lgKb.popPageIdx = 0;
					lgKb.getSelectedLang();
				}
				lgKb.maxPageCnt = Math.floor((lgKb.langInfoList.length - 1)/lgKb.nPageFullItemCnt + 1);
				
				if(lgKb.popPageIdx < (lgKb.maxPageCnt - 1))
				{
					document.getElementById('arrowRight').style.visibility = '';
					lgKb.itemCnt = lgKb.nPageFullItemCnt;
				}
				else
				{
					document.getElementById('arrowRight').style.visibility = 'hidden';
					lgKb.itemCnt = (lgKb.langInfoList.length - lgKb.nPageFullItemCnt * lgKb.popPageIdx);
				}
				
				if(lgKb.popPageIdx > 0)
				{
					document.getElementById('arrowLeft').style.visibility = '';
				}
				else
				{
					document.getElementById('arrowLeft').style.visibility = 'hidden';
				}
				
					lgKb.setPopupKeyText("pageCnt", "page " + (lgKb.popPageIdx + 1) + "/" + lgKb.maxPageCnt);
				
				
				var strIndex;
				var nPageStart = lgKb.popPageIdx * lgKb.nPageFullItemCnt;
				var keyIndex;
				var keyItem;
				var index;

				for(index=0; index<lgKb.itemCnt; index++)
				{
					strIndex = "0" + index;
					keyIndex = "popup_item_" + strIndex.substr(strIndex.length - 2, 2);
					keyItem = document.getElementById(keyIndex);
					
					lgKb.setPopupKeyText(keyIndex, lgKb.langInfoList[nPageStart + index].title);
					
					if(lgKb.langInfoList[nPageStart + index].bCandidate)
					{
						keyItem.className = "popupLangItemNormalSelected";
					}
					else
					{
						if(lgKb.nSelLangCnt == 3)
						{
							keyItem.className = "popupLangItemDimmed";
						}
						else
						{
							keyItem.className = "popupLangItemNormal";
						}
					}
					
					keyItem.langId = lgKb.langInfoList[nPageStart + index].id;
				}
				
				for(; index<lgKb.nPageFullItemCnt; index++)
				{
					strIndex = "0" + index;
					keyIndex = "popup_item_" + strIndex.substr(strIndex.length - 2, 2);
					keyItem = document.getElementById(keyIndex);
					
					lgKb.setPopupKeyText(keyIndex, " ");
					
					keyItem.className = "popupLangItemNone";
					keyItem.langId = "";
				}
			},
		getSelectedLang :
			function ()
			{
				lgKb.nSelLangCnt = 0;
				var len = lgKb.langInfoList.length;
				for(var index=0; index<len; index++)
				{
					if(lgKb.langInfoList[index].bSel)
					{
						lgKb.nSelLangCnt++;
					}
				}
				lgKb.setPopupKeyText("langCnt", lgKb.nSelLangCnt + LANG_POPUP_SELECTED_CNT);
			},
		increaseSelectedLangCnt :
			function (bIncrease)
			{
				var bRtn = false;
				
				if(bIncrease)
				{
					if(lgKb.nSelLangCnt < lgKb.nMaxSelLangCnt)
					{
						lgKb.nSelLangCnt++;
						bRtn = true;
					}
					else
					{
						bRtn = false;
					}
					
					if(lgKb.nSelLangCnt == lgKb.nMaxSelLangCnt)
					{
						var strIndex;
						var keyIndex;
						var keyItem;
						var index;
						for(index=0; index<lgKb.itemCnt; index++)
						{
							strIndex = "0" + index;
							keyIndex = "popup_item_" + strIndex.substr(strIndex.length - 2, 2);
							keyItem = document.getElementById(keyIndex);
							if(keyItem.className == "popupLangItemNormalSelected")
							{
							}
							else if(keyItem.className == "popupLangItemNormal")
							{
								keyItem.className = "popupLangItemDimmed";
							}
						}
					}
				}
				else
				{
					if(lgKb.nSelLangCnt == lgKb.nMaxSelLangCnt)
					{
						var strIndex;
						var keyIndex;
						var keyItem;
						var index;
						for(index=0; index<lgKb.itemCnt; index++)
						{
							strIndex = "0" + index;
							keyIndex = "popup_item_" + strIndex.substr(strIndex.length - 2, 2);
							keyItem = document.getElementById(keyIndex);
							if(keyItem.className == "popupLangItemDimmed")
							{
								keyItem.className = "popupLangItemNormal";
							}
						}
					}
					lgKb.nSelLangCnt--;
					bRtn = true;
				}
				
				if(bRtn)
				{
					lgKb.setPopupKeyText("langCnt", lgKb.nSelLangCnt + LANG_POPUP_SELECTED_CNT);
				}
				
				return bRtn;
			},
		popHighlight :
			function (event)
			{
				var key = event.target;
				if(key.id.search(/popup_item/) >= 0)
				{
					if(key.className != "popupLangItemNone")
					{
						if(event.type == 'mouseover')
						{
							lgKb.fireMouseOut(lgKb.popOverKeyId);
							
							if(key.className == "popupLangItemNormal")
							{
								key.className = "popupLangItemFocus";
							}
							else if(key.className == "popupLangItemDimmed")
							{
								key.className = "popupLangItemFocusDimmed";
							}
							else if(key.className == "popupLangItemNormalSelected")
							{
								key.className = "popupLangItemFocusSelected";
							}
							
							lgKb.popOverKeyId = key.id;
						}
						else if(event.type == 'mouseout')
						{
							if(key.className == "popupLangItemFocus")
							{
								key.className = "popupLangItemNormal";
							}
							else if(key.className == "popupLangItemFocusDimmed")
							{
								key.className = "popupLangItemDimmed";
							}
							else if(key.className == "popupLangItemFocusSelected")
							{
								key.className = "popupLangItemNormalSelected";
							}
						}
					}
				}
				else if(key.id.search(/popup_btn/) >= 0)
				{
					if(event.type == 'mouseover')
					{
						lgKb.fireMouseOut(lgKb.popOverKeyId);
						key.className = "popupBtnFocus";
						lgKb.popOverKeyId = key.id;
					}
					else if(event.type == 'mouseout')
					{
						key.className = "popupBtnNormal";
					}
					else if(event.type == 'mousedown')
					{
						key.className = "popupBtnDown";				
					}
					else if(event.type == 'mouseup')
					{
						key.className = "popupBtnFocus";				
					}
				}
				else
				{
					if(key.id.search(/arrowLeft/) >= 0)
					{
						if(event.type == 'mouseover')
						{
							lgKb.fireMouseOut(lgKb.popOverKeyId);
							key.className = "popupLeftArrowFocus";
						}
						else if(event.type == 'mouseout')
						{
							key.className = "popupLeftArrow";
						}
						else if(event.type == 'mousedown')
						{
							key.className = "popupLeftArrowDown";				
						}
						else if(event.type == 'mouseup')
						{
							key.className = "popupLeftArrowFocus";				
						}
					}
					else if(key.id.search(/arrowRight/) >= 0)
					{
						if(event.type == 'mouseover')
						{
							lgKb.fireMouseOut(lgKb.popOverKeyId);
							key.className = "popupRightArrowFocus";
						}
						else if(event.type == 'mouseout')
						{
							key.className = "popupRightArrow";
						}
						else if(event.type == 'mousedown')
						{
							key.className = "popupRightArrowDown";	
						}
						else if(event.type == 'mouseup')
						{
							key.className = "popupRightArrowFocus";
						}
					}
				}
			},
		setSelLangList :
			function ()
			{
				var bRefreshAll = true;
				var len = lgKb.langInfoList.length;
				
				//HID language List
				lgKb.hidSelectedLangCodeList = "";
				var cookieList = "";
				
				for(var index=0; index<len; index++)
				{
					if(lgKb.langInfoList[index].bCandidate)
					{
						lgKb.langInfoList[index].bSel = true;
						if(lgKb.selectedLang == lgKb.langInfoList[index].id)
						{
							bRefreshAll = false;
						}
						
						lgKb.hidSelectedLangCodeList += lgKb.langInfoList[index].code + " ";
						cookieList += lgKb.langInfoList[index].id + "|";
					}
					else
					{
						lgKb.langInfoList[index].bSel = false;
					}		
				}
				
				lgKb.hidSelectedLangCodeList = lgKb.hidSelectedLangCodeList.substring(0, lgKb.hidSelectedLangCodeList.length - 1); // trim the last space
				if(lgKb.isLgBrowser())
				{
					lgKb.initHIDSession();
				}
				
				lgKb.setCookie("VKbLangList", cookieList);
				
				lgKb.refreshVKeyboard(bRefreshAll);
			},
		resetSelLangList :
			function ()
			{
				var len = lgKb.langInfoList.length;
				for(var index=0; index<len; index++)
				{
					if(lgKb.langInfoList[index].bSel)
					{
						lgKb.langInfoList[index].bCandidate = true;
					}
					else
					{
						lgKb.langInfoList[index].bCandidate = false;
					}
				}
			},
		popupKeyStroke :
			function (event)
			{
				var key = event.target;
				if(lgKb.popPageIdx == '0' && key.id == 'popup_item_00')
				{
					return;
				}
				
				if(key.id.search(/popup_item/)>=0)
				{
					if(key.className != "popupLangItemNone" && key.className != "popupLangItemDimmed" && key.className != "popupLangItemFocusDimmed")
					{
						if(key.className == "popupLangItemFocus")
						{
							if(lgKb.increaseSelectedLangCnt(true))
							{
								lgKb.setLangCandidate(key.langId, true);
								key.className = "popupLangItemFocusSelected";
							}
						}
						else
						{
							key.className = "popupLangItemFocus";
							lgKb.increaseSelectedLangCnt(false);
							lgKb.setLangCandidate(key.langId, false);
							
						}
					}
					
				}
				else if(key.id == 'popup_btn_ok')
				{
					if(lgKb.nSelLangCnt > 0)
					{
						lgKb.setSelLangList();
					}
					else
					{
						alert(LANG_POPUP_LOWER_LIMIT);
					}
				}
				else if(key.id == 'popup_btn_cancel')
				{
					lgKb.resetSelLangList();
					lgKb.showPopupLangSel(false);
				}
				else if(key.id.search(/arrowLeft/) >= 0)
				{
					lgKb.popPageIdx--;
					lgKb.popupInit();
					
					lgKb.fireMouseOver('popup_item_11');
					lgKb.popOverKeyId = 'popup_item_11';
				}
				else if(key.id.search(/arrowRight/) >= 0)
				{
					lgKb.popPageIdx++;
					lgKb.popupInit();
					lgKb.fireMouseOver('popup_item_09');
					lgKb.popOverKeyId = 'popup_item_09';
				}
			},
		getTextFromKeyCode :
			function (keyCode)
			{
				var keyName = "keyCode_" + keyCode;
				var keyItem = document.getElementsByName(keyName)[0];
				
				return keyItem;
			},
		moveUp :
			function ()
			{
				var keyId = "";
				var nextkeyId = lgKb.mouseOverKeyId;
				
				switch(lgKb.mouseOverKeyId)
				{
					case 'wkk_key_lang_sel' :
						if(lgKb.bVoiceEnabled)
						{
							return 'wkk_key_voice';
						}
						else
						{
							break;
						}
					case 'wkk_key_lang_toggle' :				
					case 'wkk_key_shift_toggle' :
						return 'wkk_key_lang_sel';
						
					case 'wkk_key_char_sel' :
						return 'wkk_key_shift_toggle';
						
					case lgKb.toggleKeyId :
						return 'wkk_key_char_sel';
						
					case 'wkk_key_clear' :
						return keyId;
						
					case 'wkk_key_backspace' : 
						return 'wkk_key_clear';
						
					case 'wkk_key_enter' :
						return 'wkk_key_backspace';
						
					case 'wkk_key_left' :
					case 'wkk_key_right' :
						return 'wkk_key_enter';
						
					case 'wkk_key_hide' :
						return 'wkk_key_left';
						
					case 'wkk_key_spacebar' :
						return lgKb.downPosition;
				}
				
				if(keyId == "")
				{
					var y = nextkeyId.charAt(8);
					var x = nextkeyId.substr(9,2);

					if(new Number(y)>0)
					{
						y = new Number(y)-1;
						keyId = 'wkk_key_' + y + x;
						
						while((y >= 0) && (document.getElementById(keyId).firstChild.nodeValue == " "))
						{
							y = new Number(y)-1;
							keyId = 'wkk_key_' + y + x;
						}
						
						if(y < 0)
						{
							keyId = "";
						}
					}
				}
				return keyId;
			},
		moveDown :
			function ()
			{
				var keyId = "";
				
				switch(lgKb.mouseOverKeyId)
				{
					case 'wkk_key_voice' :
						return 'wkk_key_lang_sel';
						
					case lgKb.toggleKeyId :
						break;
					
					case 'wkk_key_lang_sel' :
						return 'wkk_key_lang_toggle';

					case 'wkk_key_lang_toggle' :					
					case 'wkk_key_shift_toggle' :
						return 'wkk_key_char_sel';

					case 'wkk_key_char_sel' :
						return lgKb.toggleKeyId;
						
					case lgKb.toggleKeyId :
						return keyId;
						
					case 'wkk_key_clear' :
						return 'wkk_key_backspace';

					case 'wkk_key_backspace' : 
						return 'wkk_key_enter';

					case 'wkk_key_enter' :
						return 'wkk_key_left';

					case 'wkk_key_left' :
					case 'wkk_key_right' :
						return 'wkk_key_hide';

					case 'wkk_key_hide' :
						return keyId;
						
					case 'wkk_key_spacebar' :
						return keyId;	
				}

				if(keyId == "")
				{
					var y = lgKb.mouseOverKeyId.charAt(8);
					var x = lgKb.mouseOverKeyId.substr(9,2);
					
					if(new Number(y)<4)
					{
						if(Number(y) == 3 && (Number(x) == 5 || Number(x) == 6 || Number(x) == 7 || Number(x) == 8 || Number(x) == 9 || Number(x) == 10 ))
						{	
							lgKb.downPosition  ='wkk_key_' + y + x;
							return keyId = 'wkk_key_spacebar';
						}

						y = new Number(y)+1;
						keyId = 'wkk_key_' + y + x;

						while((y <= 4) && (document.getElementById(keyId).firstChild.nodeValue == " "))
						{
							y = new Number(y)+1;
							keyId = 'wkk_key_' + y + x;
						}
						
						if(y > 4)
						{
							keyId = "";
						}
					}
				}
				return keyId;
			},
		moveLeft :
			function ()
			{
				var keyId = "";
				var nextkeyId = lgKb.mouseOverKeyId;
				switch(lgKb.mouseOverKeyId)
				{
					case 'wkk_key_000' :
						if(lgKb.bVoiceEnabled)
						{
							return 'wkk_key_voice';
						}
						else
						{
							return 'wkk_key_clear';
						}
					case 'wkk_key_001' :
						if(lgKb.bVoiceEnabled)
						{
							return 'wkk_key_voice';
						}
						else
						{
							return 'wkk_key_clear';
						}
					case 'wkk_key_voice' :
						return 'wkk_key_clear';
				
					case 'wkk_key_lang_sel' :
						return 'wkk_key_backspace';

					case 'wkk_key_lang_toggle' : 
						return 'wkk_key_enter';

					case 'wkk_key_shift_toggle' :
						return 'wkk_key_lang_toggle';

					case 'wkk_key_char_sel' :
						return 'wkk_key_right';
						
					case lgKb.toggleKeyId :
						return 'wkk_key_hide';
						
					case 'wkk_key_clear' :
						nextkeyId = 'wkk_key_015';
						break;
						
					case 'wkk_key_backspace' : 
						nextkeyId = 'wkk_key_115';
						break;
						
					case 'wkk_key_enter' :
						nextkeyId = 'wkk_key_215';
						break;
						
					case 'wkk_key_left' :
						nextkeyId = 'wkk_key_315';
						break;
						
					case 'wkk_key_right' :
						return 'wkk_key_left';

					case 'wkk_key_hide' :
						nextkeyId = 'wkk_key_415';
						break;
						
					case 'wkk_key_spacebar' :
						nextkeyId = 'wkk_key_405';
						break;
						
					case 'wkk_key_401':
						return lgKb.toggleKeyId;
				}

				if(keyId == "")
				{
					var y = nextkeyId.charAt(8);
					var x = nextkeyId.substr(9,2);
					
					if(x > 0)
					{
						x = new Number(x)-1;
						keyId = lgKb.getKeyIdfromXY(x,y);
						
						while( (x > 0) && (document.getElementById(keyId).firstChild.nodeValue == " "))
						{				
							x = new Number(x)-1;
							keyId = lgKb.getKeyIdfromXY(x,y);
							
							if( keyId == 'wkk_key_411')
							{
								return 'wkk_key_spacebar';
							}
						}
						if( x == 0 )
						{
							switch(y)
							{
								case '0' :
									keyId = 'wkk_key_kb_up';
									break;
								case '1' :
									keyId = 'wkk_key_lang_sel';
									break;
								case '2' :
									keyId = 'wkk_key_shift_toggle';
									break;
								case '3' :
									keyId = 'wkk_key_char_sel';
									break;
								case '4' :
									keyId = 'wkk_key_kb_down';
									break;	
							}
						}
					}
				}
				return keyId;
			},
		moveRight :
			function ()
			{
				var keyId = "";
				var nextkeyId = lgKb.mouseOverKeyId;
				switch(lgKb.mouseOverKeyId)
				{
					case lgKb.toggleKeyId :
						nextkeyId = 'wkk_key_400';
						break;
				
					case 'wkk_key_voice' :
						nextkeyId = 'wkk_key_000';
						break;

					case 'wkk_key_lang_sel' :
						nextkeyId = 'wkk_key_100';
						break;
						
					case 'wkk_key_lang_toggle' : 
						return 'wkk_key_shift_toggle';
						
					case 'wkk_key_shift_toggle' :
						nextkeyId = 'wkk_key_200';
						break;
						
					case 'wkk_key_char_sel' :
						nextkeyId = 'wkk_key_300';
						break;

					case 'wkk_key_kb_down' :
						nextkeyId = 'wkk_key_400';
						break;

					case 'wkk_key_clear' :
						if(lgKb.bVoiceEnabled)
						{
							return 'wkk_key_voice';
						}
						else
						{
							nextkeyId = 'wkk_key_000';
							break;
						}

					case 'wkk_key_backspace' : 
						return 'wkk_key_lang_sel';

					case 'wkk_key_enter' :
						return 'wkk_key_lang_toggle';

					case 'wkk_key_left' :
						return 'wkk_key_right';
						
					case 'wkk_key_right' :
						return 'wkk_key_char_sel';
						
					case 'wkk_key_hide' :
						return lgKb.toggleKeyId;
						
					case 'wkk_key_spacebar' :
						nextkeyId = 'wkk_key_410';
						break;
				}

				if(keyId == "")
				{
					var y = nextkeyId.charAt(8);
					var x = nextkeyId.substr(9,2);
					
					if(x >= 0)
					{
						x = new Number(x)+1;
						keyId = lgKb.getKeyIdfromXY(x,y);
						
						while( (x < 14) && (document.getElementById(keyId).firstChild.nodeValue == " "))
						{				
							x = new Number(x)+1;
							keyId = lgKb.getKeyIdfromXY(x,y);
							
							if( keyId == 'wkk_key_405')
							{
								return 'wkk_key_spacebar';
							}
						}
						if( x == 14 )
						{
							switch(y)
							{
								case '0' :
									keyId = 'wkk_key_clear';
									break;
								case '1' :
									keyId = 'wkk_key_backspace';
									break;
								case '2' :
									keyId = 'wkk_key_enter';
									break;
								case '3' :
									keyId = 'wkk_key_left';
									break;
								case '4' :
									keyId = 'wkk_key_hide';
									break;	
							}
						}
					}
				}
				return keyId;
			},
		popKeyDown :
			function (event)
			{
				var keyCode;
				if(window.event)		// IE
				{
					keyCode = event.keyCode;
				}
				else if(event.which)	// Netscape/Firefox/Opera
				{
					keyCode = event.which;
				}
				else
				{
					return ;
				}
				var keyId = "";
				switch(keyCode)
				{				
					case VK_UP :
						keyId = lgKb.popMoveUp();
						break;
						
					case VK_DOWN :
						keyId = lgKb.popMoveDown();
						break;
						
					case VK_LEFT :
						keyId = lgKb.popMoveLeft();
						break;
						
					case VK_RIGHT :
						keyId = lgKb.popMoveRight();
						break;
						
					case VK_ENTER :
						lgKb.fireMouseClick(lgKb.popOverKeyId);
						break;
						
					default :
						break;
				}
				
				if(keyId != "")
				{
					lgKb.fireMouseOut(lgKb.popOverKeyId);
					lgKb.fireMouseOver(keyId);
				}
			},
		popMoveUp :
			function ()
			{
				var y;
				var keyId = "";
				var nextkeyId = lgKb.popOverKeyId;
					
				switch(lgKb.popOverKeyId)
				{
					case 'popup_btn_ok' :
						nextkeyId = 'popup_item_21';
						break;
					case 'popup_btn_cancel' :
						nextkeyId = 'popup_item_23';
						break;
				}
				
				if(keyId == "")
				{
					var num = nextkeyId.substr(11,2);

					num = new Number(num) - 3;
					keyId = lgKb.getKeyIdfromNum(num);
					
					y = Math.floor(num/3);
					
					while((y >= 0) && (document.getElementById(keyId).firstChild.nodeValue == " "))
					{
						num = new Number(num) - 3;
						keyId = lgKb.getKeyIdfromNum(num);
						
						y = Math.floor(num/3);
					}
					
					if(y < 0)
					{
						keyId = "";
					}
				}
				return keyId;
			},
		popMoveDown :
			function ()
			{
				var y;
				var keyId = "";
				var nextkeyId = lgKb.popOverKeyId;
				
				switch(lgKb.popOverKeyId)
				{
					case 'popup_btn_ok' :
					case 'popup_btn_cancel' :
						return keyId;
				}
				
				if(keyId == "")
				{
					var num = nextkeyId.substr(11,2);
					num = new Number(num) + 3;
					
					keyId = lgKb.getKeyIdfromNum(num);

					y = Math.floor(num/3);
					
					while((document.getElementById(keyId).firstChild.nodeValue == " "))
					{
						num = new Number(num) + 3;
						keyId = lgKb.getKeyIdfromNum(num);
						
						y = Math.floor(num/3);
						if(y == 7)
						{
							return 'popup_btn_ok';
						}
					}
				}
				return keyId;
			},
		popMoveLeft :
			function ()
			{
				var keyId = "";
				var nextkeyId = lgKb.popOverKeyId;
				switch(lgKb.popOverKeyId)
				{
					case 'popup_btn_ok' :
						return "";
					case 'popup_btn_cancel' : 
						return 'popup_btn_ok';
				}
				
				if(keyId == "")
				{
					var num = nextkeyId.substr(11,2);
					num = new Number(num);
					
					keyId = nextkeyId;
					
					if((new Number(num))%3 == 0)
					{
						if(lgKb.popPageIdx>0)
						{
							lgKb.popPageIdx--;
							lgKb.popupInit();
							num=new Number(num) +2;
							keyId = lgKb.getKeyIdfromNum(num);
						}
						return keyId;
					}
					else
					{
						num = new Number(num) - 1;
						keyId = lgKb.getKeyIdfromNum(num);
					}
				}
				return keyId;	
			},
		popMoveRight :
			function ()
			{
				var keyId = "";
				var nextkeyId = lgKb.popOverKeyId;
				switch(lgKb.popOverKeyId)
				{
					case 'popup_btn_ok' :
						return 'popup_btn_cancel';
					case 'popup_btn_cancel' : 
						return "";
				}

				if(keyId == "")
				{
					var num = nextkeyId.substr(11,2);
					num =new Number(num);
					
					keyId = nextkeyId;
					
					if((new Number(num))%3 == 2)
					{
						if(lgKb.popPageIdx<lgKb.maxPageCnt-1)
						{
							lgKb.popPageIdx++;
							lgKb.popupInit();
							num=new Number(num) -2;
							keyId = lgKb.getKeyIdfromNum(num);
						}
						return keyId;
					}
					
					else
					{
						num =new Number(num) + 1;
						keyId = lgKb.getKeyIdfromNum(num);
						
						if(document.getElementById(keyId).firstChild.nodeValue == " ")
						{
							return "";
						}
					}
				}
				return keyId;	
			},
		getKeyIdfromXY :
			function (x,y)
			{
				var keyId;
				if(x < 10)
				{
					keyId = 'wkk_key_' + y + '0' + x;
				}
				else 
				{
					keyId = 'wkk_key_' + y + x;	
				}	
				return keyId;
			},
		getKeyIdfromNum :
			function (num)
			{
				var keyId;
				if(num < 10)
				{
					keyId = 'popup_item_' + '0' + num; 
				}
				else if(num >= 10 && num<=20)
				{
					keyId = 'popup_item_' + num;
				}
				else if(num == 21||num == 22)
				{
					keyId = 'popup_btn_ok';
				}
				else if(num == 23)
				{
					keyId = 'popup_btn_cancel';
				}
				return keyId;
			},
		setPopupKeyText :
			function (keyId, value)
			{		
				var keyItem = document.getElementById(keyId);	
				
				if(keyItem != null)
				{
					keyItem.firstChild.nodeValue = value;	
				}
			},
		inputBoxControl :
			function (direct)
			{
				if(direct=='left')
				{
					lgKb.caretPrev();
				}
				else
				{
					lgKb.caretNext();
				}
			},
		caretMoved :
			function ()
			{
				setNewMode(0);
				lgKb.setCaretPosition(lgKb.getCaretPosition(), 0);
			},
		caretNext :
			function ()
			{
				setNewMode(0);
				var pos = lgKb.getCaretPosition();
				lgKb.setCaretPosition(new Number(pos) + 1, 0);
			},
		caretPrev :
			function ()
			{
				setNewMode(0);
				var ctrl = lgKb.targetElement;
				var pos = lgKb.getCaretPosition();	
					
				if(pos>ctrl.value.length)
				{
					pos = ctrl.value.length;
				}	
				lgKb.setCaretPosition(new Number(pos) -1, 0);
			},
		getCaretPosition :
			function ()
			{
				return lgKb.currentCaretIdx;
			},
		isCaretActivated :
			function ()
			{
				return lgKb.bCaretActivated;
			},
		setCaretPosition :
			function (pos, r)
			{
				if(pos<0)
				{
					pos = 0;
				}
				
				var ctrl = lgKb.targetElement;
				ctrl.focus();
				
				if(ctrl.setSelectionRange)				//	Netscape/Firefox/Opera
				{
					ctrl.setSelectionRange(pos, new Number(pos+r));
				}
				else if (ctrl.createTextRange)
				{
					var range = ctrl.createTextRange();	//IE...
					range.collapse(true);
					range.moveEnd('character', pos + r);
					range.moveStart('character', pos );
					range.select();
					ctrl.blur();
				}
				
				lgKb.currentCaretIdx = pos;
				if(r > 0 )
				{
					lgKb.bCaretActivated = true;
				}
				else
				{
					lgKb.bCaretActivated = false;
				}
			},
		addStrIntoFld :
			function (c , isNew)
			{
				var kTxt = lgKb.getTextContent();
				var kTxtLen = kTxt.length;
				
				var kSelected = lgKb.isCaretActivated();
				var kIdx = lgKb.getCaretPosition();
				var kIsEnd = false;
				if(kSelected)
				{
					kIsEnd = (kIdx >= (new Number(kTxtLen) - 1));
				}
				else
				{
					kIsEnd = (kIdx >= kTxtLen);
				}
				
				if(isNew)
				{ 
					if(kIsEnd)
					{ 				
						lgKb.addCharToEnd(kTxt, c);
					}
					else
					{
						if(kSelected)
						{
							lgKb.addCharInMiddle(kTxt, c, kIdx+1);
						}
						else
						{
							lgKb.addCharInMiddle(kTxt, c, kIdx);
						}
					}
				}
				else
				{			
					if(kIsEnd)
					{
						lgKb.overwriteCharToEnd(kTxt, c);
					}
					else
					{
						lgKb.overwriteCharInMiddle(kTxt, c, kIdx);
					}
				}
			},
		addCharToEnd :
			function (txt, c)
			{
				var kJoin = txt + c;
				if(c.length > 1)
				{
					lgKb.putStrIntoFld(kJoin, kJoin.length);
				}
				else
				{
					lgKb.putStrIntoFld(kJoin, txt.length);
				}
			},
		overwriteCharToEnd :
			function (txt, c)
			{
				var kTxt = txt.substr(0, txt.length -1);
				lgKb.putStrIntoFld(kTxt+c, kTxt.length);
			},
		addCharInMiddle :
			function (txt, c, idx)
			{
				var kTxt_0 = txt.substr(0, idx);
				var kTxt_1 = txt.substr(idx, txt.length);

				var kJoin = kTxt_0 + c + kTxt_1;
				if(c.length > 1)
				{
					lgKb.putStrIntoFld(kJoin, new Number(idx) + c.length-1);
				}
				else
				{
					lgKb.putStrIntoFld(kJoin, idx);
				}
			},
		overwriteCharInMiddle :
			function (txt, c, idx)
			{
				var kTxt_0 = txt.substr(0,idx);
				var kTxt_1 = txt.substr(new Number(idx)+1, txt.length);
				lgKb.putStrIntoFld(kTxt_0+ c + kTxt_1, idx);	
			},
		putStrIntoFld :
			function putStrIntoFld( str, idx)
			{
				var kStr = "";
				if( str != null && str.length > 0 )
				{
					kStr = str;
				}
				lgKb.setTextContent(kStr);

				if(kStr.length == 0 )
				{
					lgKb.setCaretPosition(0, 0);	
				}
				else
				{
					lgKb.setCaretPosition(new Number(idx)+1, 0);
				}
			},
		deletePrevChar :
			function ()
			{
				var kTxt = lgKb.getTextContent();
				var kSelected = lgKb.isCaretActivated();
				var ctrl = lgKb.targetElement;
				var kIdx = lgKb.getCaretPosition();
				if(kIdx>ctrl.value.length)
				{
					kIdx = ctrl.value.length;
				}

				if(!kSelected)
				{
					kIdx = kIdx -1;
				}
				var kResult = "";	
				if( kIdx > -1)
				{
					kResult = kTxt.substr(0,kIdx) + kTxt.substr(kIdx +1, kTxt.length);
					lgKb.putStrIntoFld(kResult, kIdx);	
					lgKb.setCaretPosition(kIdx, 0);
				}
			},
		isBlackKey :
			function (keyId)
			{
				var keyValue = lgKb.getKeyValue(keyId);
				
				if(keyValue == " ")
				{
					return true;
				}
				
				return false;
			},
		enterInputField :
			function ()
			{
				if(lgKb.targetElement.tagName == 'TEXTAREA')
				{
					lgKb.clearCaretInfo("EndOfSelection");	
					lgKb.addStrIntoFld("\n", true);
				}	
			},
		setKeyText :
			function (keyId, value, expKeys)
			{
				var keyItem = document.getElementById(keyId);	
				
				var bgImage = "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_N.png')";
				var blackBgImage = "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_D.png')";
					
				if(keyItem != null)
				{
					keyItem.firstChild.nodeValue = value;
					if(lgKb.isBlackKey(keyId))
					{			
						lgKb.setElementBackground(keyId, blackBgImage );
					}
					else
					{
						lgKb.setElementBackground(keyId, bgImage );
					}
					
					keyItem.keyArrStr = expKeys;
				}
			},
		setInnerHtml :
			function (elementId, html)
			{
				var e = document.getElementById(elementId);
				if(e != null)
				{
					e.innerHTML = html;
				}
			},
		setElementBackground :
			function (elementId, backGround)
			{
				var e = document.getElementById(elementId);
				if(e != null)
				{
					e.style.background = backGround;
				}
			},
		showLangPopup :
			function (lang)
			{
				var langPopUpDiv = document.getElementById("langPopUpDiv");
				lgKb.clearChildNodes(langPopUpDiv);
				langPopUpDiv.appendChild(document.createTextNode(lang));
				document.getElementById("langPopUpDiv").style.visibility = "visible";
			},
		hideLangPopup :
			function ()
			{
				document.getElementById("langPopUpDiv").style.visibility = "hidden";
			},
		clearChildNodes :
			function (nodeToClear)
			{
				for(var i = nodeToClear.childNodes.length; i > 0 ; i--)
				{
					nodeToClear.removeChild(nodeToClear.childNodes[i - 1]);
				}
			},
		setBtnClearFontStyle :
			function ()
			{
				document.getElementById("wkk_key_clear").style.fontSize = "24px";
			},
		setBtnClearLineHeightStyle :
			function ()
			{
				document.getElementById("wkk_key_clear").style.lineHeight = "48px";
			},
		showMiniPopup :
			function (bShow, event)
			{
				if(bShow)
				{
					var pKeys = event.target.keyArrStr;
					lgKb.miniPopKeyLength = pKeys.length + 1;
	
					lgKb.clearChildNodes(miniKeyPopupDiv);
					
					// set key value
					for(var i = 0; i < pKeys.length; i++)
					{
						var keyDiv = document.createElement("div");
						keyDiv.setAttribute("id", "lg_vk_mp_" + i);
						keyDiv.setAttribute("class", "horBtnMiniKeyNormal");
						keyDiv.appendChild(document.createTextNode(pKeys[i]));						
						miniKeyPopupDiv.appendChild(keyDiv);
					}

					//	back key
					var keyDiv = document.createElement("div");
					keyDiv.setAttribute("id", "lg_vk_mp_back");
					keyDiv.setAttribute("class", "horBtnMiniKeyBack");					
					miniKeyPopupDiv.appendChild(keyDiv);

					lgKb.CalculateMiniKeyPopupPosition(event);

					lgKb.miniKeyPopup.style.display = "block";
					lgKb.bMiniPopupshow = true;

					lgKb.miniPopOverkeyId = "lg_vk_mp_0";
					lgKb.fireMouseOver(lgKb.miniPopOverkeyId);
				}
				else
				{
					lgKb.miniKeyPopup.style.display = "none";
					lgKb.bMiniPopupshow = false;
					
					lgKb.lgMouseOn(lgKb.bMouseOn);
				}
				
			},
		CalculateMiniKeyPopupPosition :
			function (event)
			{
				var curParent = event.target.parentNode;
				var accuTop = event.target.offsetTop;
				var accuLeft = event.target.offsetLeft;
	
				// calculate accumulated offsetTop and offsetLeft from body
				while(curParent != document.body)
				{
					accuTop += curParent.offsetTop;
					accuLeft += curParent.offsetLeft;
					curParent = curParent.parentNode;
				}
				
				// give margin
				accuTop -= 19;
				accuLeft -= 19;
	
				// check if popup is out of screen
				if ((accuTop + miniKeyPopupDiv.offsetHeight) > 720)
				{
					accuTop = 720 - miniKeyPopupDiv.offsetHeight;
				}
				if (accuTop < 0)
				{
					accuTop = 0;
				}
				if ((accuLeft + miniKeyPopupDiv.offsetWidth) > 1280)
				{
					accuLeft = 1280 - miniKeyPopupDiv.offsetWidth;
				}
				if (accuLeft < 0)
				{
					accuLeft = 0;
				}
	
				// set position and visibility
				miniKeyPopupDiv.style.top = accuTop + "px";
				miniKeyPopupDiv.style.left = accuLeft + "px";
				miniKeyPopupDiv.style.width = (68 * Math.min(5, lgKb.miniPopKeyLength)) + "px";
			},
		minipopupKeyStroke :
			function (event)
			{
				var key = event.target;
				if(key.id.search(/back/)>=0)
				{
					// do nothing
				}
				else
				{
					// append mini key value to teatarea
					appendText(key);
				}
				lgKb.showMiniPopup(false);
			},
		miniPopHighlight :
			function (event)
			{
				var key = event.target;
				if(event.type == 'mouseover')
				{
					if(key.id.search(/lg_vk_mp_/) >= 0)
					{
						if(key.id.search(/back/) >= 0)
						{
							lgKb.setElementBackground(key.id, "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn8_F.png')");
						}
						else
						{
							lgKb.setElementBackground(key.id, "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_F.png')");
						}
						
						lgKb.miniPopOverkeyId = key.id;
					}
				}
				else if(event.type == 'mouseout')
				{
					if(key.id.search(/lg_vk_mp_/) >= 0)
					{
						if(key.id.search(/back/) >= 0)
						{
							lgKb.setElementBackground(key.id, "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn8_N.png')");
						}
						else
						{
							lgKb.setElementBackground(key.id, "url('" + lgKb.vKbJsRootPath + "image/Qwerty_Btn1_N.png')");
						}
					}
				}
			},
		miniPopKeydown :
			function (event)
			{
				var keyCode;
				if(window.event)		// IE
				{
					keyCode = event.keyCode;
				}
				else if(event.which)	// Netscape/Firefox/Opera
				{
					keyCode = event.which;
				}
				else
				{
					return ;
				}
				
				var keyId = "";
				switch(keyCode)
				{				
					case VK_UP :
						keyId = lgKb.miniPopMoveUp();
						break;
						
					case VK_DOWN :
						keyId = lgKb.miniPopMoveDown();
						break;
						
					case VK_LEFT :
						keyId = lgKb.miniPopMoveLeft();
						break;
						
					case VK_RIGHT :
						keyId = lgKb.miniPopMoveRight();
						break;
						
					case VK_ENTER :
						lgKb.fireMouseClick(lgKb.miniPopOverkeyId);
						break;
						
					default :
						break;
				}
				
				if(keyId != "")
				{
					lgKb.fireMouseOut(lgKb.miniPopOverkeyId);
					lgKb.fireMouseOver(keyId);
					lgKb.miniPopOverkeyId = keyId;
				}
			},
		miniPopMoveUp :
			function ()
			{
				var curkeyId = lgKb.miniPopOverkeyId;
				var keyId = "";

				if(curkeyId.search(/back/) >= 0)
				{
					if(lgKb.miniPopKeyLength > 5)
					{
						keyId = curkeyId.replace("back", (((lgKb.miniPopKeyLength - 1) / 5 - 1) * 5 + 4));
					}
				}
				else
				{
					var divNum = Number(curkeyId.substr(9,2));
					if(divNum >= 5)
					{
						keyId = curkeyId.replace(divNum, (divNum - 5));
					}
				}
				
				return keyId;
			},
		miniPopMoveDown :
			function ()
			{
				var curkeyId = lgKb.miniPopOverkeyId;
				var keyId = "";
	
				if(curkeyId.search(/back/) < 0)
				{
					var divNum = Number(curkeyId.substr(9,2));
					
					if(divNum == (((lgKb.miniPopKeyLength - 1) / 5 - 1) * 5 + 4))
					{
						keyId = "lg_vk_mp_back";
					}
					else if(divNum < (lgKb.miniPopKeyLength - 6))
					{
						keyId = curkeyId.replace(divNum, (divNum + 5));
					}
				}
			
				return keyId;
			},
		miniPopMoveLeft :
			function ()
			{
				var curkeyId = lgKb.miniPopOverkeyId;
				var keyId = "";

				if(curkeyId.search(/back/) >= 0)
				{
					var nNextNumber = lgKb.miniPopKeyLength - 2;
					if((nNextNumber % 5) < 4)
					{
						keyId = curkeyId.replace("back", nNextNumber);
					}
				}
				else
				{
					var divNum = Number(curkeyId.substr(9,2));
					var nNextNumber = divNum - 1;
					if((nNextNumber >= 0) && ((nNextNumber % 5) < 4))
					{
						keyId = curkeyId.replace(divNum, nNextNumber);
					}
				}
			
				return keyId;
			},
		miniPopMoveRight :
			function ()
			{
				var curkeyId = lgKb.miniPopOverkeyId;
				var keyId = "";
	
				if(curkeyId.search(/back/) < 0)
				{
					var divNum = Number(curkeyId.substr(9,2));
					var nNextNumber = divNum + 1;
					if((nNextNumber % 5) > 0)
					{
						if(nNextNumber == (lgKb.miniPopKeyLength - 1))
						{
							keyId = "lg_vk_mp_back";
						}
						else
						{
							keyId = curkeyId.replace(divNum, nNextNumber);
						}
					}
				}
			
				return keyId;
			}
	};

	window.addEventListener("load", function(event) {lgKb.initKeyboard(event);}, false);
	window.addEventListener("unload", function(event) {lgKb.cleanKeyboard(event);}, false);

	window.addEventListener("DOMFocusIn", function(event) {lgKb.WindowFocusIn(event);}, false);
	window.addEventListener("DOMFocusOut", function(event) {lgKb.WindowFocusOut(event);}, false);

	window.addEventListener("keydown", function(event) {lgKb.onRemoteKeyDown(event);}, true);
	window.addEventListener("keyup", function(event) {lgKb.onRemoteKeyUp(event);}, true);
	
	if(lgKb.isLgBrowser())
	{
		
		window.addEventListener("mouseon", function(event) {lgKb.lgMouseOn(true);}, true);
		window.addEventListener("mouseoff", function(event) {lgKb.lgMouseOn(false);}, true);
	}
})();
