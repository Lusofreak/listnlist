"use strict";

var lastClickedObject = null;

var app_id = "org.projectfurnace.checklist";


var PARENTID = 'top-level';


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







function childActionItemAsHTML(caption, id, bChecked, index)
{
	var html = `<li class="table-view-cell" id="{1}"  data-source="{1}" data-index="{3}">
		    	 	 {0}
			    	 <div class="toggle{2}" id="toggle-{1}" data-source="{1}">
				      <div class="toggle-handle" data-source="{1}"></div>
				    </div>
			    
			  </li>`;

	return String.format(html, caption, id, bChecked ? " active" : "", index);
}


function swipedActionItemAsHTML(id, index)
{
	var html = `<li class="table-view-cell btn-on" id="{0}" data-source="{0}" data-index="{2}">
					</span><span class="icon icon-list" data-source="{0}"></span> <span class="icon icon-compose" data-source="{0}"></span><span class="icon icon-trash" data-source="{0}"></span> {1} 
			  </li>`;

  	//return String.format(html,id, ACTIONS[id].caption, index);
  	return String.format(html,id, '', index);
}



function parentActionItemAsHTML(caption, id, nbCheckedChildren, nbChildren, index)
{
	var html = `<li class="table-view-cell" id="{1}" data-index="{4}">
					<a class="navigate-right"  data-source="{1}"  data-index="{4}">
					<span class="badge">{2}/{3}</span>
		    	 	 {0}
			    	</a>
			  </li>`;

	return String.format(html, caption, id, nbCheckedChildren, nbChildren, index );

}


function captionEditAsHTML(caption, id)
{
	var html = `<li id="{1}">
			  	<form>
				  <input type="text" value="{0}" placeholder="Edit caption..." data-source="{1}" id="caption-input">
				</form>
			  </li>`;

	setTimeout(function() { $("#caption-input").unbind().keydown( addOrEditActionItem); }, 50);

	return String.format(html, caption, id);



}

function addActionItemAsHTML()
{
	return captionEditAsHTML("", guid());
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
		ACTIONS[id] = {caption: caption, id: id, children: [], checked:false, parent: parentId};
	}
	else
	{
		coreEditActionItem(caption, id)	
	}



	var parent = ACTIONS[parentId];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		parent.children.push(id);
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
	var parent = ACTIONS[ACTIONS[id].parent];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		var index = parent.children.indexOf(id);
		if (index !== -1)
		{
			parent.children.splice(index, 1);
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
		return parent.children.length;
	}

	return 0;
}


