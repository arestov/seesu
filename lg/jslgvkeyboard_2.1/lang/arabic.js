/*
	 LCD TV LABORATORY, LG ELECTRONICS INC., SEOUL, KOREA
	 Copyright(c) 2010 by LG Electronics Inc.

	 All rights reserved. No part of this work may be reproduced, stored in a
	 retrieval system, or transmitted by any means without prior written
	 permission of LG Electronics Inc.
*/

/*
	LG Virtual Keyboard Version 2.0
	

	Copyright (c) 2011 LG Electronics, All Rights Reserved
*/

/**
 * Arabic
 */

/**
 * key board page count
 */
var pageCnt = 2;

/**
 * label string seting
 */
var STR_VK_CLEAR = "حذف الكل";
var LANG_POPUP_TITLE = "Language Selection";
var LANG_POPUP_SELECTED_CNT = " languages are selected";
var LANG_POPUP_MAX_SEL_DESC = "You can select no more than " + lgKb.nMaxSelLangCnt + " languages.";
var LANG_POPUP_OK = "OK";
var LANG_POPUP_CANCEL = "Cancel";
var LANG_POPUP_LOWER_LIMIT = "need to select at least one language";
var LANG_POPUP_UPPER_LIMIT_LEFT = "Cannot select more than ";
var LANG_POPUP_UPPER_LIMIT_RIGHT = " languages";


/**
 * initialize keyboard data
 * @return
 */
function initialize() {
	chTggIdx=0;
	document.getElementById("wkk_key_clear").style.fontSize = "28px";
	document.getElementById("wkk_key_clear").style.lineHeight = "48px";
}




/**
 * Numeric key display on screen.
 * @param currPageIdx
 * @return truel/false
 */
function isNumericKeyActivated(currPageIdx) {
	if(currPageIdx==0 || currPageIdx == 1  ) {
		return true;
	} else {
		return false;
	}
}

/**
 * action that ok button pressed 
 * @return
 */

/**
 * change key values
 * @return
 */
