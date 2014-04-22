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
 * greek
 */

/**
 * key board page count
 */
var pageCnt = 2;

/**
 * label string seting
 */
var STR_VK_CLEAR = "<p id='wkk_key_clear_p'>Διαγραφή<br>όλων</p>";
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
	document.getElementById("wkk_key_clear").style.fontSize = "24px";
	document.getElementById("wkk_key_clear").style.lineHeight = "20px";	
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
			lgKb.setKeyText("wkk_key_001", "~");
			lgKb.setKeyText("wkk_key_002", "!");
			lgKb.setKeyText("wkk_key_003", "@");
			lgKb.setKeyText("wkk_key_004", "#");
			lgKb.setKeyText("wkk_key_005", "$");
			lgKb.setKeyText("wkk_key_006", "%");
			lgKb.setKeyText("wkk_key_007", "^");
			lgKb.setKeyText("wkk_key_008", "&");
			lgKb.setKeyText("wkk_key_009", "*");
			lgKb.setKeyText("wkk_key_010", "(");
			lgKb.setKeyText("wkk_key_011", ")");
			lgKb.setKeyText("wkk_key_012", "_");
			lgKb.setKeyText("wkk_key_013", "+");
			lgKb.setKeyText("wkk_key_014", " ");
			
			lgKb.setKeyText("wkk_key_101", "");
			lgKb.setKeyText("wkk_key_102", "Ϛ");
			lgKb.setKeyText("wkk_key_103", "Ε",["Ε", "Έ"]);
			lgKb.setKeyText("wkk_key_104", "P");
			lgKb.setKeyText("wkk_key_105", "T");
			lgKb.setKeyText("wkk_key_106", "Y",["Υ", "Ύ", "Ϋ"]);
			lgKb.setKeyText("wkk_key_107", "Θ");
			lgKb.setKeyText("wkk_key_108", "Ι",["Ι", "Ί", "Ϊ"]);
			lgKb.setKeyText("wkk_key_109", "O",["Ο", "Ό"]);
			lgKb.setKeyText("wkk_key_110", "Π");
			lgKb.setKeyText("wkk_key_111", " ");
			lgKb.setKeyText("wkk_key_112", " ");
			lgKb.setKeyText("wkk_key_113", " ");
			lgKb.setKeyText("wkk_key_114", " ");
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "Α",["Α", "Ά"]);
			lgKb.setKeyText("wkk_key_203", "Σ");
			lgKb.setKeyText("wkk_key_204", "Δ");
			lgKb.setKeyText("wkk_key_205", "Φ");
			lgKb.setKeyText("wkk_key_206", "Γ");
			lgKb.setKeyText("wkk_key_207", "Η",["Η", "Ή"]);
			lgKb.setKeyText("wkk_key_208", "Ξ");
			lgKb.setKeyText("wkk_key_209", "K");
			lgKb.setKeyText("wkk_key_210", "Λ");
			lgKb.setKeyText("wkk_key_211", " ");
			lgKb.setKeyText("wkk_key_212", " ");
			lgKb.setKeyText("wkk_key_213", " ");
			lgKb.setKeyText("wkk_key_214", " ");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "Z");
			lgKb.setKeyText("wkk_key_304", "X");
			lgKb.setKeyText("wkk_key_305", "Ψ");
			lgKb.setKeyText("wkk_key_306", "Ω",["Ω", "Ώ"]);
			lgKb.setKeyText("wkk_key_307", "B");
			lgKb.setKeyText("wkk_key_308", "N");
			lgKb.setKeyText("wkk_key_309", "M");
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
		default :
			lgKb.category = "unshift";
			lgKb.selectedCaps = "unshift";
			lgKb.nextCaps = "shift";
			lgKb.nextChar = "12;)";
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
			
			lgKb.setKeyText("wkk_key_101", " ");
			lgKb.setKeyText("wkk_key_102", "ϛ");
			lgKb.setKeyText("wkk_key_103", "ε",["ε", "έ"]);
			lgKb.setKeyText("wkk_key_104", "ρ");
			lgKb.setKeyText("wkk_key_105", "τ");
			lgKb.setKeyText("wkk_key_106", "υ",["υ","ύ","ϋ","ΰ"]);
			lgKb.setKeyText("wkk_key_107", "θ");
			lgKb.setKeyText("wkk_key_108", "ι",["ι","ί","ϊ","ΐ"]);
			lgKb.setKeyText("wkk_key_109", "ο",["ο","ό"]);
			lgKb.setKeyText("wkk_key_110", "π");
			lgKb.setKeyText("wkk_key_111", " ");
			lgKb.setKeyText("wkk_key_112", " ");
			lgKb.setKeyText("wkk_key_113", " ");
			lgKb.setKeyText("wkk_key_114", " ");
			
			
			lgKb.setKeyText("wkk_key_201", " ");
			lgKb.setKeyText("wkk_key_202", "a",["a", "ά"]);
			lgKb.setKeyText("wkk_key_203", "σ");
			lgKb.setKeyText("wkk_key_204", "δ");
			lgKb.setKeyText("wkk_key_205", "φ");
			lgKb.setKeyText("wkk_key_206", "Γ");
			lgKb.setKeyText("wkk_key_207", "η",["η","ή"]);
			lgKb.setKeyText("wkk_key_208", "ξ");
			lgKb.setKeyText("wkk_key_209", "κ");
			lgKb.setKeyText("wkk_key_210", "λ");
			lgKb.setKeyText("wkk_key_211", " ");
			lgKb.setKeyText("wkk_key_212", " ");
			lgKb.setKeyText("wkk_key_213", " ");
			lgKb.setKeyText("wkk_key_214", " ");
			
			lgKb.setKeyText("wkk_key_301", " ");
			lgKb.setKeyText("wkk_key_302", " ");
			lgKb.setKeyText("wkk_key_303", "ζ");
			lgKb.setKeyText("wkk_key_304", "χ");
			lgKb.setKeyText("wkk_key_305", "ψ");
			lgKb.setKeyText("wkk_key_306", "ω",["ω","ώ"]);
			lgKb.setKeyText("wkk_key_307", "β");
			lgKb.setKeyText("wkk_key_308", "ν");
			lgKb.setKeyText("wkk_key_309", "μ");
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