"use strict";

var lastClickedObject = null;

var app_id = "org.projectfurnace.checklist";


var PARENTID = null;


var ACTIONS = {};





function numberToBase64(n)
{
  var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz-_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  var base = 64;
  while (n > 0)
  {
    var divResult = Math.floor(n / base);
    result += alphabet[n - divResult * base];
    n = divResult;
  }
  return result;
}

function guid() 
{
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  //return s4() + s4() + '-' + s4() + '-' + s4();
  var n = Math.floor((1 + Math.random()) * 0x100000000);
  return numberToBase64(n) + numberToBase64(Date.now());
}


function toSingleWord(multiWords)
{
  return multiWords.replace(" ", "_");
}



String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
}







function childActionItemAsHTML(caption, id, bChecked)
{
	var html = `<li class="table-view-cell" id="{1}"  data-source="{1}">
		    	 	 {0}
			    	 <div class="toggle{2}" id="toggle-{1}" data-source="{1}">
				      <div class="toggle-handle" data-source="{1}"></div>
				    </div>
			    
			  </li>`;

	return String.format(html, caption, id, bChecked ? " active" : "");
}


function longPressedActionItemAsHTML(id)
{
	var html = `<li class="table-view-cell" id="{0}">
					</span><span class="icon icon-list" data-source="{0}"></span> <span class="icon icon-compose" data-source="{0}"></span><span class="icon icon-trash" data-source="{0}"></span> 
			  </li>`;

  	return String.format(html,id);
}



function parentActionItemAsHTML(caption, id, nbCheckedChildren, nbChildren)
{
	var html = `<li class="table-view-cell" id="{1}">
					<a class="navigate-right"  data-source="{1}" >
					<span class="badge">{2}/{3}</span>
		    	 	 {0}
			    	</a>
			  </li>`;

	return String.format(html, caption, id, nbCheckedChildren, nbChildren );

}


function captionEditAsHTML(caption, id)
{
	var html = `<li id="{1}">
			  	<form>
				  <input type="text" placeholder="{0}" data-source="{1}" id="caption-input">
				</form>
			  </li>`;

	setTimeout(function() { $("#caption-input").unbind().keydown( addOrEditActionItem); }, 50);

	return String.format(html, caption, id);



}

function addActionItemAsHTML()
{
	return captionEditAsHTML("Edit action item...", guid());
}



function saveAll()
{
	localStorage.setItem(app_id + '.data', JSON.stringify(ACTIONS));
	localStorage.setItem(app_id + '.timestamp', Date.now().toString());
}

function addOrEditActionItem(event)
{
	if ((event.type == 'keydown' && (event.which == 13 || event.which == 9)))
	{
		var caption = $("#caption-input").val();
		var id =  $("#caption-input").attr("data-source");

		coreAddActionItem(caption, id, PARENTID);
		refreshUI(false);
	}
}



function coreAddActionItem(caption, id, parentId)
{
	if (ACTIONS[id] === null || typeof(ACTIONS[id]) === "undefined")
	{
		ACTIONS[id] = {caption: caption, id: id, children: {}, checked:false, parent: parentId};
	}
	else
	{
		coreEditActionItem(caption, id)	
	}


	if (parentId !== null)
	{
		var parent = ACTIONS[parentId];
		if (parent !== null && typeof(parent) !== "undefined")
		{
			parent.children[id] = id;
		}
	}

	
	saveAll();

	
}

function coreEditActionItem(caption, id)
{
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		parent.caption = caption;
	}


	saveAll();
}


function coreDeleteActionItem(id)
{
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		if (parent.parent !== null)
		{
			delete ACTIONS[parent.parent].children[id];
		}
		delete ACTIONS[id];
	}


	saveAll();
}


function coreNumberOfChildren(id)
{
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		return Object.keys(parent.children).length;
	}

	return 0;
}


function coreNumberOfCheckedChildren(id)
{
	var count = 0;
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		for (var childId in parent.children)
		{
			count += ACTIONS[childId].checked ? 1 : 0;
		}
	}

	return count;
}


function coreHasChildren(id)
{
	return coreNumberOfChildren(id) !== 0;
}























/******************************** UI INITIALIZATION ****************************/

function refreshUI(bWithAnimation = false)
{
	var html = '';

	if (PARENTID !== null)
	{
		html += `
		<button class="btn btn-link btn-nav pull-left" data-source="{1}">
		    <span class="icon icon-left-nav" data-source="{1}"></span>
		    Left
		  </button>
		  <h1 class="title">{0}</h1>`;

	    $('header.bar').html(String.format(html, ACTIONS[PARENTID].caption, ACTIONS[PARENTID].parent));  

	}
	else
	{
		 $('header.bar').html('<h1 class="title">HOME</h1>');
	}

	html = '';


	for (var a in ACTIONS)
	{
		var action = ACTIONS[a];
		if (action.parent === PARENTID)
		{
			if (coreHasChildren(action.id))
			{
				html += parentActionItemAsHTML(action.caption, action.id, coreNumberOfCheckedChildren(action.id), coreNumberOfChildren(action.id));

			}
			else
			{
				html += childActionItemAsHTML(action.caption, action.id, action.checked);
			}
		}
	}

	$('.table-view').html(html);

	if (bWithAnimation)
	{
		$('.card').addClass('from-left');
	}
	setTimeout(function(){ $('.card').removeClass('from-left'); }, 1400);
}