function changeKeyValue(category) {
	switch(category)
	{
		case '12;)':
			lgKb.nextCaps = lgKb.selectedCaps;
			lgKb.selectedChar = "12;)";
			lgKb.setKeyText("wkk_key_001", "`");
			lgKb.setKeyText("wkk_key_002", "1");
			lgKb.setKeyText("wkk_key_003", "2");
			lgKb.setKeyText("wkk_key_004", "3");
			lgKb.setKeyText("wkk_key_005", "4");
			lgKb.setKeyText("wkk_key_006", "5");
			lgKb.setKeyText("wkk_key_007", "6");
			lgKb.setKeyText("wkk_key_008", "7");
			lgKb.setKeyText("wkk_key_009", "8");
			lgKb.setKeyText("wkk_key_010", "9");
			lgKb.setKeyText("wkk_key_011", "0");
			lgKb.setKeyText("wkk_key_012", "-");
			lgKb.setKeyText("wkk_key_013", "=");
			lgKb.setKeyText("wkk_key_014", " ");
			
			lgKb.setKeyText("wkk_key_101", "/");
			lgKb.setKeyText("wkk_key_102", "^");
			lgKb.setKeyText("wkk_key_103", "~");
			lgKb.setKeyText("wkk_key_104", "?");
			lgKb.setKeyText("wkk_key_105", "!");
			lgKb.setKeyText("wkk_key_106", "'");
			lgKb.setKeyText("wkk_key_107", "\"");
			lgKb.setKeyText("wkk_key_108", "(");
			lgKb.setKeyText("wkk_key_109", ")");
			lgKb.setKeyText("wkk_key_110", ":");
			lgKb.setKeyText("wkk_key_111", ";");
			lgKb.setKeyText("wkk_key_112", "+");
			lgKb.setKeyText("wkk_key_113", "&");
			lgKb.setKeyText("wkk_key_114", "%");
			
			lgKb.setKeyText("wkk_key_201", "*");
			lgKb.setKeyText("wkk_key_202", "<");
			lgKb.setKeyText("wkk_key_203", ">");
			lgKb.setKeyText("wkk_key_204", "[");
			lgKb.setKeyText("wkk_key_205", "]");
			lgKb.setKeyText("wkk_key_206", "{");
			lgKb.setKeyText("wkk_key_207", "}");
			lgKb.setKeyText("wkk_key_208", ",");
			lgKb.setKeyText("wkk_key_209", "§");
			lgKb.setKeyText("wkk_key_210", "#");
			lgKb.setKeyText("wkk_key_211", "¿");
			lgKb.setKeyText("wkk_key_212", "¡");
			lgKb.setKeyText("wkk_key_213", "€");
			lgKb.setKeyText("wkk_key_214", "£");
			
			lgKb.setKeyText("wkk_key_301", "$");
			lgKb.setKeyText("wkk_key_302", "¥");
			lgKb.setKeyText("wkk_key_303", "￦");
			lgKb.setKeyText("wkk_key_304", "＼");
			lgKb.setKeyText("wkk_key_305", "|");
			lgKb.setKeyText("wkk_key_306", ".");
			lgKb.setKeyText("wkk_key_307", "@");
			lgKb.setKeyText("wkk_key_308", "_");
			lgKb.setKeyText("wkk_key_309", " ");
			lgKb.setKeyText("wkk_key_310", " ");
			lgKb.setKeyText("wkk_key_311", " ");
			lgKb.setKeyText("wkk_key_312", " ");
			lgKb.setKeyText("wkk_key_313", " ");
			lgKb.setKeyText("wkk_key_314", " ");
			
			lgKb.setKeyText("wkk_key_401", "http://");
			lgKb.setKeyText("wkk_key_402", "www.");
			lgKb.setKeyText("wkk_key_403", ".com");
			lgKb.setKeyText("wkk_key_404", " ");
			lgKb.setKeyText("wkk_key_411", " ");
			lgKb.setKeyText("wkk_key_412", " ");
			lgKb.setKeyText("wkk_key_413", " ");
			lgKb.setKeyText("wkk_key_414", " ");
			break;		
		case 'shift':
			lgKb.category = "shift";
			lgKb.selectedCaps = "shift";
			lgKb.nextCaps = "unshift";
			lgKb.nextChar = "12;)";
			lgKb.setKeyText("wkk_key_001", "َ");
			lgKb.setKeyText("wkk_key_002", "!");
			lgKb.setKeyText("wkk_key_003", "@");
			lgKb.setKeyText("wkk_key_004", "#");
			lgKb.setKeyText("wkk_key_005", "$");
			lgKb.setKeyText("wkk_key_006", "%");
			lgKb.setKeyText("wkk_key_007", "^");
			lgKb.setKeyText("wkk_key_008", "&");
			lgKb.setKeyText("wkk_key_009", ")");
			lgKb.setKeyText("wkk_key_010", "(");
			lgKb.setKeyText("wkk_key_011", "_");
			lgKb.setKeyText("wkk_key_012", "+");
			lgKb.setKeyText("wkk_key_013", " ");
			lgKb.setKeyText("wkk_key_014", " ");
			
			lgKb.setKeyText("wkk_key_101", "َ");
			lgKb.setKeyText("wkk_key_102", "ً");
			lgKb.setKeyText("wkk_key_103", "ُ");
			lgKb.setKeyText("wkk_key_104", "ٌ");
			lgKb.setKeyText("wkk_key_105", "لإ");
			lgKb.setKeyText("wkk_key_106", "إ");
			lgKb.setKeyText("wkk_key_107", "ř");
			lgKb.setKeyText("wkk_key_108", "Ś");
			lgKb.setKeyText("wkk_key_109", "x");
			lgKb.setKeyText("wkk_key_110", "؛");
			lgKb.setKeyText("wkk_key_111", ">");
			lgKb.setKeyText("wkk_key_112", "<");
			lgKb.setKeyText("wkk_key_113", "|");
			lgKb.setKeyText("wkk_key_114", " ");
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "ٍ");
			lgKb.setKeyText("wkk_key_203", "]");
			lgKb.setKeyText("wkk_key_204", "[");
			lgKb.setKeyText("wkk_key_205", "لأ");
			lgKb.setKeyText("wkk_key_206", "أ");
			lgKb.setKeyText("wkk_key_207", "ـ");
			lgKb.setKeyText("wkk_key_208", "،");
			lgKb.setKeyText("wkk_key_209", "/");
			lgKb.setKeyText("wkk_key_210", ":");
			lgKb.setKeyText("wkk_key_211", "\"");
			lgKb.setKeyText("wkk_key_212", "ِ");
			lgKb.setKeyText("wkk_key_213", " ");
			lgKb.setKeyText("wkk_key_214", " ");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "~");
			lgKb.setKeyText("wkk_key_304", "ْ");
			lgKb.setKeyText("wkk_key_305", "}");
			lgKb.setKeyText("wkk_key_306", "{");
			lgKb.setKeyText("wkk_key_307", "لآ");
			lgKb.setKeyText("wkk_key_308", "آ");
			lgKb.setKeyText("wkk_key_309", "Ř");
			lgKb.setKeyText("wkk_key_310", ",");
			lgKb.setKeyText("wkk_key_311", ".");
			lgKb.setKeyText("wkk_key_312", "؟");
			lgKb.setKeyText("wkk_key_313", " ");
			lgKb.setKeyText("wkk_key_314", " ");
			
			lgKb.setKeyText("wkk_key_401", "http://");
			lgKb.setKeyText("wkk_key_402", "www.");
			lgKb.setKeyText("wkk_key_403", ".com");
			lgKb.setKeyText("wkk_key_404", " ");
			lgKb.setKeyText("wkk_key_411", " ");
			lgKb.setKeyText("wkk_key_412", " ");
			lgKb.setKeyText("wkk_key_413", " ");
			lgKb.setKeyText("wkk_key_414", " ");
			break;
		default :
			lgKb.category = "unshift";
			lgKb.selectedCaps = "unshift";
			lgKb.nextCaps = "shift";
			lgKb.nextChar = "12;)";
			lgKb.setKeyText("wkk_key_001", "ذ");
			lgKb.setKeyText("wkk_key_002", "١");
			lgKb.setKeyText("wkk_key_003", "٢");
			lgKb.setKeyText("wkk_key_004", "٣");
			lgKb.setKeyText("wkk_key_005", "٤");
			lgKb.setKeyText("wkk_key_006", "٥");
			lgKb.setKeyText("wkk_key_007", "٦");
			lgKb.setKeyText("wkk_key_008", "٧");
			lgKb.setKeyText("wkk_key_009", "٨");
			lgKb.setKeyText("wkk_key_010", "٩");
			lgKb.setKeyText("wkk_key_011", "٠");
			lgKb.setKeyText("wkk_key_012", "-");
			lgKb.setKeyText("wkk_key_013", "=");
			lgKb.setKeyText("wkk_key_014", " ");
			
			lgKb.setKeyText("wkk_key_101", "ض");
			lgKb.setKeyText("wkk_key_102", "ص");
			lgKb.setKeyText("wkk_key_103", "ث");
			lgKb.setKeyText("wkk_key_104", "ق");
			lgKb.setKeyText("wkk_key_105", "ف");
			lgKb.setKeyText("wkk_key_106", "غ");
			lgKb.setKeyText("wkk_key_107", "ع");
			lgKb.setKeyText("wkk_key_108", "ه");
			lgKb.setKeyText("wkk_key_109", "خ");
			lgKb.setKeyText("wkk_key_110", "ح");
			lgKb.setKeyText("wkk_key_111", "ج");
			lgKb.setKeyText("wkk_key_112", "د");
			lgKb.setKeyText("wkk_key_113", "\\");
			lgKb.setKeyText("wkk_key_114", " ");
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "ش");
			lgKb.setKeyText("wkk_key_203", "س");
			lgKb.setKeyText("wkk_key_204", "ي");
			lgKb.setKeyText("wkk_key_205", "ب");
			lgKb.setKeyText("wkk_key_206", "ل");
			lgKb.setKeyText("wkk_key_207", "ا");
			lgKb.setKeyText("wkk_key_208", "ت");
			lgKb.setKeyText("wkk_key_209", "ن");
			lgKb.setKeyText("wkk_key_210", "م");
			lgKb.setKeyText("wkk_key_211", "ك");
			lgKb.setKeyText("wkk_key_212", "ط");
			lgKb.setKeyText("wkk_key_213", " ");
			lgKb.setKeyText("wkk_key_214", " ");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "ء");
			lgKb.setKeyText("wkk_key_304", "ؤ");
			lgKb.setKeyText("wkk_key_305", "ؤ");
			lgKb.setKeyText("wkk_key_306", "لا");
			lgKb.setKeyText("wkk_key_307", "ى");
			lgKb.setKeyText("wkk_key_308", "ة");
			lgKb.setKeyText("wkk_key_309", "و");
			lgKb.setKeyText("wkk_key_310", "ز");
			lgKb.setKeyText("wkk_key_311", "ظ");
			lgKb.setKeyText("wkk_key_312", "ئ");
			lgKb.setKeyText("wkk_key_313", " ");
			lgKb.setKeyText("wkk_key_314", " ");
			
			lgKb.setKeyText("wkk_key_401", "http://");
			lgKb.setKeyText("wkk_key_402", "www.");
			lgKb.setKeyText("wkk_key_403", ".com");
			lgKb.setKeyText("wkk_key_404", " ");
			lgKb.setKeyText("wkk_key_411", " ");
			lgKb.setKeyText("wkk_key_412", " ");
			lgKb.setKeyText("wkk_key_413", " ");
			lgKb.setKeyText("wkk_key_414", " ");
			break;
	}
	lgKb.toggleKeyChange();
}


/**
 * add space to textbox's content
 * @return
 */
function addSpaceText() {
	setNewMode(0);
	var key = document.createElement( 'DIV' );
	key.innerHTML = " ";
	appendText(key);
	lastInputChar = " ";

}

/**
 * backspace text
 * @return
 */
function backspaceText() {
	lgKb.deletePrevChar();
}

/**
 * 
 * @param val
 * @return
 */
function appendText(key) {
	var textItem = lgKb.targetElement;
	var content = key.firstChild.nodeValue;
	if( textItem != null) {
		if(content == " ") {
			lgKb.addStrIntoFld(" ", true);
		} else {
			lgKb.addStrIntoFld(content, true);
		}
	}

}

/**
 * pre processing define when key pressed (for combination charset ex> hangle)
 * @param nMode
 * @return
 */
function setNewMode(nMode) {
	//do nothing
}