function coreNumberOfCheckedChildren(id)
{
	var count = 0;
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		for (var i = 0; i < parent.children.length; i++)
		{
			count += ACTIONS[parent.children[i]].checked ? 1 : 0;
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

	if (PARENTID !== 'top-level')
	{
		html += `
		<button class="btn btn-link btn-nav pull-left" data-source="{1}">
		    <span class="icon icon-left-nav" data-source="{1}"></span>
		    Left
		  </button>`;
	}

	html += '<h1 class="title">{0}</h1>';

    $('header.bar').html(String.format(html, ACTIONS[PARENTID].caption, ACTIONS[PARENTID].parent));  

	


	html = '';

	var index = 0;
	for (var i = 0; i < ACTIONS[PARENTID].children.length; i++)
	{
		var action = ACTIONS[ACTIONS[PARENTID].children[i]];

		if (coreHasChildren(action.id))
		{
			html += parentActionItemAsHTML(action.caption, action.id, coreNumberOfCheckedChildren(action.id), coreNumberOfChildren(action.id), index);

		}
		else
		{
			html += childActionItemAsHTML(action.caption, action.id, action.checked, index);
		}
		index++;
	
	}

	$('.table-view').html(html);

	if (index === 0)
		$('span.icon-plus').addClass('pulse');
	else
		$('span.icon-plus').removeClass('pulse');


	// if it is the first action item created (i.e: it is a top level item and has no children)
	if (index === 1 && PARENTID === 'top-level' && Object.keys(ACTIONS).length === 2)
	{
		setTimeout(
			function()
			{ 
				html = `
				<div class="swipe-left">
					<img src="images/swipe-left.png">
					<p class="instruction">Swipe left to reveal actions</p>
				</div>
				`;
				$('div.pagecontent > div.content-padded').append(html); 
			}
		, 1000);

		setTimeout(
			function()
			{ 
				html = `
				<div class="swipe-right">
					<img src="images/swipe-right.png">
					<p class="instruction">Swipe right to close actions</p>
				</div>
				`;
				$('div.pagecontent > div.content-padded').append(html); 
			}
		, 7000);

		setTimeout(
			function()
			{ 
				$('div.swipe-left').remove();
			}
		, 6000);


		setTimeout(
			function()
			{ 
				$('div.swipe-right').remove();
			}
		, 12000);
	}

	if (bWithAnimation)
	{
		$('.card').addClass('from-left');
	}
	setTimeout(
		function()
		{ 
			$('.card').removeClass('from-left'); 
			$('li.table-view-cell').on('swipe', swipeEventHandler);
		}
	, 1400);
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
		var topLevelAction = { id: 'top-level', caption: 'HOME', children: []};
		ACTIONS['top-level'] = topLevelAction;
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

function swipeEventHandler(evt)
{
	var target = $(evt.target);
    if (target.is('a.navigate-right.ui-link') || target.is('a.navigate-right') || target.is('li.table-view-cell'))
    {
      	var id =  target.attr("data-source");
      	var index =  target.attr("data-index");

      	if ($("#" + id).hasClass('btn-on') === false)
      	{
			$("#" + id).replaceWith(swipedActionItemAsHTML(id, index));
      	}
		else
		{
			var action = ACTIONS[id];

			if (coreHasChildren(action.id))
			{
				$("#" + id).replaceWith(parentActionItemAsHTML(action.caption, action.id, coreNumberOfCheckedChildren(action.id), coreNumberOfChildren(action.id), index));

			}
			else
			{
				$("#" + id).replaceWith(childActionItemAsHTML(action.caption, action.id, action.checked, index));
			}
		}
		setTimeout(
			function() {
				$("#" + id).on('swipe', swipeEventHandler);
			}
		,100);
	}
}




function tapholdEventHandler(evt)
{

    var target = $(evt.target);
    if (target.is('a.navigate-right.ui-link') || target.is('a.navigate-right') || target.is('li.table-view-cell'))
    {
      	var id =  target.attr("data-source");
      	var index =  target.attr("data-index");


      	$("#" + id).draggable({axis: "y"}); 
		$("li.table-view-cell").droppable(
			{ drop: function( event, ui ) 
				{
					if (typeof(event) !== "undefined" && event !== null)
					{
						var to = parseInt($(event.target).attr('data-index'));
						var from = parseInt($(event.toElement).attr('data-index'));
						var parentAction = ACTIONS[ACTIONS[id].parent];

						var toInsert = parentAction.children[from];
						parentAction.children.splice(to, 0, toInsert);
						parentAction.children.splice(from + 1, 1);
						saveAll();
					}

					setTimeout(function() {refreshUI(false);}, 80);
				}
		});
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
		refreshUI(true);

	}
	else if (lastClickedObject.is('span.icon.icon-home') )
	{
		PARENTID = 'top-level'; 
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
			for (var i = 0; i < parent.children.length; i++)
			{
				if (ACTIONS[parent.children[i]].checked === false)
				{
					parent.checked = false;
					break;
				}
			}
		}
		saveAll();
	}
}


function displayTopLevel()
{
	var str = '';
	for(var i = 0; i < ACTIONS['top-level'].children.length; i++)
	{
		str += ACTIONS[ACTIONS['top-level'].children[i]].caption + ',';
	}
	return str;
}