function initUI()
{
	$("body").unbind().click(clickPerformed);
	$( "body" ).bind( "taphold", tapholdEventHandler );

	applyTheme();
	$("select#theme-combo").val(localStorage.getItem(app_id + ".theme"));

	applyResetTimer();
	$("select#reset-combo").val(localStorage.getItem(app_id + ".resettimer"));

	$("select#theme-combo").change(
		function()
		{
			applyTheme($("select#theme-combo").val());
		}
	);


	$("select#reset-combo").change(
		function()
		{
			applyResetTimer($("select#reset-combo").val());
		}
	);


	ACTIONS = JSON.parse(localStorage.getItem(app_id + '.data'));
	if (ACTIONS === null || typeof(ACTIONS) === "undefined")
	{
		ACTIONS = {};
	}

	var last = localStorage.getItem(app_id + '.timestamp');
	if (last !== null && typeof(last) !== "undefined")
	{
		var delta = Date.now() - parseInt(last);
		if (delta > parseInt(localStorage.getItem(app_id + ".resettimer")) * 3600000)
		{
			for (var id in ACTIONS)
			{
				ACTIONS[id].checked = false;
			}
		}
	}

	refreshUI(true);
	
}



function applyTheme(val)
{
	if (typeof(val) === "undefined" || val === null)
	{
		val = localStorage.getItem(app_id + ".theme");
		if (typeof(val) === "undefined" || val === null)
			val = "1";
	}
	localStorage.setItem(app_id + ".theme", val);
	$("body > div").css("background",  'url("images/bg0' + val +  '.png") no-repeat center');
	$("body > div").css("background-size", "cover");
}


function applyResetTimer(val)
{
	if (typeof(val) === "undefined" || val === null)
	{
		val = localStorage.getItem(app_id + ".resettimer");
		if (typeof(val) === "undefined" || val === null)
			val = "4";
	}
	localStorage.setItem(app_id + ".resettimer", val);
}




function tapholdEventHandler(evt)
{

    var target = $(evt.target);
    if (target.is('a.navigate-right.ui-link') || target.is('a.navigate-right') || target.is('li.table-view-cell'))
    {
      	var id =  target.attr("data-source");

		$("#" + id).replaceWith(longPressedActionItemAsHTML(id));

		//setTimeout(function() {$("#" + id).draggable(); }, 100);
    }
}


/******************************** CLICK HANDLING ****************************/

function clickPerformed(evt)
{
	lastClickedObject = $(evt.target);

	
	if (lastClickedObject.is('span#new-action-item'))
	{
		
		$('.table-view').append(addActionItemAsHTML());
		
	}
	else if (lastClickedObject.is('span.icon.icon-trash')) 
	{
		var id =  lastClickedObject.attr("data-source");

		$("#" + id).remove();
		coreDeleteActionItem(id);
		// TODO:
		// Test if children action item otherwise popup + remove real objects and susequent childrens
	}
	else if (lastClickedObject.is('span.icon.icon-compose'))
	{
		var id =  lastClickedObject.attr("data-source");
		var caption = ACTIONS[id].caption;
		// TODO: 
		// fetch real name from id
		$("#" + id).replaceWith(captionEditAsHTML(caption, id));
	}
	else if (lastClickedObject.is('span.icon.icon-list')  || lastClickedObject.is('a.navigate-right') )
	{
		PARENTID =  lastClickedObject.attr("data-source");
		refreshUI(true);

	}
	else if (lastClickedObject.is('button.btn.btn-link.btn-nav.pull-left')  || lastClickedObject.is('span.icon.icon-left-nav') )
	{
		PARENTID =  lastClickedObject.attr("data-source");
		if (PARENTID === "null")
		{
			PARENTID = null; 
		}
		refreshUI(true);

	}
	else if (lastClickedObject.is('span.icon.icon-home') )
	{
		PARENTID = null; 
		refreshUI(true);
	}
	else if (lastClickedObject.is('div.toggle-handle') || lastClickedObject.is('div.toggle'))
	{
		var id = lastClickedObject.attr("data-source");
		var action = ACTIONS[id];
		action.checked = $("#toggle-" + id).hasClass("active");

		if (action.parent !== null)
		{
			var parent = ACTIONS[action.parent];
			parent.checked = true;
			for (var child in parent.children)
			{
				if (ACTIONS[child].checked === false)
				{
					parent.checked = false;
					break;
				}
			}
		}
		saveAll();
	}
}