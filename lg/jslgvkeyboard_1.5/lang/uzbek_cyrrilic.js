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
 * russian
 */

/**
 * key board page count
 */
var pageCnt = 2;

/**
 * label string seting
 */
var STR_VK_CLEAR = "<p id='wkk_key_clear_p'>Barchasini<br>o'chirish</p>";
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
	document.getElementById("wkk_key_clear").style.fontSize = "20px";
	document.getElementById("wkk_key_clear").style.lineHeight = "19px";	
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
			lgKb.setKeyText("wkk_key_106", "\'");
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
			lgKb.setKeyText("wkk_key_309", "");
			lgKb.setKeyText("wkk_key_310", "");
			lgKb.setKeyText("wkk_key_311", "");
			lgKb.setKeyText("wkk_key_312", "");
			lgKb.setKeyText("wkk_key_313", "");
			lgKb.setKeyText("wkk_key_314", "");
			
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
			lgKb.setKeyText("wkk_key_001", "|");
			lgKb.setKeyText("wkk_key_002", "№");
			lgKb.setKeyText("wkk_key_003", "-");
			lgKb.setKeyText("wkk_key_004", "/");
			lgKb.setKeyText("wkk_key_005", '"');
			lgKb.setKeyText("wkk_key_006", ":");
			lgKb.setKeyText("wkk_key_007", ",");
			lgKb.setKeyText("wkk_key_008", ".");
			lgKb.setKeyText("wkk_key_009", "_");
			lgKb.setKeyText("wkk_key_010", "?");
			lgKb.setKeyText("wkk_key_011", "%");
			lgKb.setKeyText("wkk_key_012", "!");
			lgKb.setKeyText("wkk_key_013", ";");
			lgKb.setKeyText("wkk_key_014", "");
			
			lgKb.setKeyText("wkk_key_101", "Й");
			lgKb.setKeyText("wkk_key_102", "Ц");
			lgKb.setKeyText("wkk_key_103", "У");
			lgKb.setKeyText("wkk_key_104", "К");
			lgKb.setKeyText("wkk_key_105", "Е");
			lgKb.setKeyText("wkk_key_106", "Н");
			lgKb.setKeyText("wkk_key_107", "Г");
			lgKb.setKeyText("wkk_key_108", "Ш");
			lgKb.setKeyText("wkk_key_109", "Қ");
			lgKb.setKeyText("wkk_key_110", "З");
			lgKb.setKeyText("wkk_key_111", "Х");
			lgKb.setKeyText("wkk_key_112", "Ъ");
			lgKb.setKeyText("wkk_key_113", "");
			lgKb.setKeyText("wkk_key_114", "");
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "Ф");
			lgKb.setKeyText("wkk_key_203", "Ў");
			lgKb.setKeyText("wkk_key_204", "В");
			lgKb.setKeyText("wkk_key_205", "А");
			lgKb.setKeyText("wkk_key_206", "П");
			lgKb.setKeyText("wkk_key_207", "Р");
			lgKb.setKeyText("wkk_key_208", "О");
			lgKb.setKeyText("wkk_key_209", "Л");
			lgKb.setKeyText("wkk_key_210", "Л");
			lgKb.setKeyText("wkk_key_211", "Ж");
			lgKb.setKeyText("wkk_key_212", "Э");
			lgKb.setKeyText("wkk_key_213", "");
			lgKb.setKeyText("wkk_key_214", "");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "Я");
			lgKb.setKeyText("wkk_key_304", "Ч");
			lgKb.setKeyText("wkk_key_305", "С");
			lgKb.setKeyText("wkk_key_306", "М");
			lgKb.setKeyText("wkk_key_307", "И");
			lgKb.setKeyText("wkk_key_308", "Т");
			lgKb.setKeyText("wkk_key_309", "Ь");
			lgKb.setKeyText("wkk_key_310", "Б");
			lgKb.setKeyText("wkk_key_311", "Ю");
			lgKb.setKeyText("wkk_key_312", "");
			lgKb.setKeyText("wkk_key_313", "");
			lgKb.setKeyText("wkk_key_314", "");
			
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
			lgKb.setKeyText("wkk_key_001", "+");
			lgKb.setKeyText("wkk_key_002", "1");
			lgKb.setKeyText("wkk_key_003", "2");
			lgKb.setKeyText("wkk_key_004", "3");
			lgKb.setKeyText("wkk_key_005", "ғ");
			lgKb.setKeyText("wkk_key_006", "5");
			lgKb.setKeyText("wkk_key_007", "6");
			lgKb.setKeyText("wkk_key_008", "ҳ");
			lgKb.setKeyText("wkk_key_009", "8");
			lgKb.setKeyText("wkk_key_010", "9");
			lgKb.setKeyText("wkk_key_011", "0");
			lgKb.setKeyText("wkk_key_012", "=");
			lgKb.setKeyText("wkk_key_013", "＼");
			lgKb.setKeyText("wkk_key_014", "");
			
			lgKb.setKeyText("wkk_key_101", "й");
			lgKb.setKeyText("wkk_key_102", "ц");
			lgKb.setKeyText("wkk_key_103", "у");
			lgKb.setKeyText("wkk_key_104", "к");
			lgKb.setKeyText("wkk_key_105", "е");
			lgKb.setKeyText("wkk_key_106", "н");
			lgKb.setKeyText("wkk_key_107", "г");
			lgKb.setKeyText("wkk_key_108", "г");
			lgKb.setKeyText("wkk_key_109", "ш");
			lgKb.setKeyText("wkk_key_110", "қ");
			lgKb.setKeyText("wkk_key_111", "з");
			lgKb.setKeyText("wkk_key_112", "х");
			lgKb.setKeyText("wkk_key_113", "ъ");
			lgKb.setKeyText("wkk_key_114", "");
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "ф");
			lgKb.setKeyText("wkk_key_203", "ў");
			lgKb.setKeyText("wkk_key_204", "в");
			lgKb.setKeyText("wkk_key_205", "а");
			lgKb.setKeyText("wkk_key_206", "р");
			lgKb.setKeyText("wkk_key_207", "о");
			lgKb.setKeyText("wkk_key_208", "a");
			lgKb.setKeyText("wkk_key_209", "л");
			lgKb.setKeyText("wkk_key_210", "д");
			lgKb.setKeyText("wkk_key_211", "ж");
			lgKb.setKeyText("wkk_key_212", "э");
			lgKb.setKeyText("wkk_key_213", "");
			lgKb.setKeyText("wkk_key_214", "");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "я");
			lgKb.setKeyText("wkk_key_304", "ч");
			lgKb.setKeyText("wkk_key_305", "с");
			lgKb.setKeyText("wkk_key_306", "м");
			lgKb.setKeyText("wkk_key_307", "и");
			lgKb.setKeyText("wkk_key_308", "т");
			lgKb.setKeyText("wkk_key_309", "ь");
			lgKb.setKeyText("wkk_key_310", "б");
			lgKb.setKeyText("wkk_key_311", "ю");
			lgKb.setKeyText("wkk_key_312", "");
			lgKb.setKeyText("wkk_key_313", "");
			lgKb.setKeyText("wkk_key_314", "");
			
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