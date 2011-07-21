/**
 * Set of routines and components to build various widgets in Javascript.
 * It somewhat models itself after two concepts:
 *
 *  - Cocoa style MVC patterns with controllers, delegates and views.
 *  - Self-style prototype object orientation.
 * 
 * As Javascript is a prototype object language a more Self-like object
 * model is suitable, and provides certain benefits over the glued on
 * class-based models often seen with Javascript. The main notion is that
 * any objects can be cloned to create new ones, with the clones inheriting
 * from their original object. One clear benefit is that the original
 * objects are real prototypes or templates: they can be used as-is,
 * thus offering neat testing. So, whie something like 'ClickViewSelect'
 * here is a widget that can be cloned to create new instances, it can also
 * be used directly.
 *
 * Author: Kristoffer Lawson, setok@scred.com, 2010
 *
 * This code is free to use and modify at will. Credit where due is 
 * appreciated.
 */


// This variable should be set before loading StorkCore and gives the URL
// root where StorkCore scripts can be found. This is so the browser
// knows where to load them from.
// var StorkCoreRoot = "";


var includedNum = 0;


var cssSupports = (function() {  
    var div = document.createElement('div');
    var vendors = 'Khtml Ms O Moz Webkit'.split(' ');
  
   return function(prop) {  
       var len = vendors.length;  
       if ( prop in div.style ) return true;  
  
       prop = prop.replace(/^[a-z]/, function(val) {  
           return val.toUpperCase();  
       });  
       
       while(len--) {  
           if ( vendors[len] + prop in div.style ) {  
               return true;  
           }  
       }  
       return false;  
   };  
})();  


function addLoadEvent(func) { 
    var oldonload = window.onload; 
    if (typeof window.onload != 'function') { 
	window.onload = func; 
    } else { 
	window.onload = function() { 
	    if (oldonload) { 
	        oldonload(); 
	    } 
	    func(); 
	} 
    } 
} 


/**
* Include another Javascript file into the DOM tree.
* Note that this is different from a C 'include' in that the file may be
* loaded only after the including document has finished. It works by
* entering a script tag into the document head.
*/

function includeJS(file) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = StorkCoreRoot + file;
    head.appendChild(script);
    includedNum++;
}

function finishedIncludes() {
    var head = document.getElementsByTagName('head')[0];
    var scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    script=document.createTextNode("_storkCore_includesLoaded()");
    scriptElement.appendChild(script);
    head.appendChild(scriptElement);
}

    /* :BUG: This doesn't work. Files not necessarily loaded when coming
back to page, because of caching, thus some other mechanism should be used
to create a callback only once all the "includes" are loaded, or then
the includes need to be loaded from the calling script separately, based
on use. */

function fileLoaded() {
    includedNum--;
    if (includedNum == 0) {
        addLoadEvent(_storkCore_includesLoaded);
    }
}

//includeJS('paginator.js');
//finishedIncludes();


//var storkCore_loadedCallback = undefined;


/** 
 * A clone of an object is an empty object 
 * with a prototype reference to the original.
 *
 * For StorkCore we're using an OO model like Self, where there are no
 * classes as such, but objects can clone from any other objects (and
 * inherit from them). Self is the definitive prototype object language and
 * JavaScript is actually based on that notion, which is effective for
 * GUIs. Thus the simple model actually works well with JS.
 */

function clone(obj) {
    
    // a private constructor, used only by this one clone.
    function Clone() {
      this.base = obj;
      //console.info("object: %s", obj);
    } 

    Clone.prototype = obj;    
    return new Clone();
}


function emptyElement(element) {
    //    children = element.childNodes;
    while (element.childNodes[0]) {
        element.removeChild(element.childNodes[0]);
    }

    return;
}


/**
* Return the element for which the event was targeted.
*/

function getTargetElement(event) {
    if (window.event && window.event.srcElement) {
        // You're using IE. This is for you. But please get rid of it.
        return window.event.srcElement;
    } else {
        return event.currentTarget;
    }
}


var Stork = clone(Object);


var EventListenerRegistry = clone(Stork);

EventListenerRegistry.transitionEndHandler = [];

EventListenerRegistry.catchTransitionEnd = function(element, object) {
    var my = this;

    if (! cssSupports("transitionProperty")) {
	// Transitions not supported by browser, so directly call the
	// handler. Transition happened immediately.
	object.transitionEnd(element);
    } else {
	this.transitionEndHandlers[element][object] = function() {
	    object.transitionEnd(element);
	}
	element.addEventListener('webkitTransitionEnd', 
				 this.transitionEndHandlers[element], false);
	element.addEventListener('transitionend', 
				 this.transitionEndHandlers[element], false);
    }
}


EventListenerRegistry.uncatchTransitionEnd = function(element, object) {
    if (! cssSupports("transitionProperty")) {
	return;
    }
    element.removeEventListener('webkitTransitionEnd',
				this.transitionEndHandlers[element][object], 
				false);
    element.removeEventListener('transitionend',
				this.transitionEndHandlers[element][object], 
				false);
    this.transitionEndHandlers[element] = undefined;
}


/*****************************************************************************
 * StorkController is a base view for all controllers within Storkcore.
 *****************************************************************************/

var StorkController = clone(Stork);


/*****************************************************************************
 * StorkView is a base view for all views within Storkcore.
 *****************************************************************************/

var StorkView = clone(Stork);

StorkView.parentElement = undefined;

/*
StorkView.toString = function() {
    return "StorkView";
    }*/

StorkView.render = function() {
    if (typeof(this.parentElement) == undefined) {
        return;
    }

    emptyElement(this.parentElement);
    this.parentElement.appendChild(this.getDomElement());
    return;
}

StorkView.domElement = document.createTextNode("");

StorkView.getDomEement = function() {
    return this.domElement;
}
/*
StorkView.__defineGetter__("domElement", function () {
    return document.createTextNode("");
}); */


/*****************************************************************************
 * Base view for any view which can have its events delegated to another
 * object.
 *****************************************************************************/
    
var StorkViewDelegatable = clone(StorkView);
StorkViewDelegatable.delegate = undefined;


/*****************************************************************************
 * Base delegate. Delegates should clone this.
 *****************************************************************************/

var StorkDelegate = clone(Stork);


/*****************************************************************************
* Forms a collection of StorkViews displayed horizontally
*****************************************************************************/
var HorizontalCollectionView = clone(StorkView);
HorizontalCollectionView.children = [];


HorizontalCollectionView.getDomElement = function() {
    var div = document.createElement("div");
    for (i = 0; i < this.children.length; i++) {
        div.appendChild(this.children[i].getDomElement());
    }
    return div;
}

var OptionDelegatePrototype = clone(StorkDelegate);

/* Each option should be an option with two properties: 
    'value'  this is the "value" attribute in an option
    'text'  this is what is shown to the user. 
*
*/
OptionDelegatePrototype.options = [{ value: "Foo", text: "Foo"},
                                   { value: "Bar", text: "Bar", 
                                     selected:true}];


/*****************************************************************************
* Controller for all views which can select from a set of views to be shown.
*****************************************************************************/

var ViewSelectController = clone(StorkDelegate);

// List of objects which define the titles of the various views to be 
// shown, plus an ID for each. Each ID is a unique identifier for the
// view to be shown, passed to getElementForSelection()
ViewSelectController.viewOptions = [{text: "View 1", value: "view1"}, 
                                    {text: "View 2", value: "view2"}];

// In this implementation each 'view' is just a HTML element. 
// Each option listed with viewOptions should have a similar HTML
// node linked to it.
// These elements should be orphaned (removed from the normal HTML document 
// flow, away from parent).
ViewSelectController.elements = {view1: document.createTextNode("View 1"),
                                 view2: document.createTextNode("View 2")};

// Set this to the ID of the view we want to show.
ViewSelectController.selectedView = "view1";

ViewSelectController.defaultView = document.createTextNode("");


// This sets a mapping between a view ID, as set in viewOptions, and
// a DOM element ID which should be displayed when that view ID is selected.
// This function also removes the element from its parent (making it an orphan)
// so it is no longer displayed in the document flow, until the option is
// selected (and then it will appear as part of whichever view wants to
// display it).

ViewSelectController.setViewElement = function(viewID, elementID) {
    element = document.getElementById(elementID);
    this.elements[viewID] = element;
    element.parentNode.removeChild(element);
}


// Returns an element that should be shown for the given view ID.
// The behaviour in this prototype is just to return one of the elements 
// listed in this.elements. Naturally this can be expanded on for other
// objects.

ViewSelectController.getElementForSelection = function(selection) {
    if (this.elements[selection] == undefined) {
        return this.defaultView;
    }

    return this.elements[selection];
}


/*****************************************************************************
* This is a view where the user can select from a bunch of sub-views by
* clicking on one of a list of view titles.
*
* The widget has two modes, tabled rendering, or div rendering. The first
* is so that the selection options can be placed in a box to the left which
* is of equal size as any content that might appear on the right.
* The div version (default) just has a list of subsequent divs to show the
* content.
*
* CSS elements:
* "sc-clickViewBorder" -- The outer div covering everything inside this
*                         widget.
* "selection" -- The area where the selection options are displayed.
* "content" -- The 'content', ie. the view to be shown for whichever section
*              is selected will appear in this.
* "selection_option-selected", "selection_option-unselected"
*           -- <div>s and <a>s for an option which is selected or not selected.
*****************************************************************************/

var ClickViewSelect = clone(StorkViewDelegatable);

ClickViewSelect.showedElement = undefined;

ClickViewSelect.delegate = ViewSelectController;

// The element that represents a selected tab
ClickViewSelect.currentlySelectedElement = undefined;

// If this is set, the selection options and the content view will be
// separated into two cells in a table. Necessary for sidebar implementation
// as pure CSS is quite limited in what you can do for that. If this is false
// a set of DIVs will be used instead.
ClickViewSelect.tabled = false;

StorkView.toString = function() {
    return "ClickViewSelect";
}

ClickViewSelect.handleEvent = function(event) {
    if (! this.showedElement) {
        return;
    }
    if (! this.delegate) {
        return;
    }

    selectedElement = getTargetElement(event);

    var nextShow = this.delegate.getElementForSelection(selectedElement.id);
    if (nextShow != this.showedElement) {
        this.showedElement.parentNode.appendChild(nextShow);
        this.showedElement.parentNode.removeChild(this.showedElement);
    }
    this.showedElement = nextShow;
    this.currentlySelectedElement.className = "selection_link-unselected";
    this.currentlySelectedElement.parentNode.className = "selection_option-unselected";
    selectedElement.className = "selection_link-selected";
    selectedElement.parentNode.className = "selection_option-selected";
    this.currentlySelectedElement = selectedElement;

    return false;    
}

ClickViewSelect.getDomElement = function() {
    var me = this;
    var outerDiv = document.createElement("div");
    outerDiv.className = "sc-clickViewBorder";
    if (this.tabled) {
        var table = document.createElement("table");
        table.className = "sc-clickViewSelection";
        tbody = document.createElement("tbody");
        table.appendChild(tbody);

        var row = document.createElement("tr");
        row.className = "sc-clickViewSelection";

        var selectionElement = document.createElement("td");
        row.appendChild(selectionElement);

        var contentElement = document.createElement("td");
        row.appendChild(contentElement);

        tbody.appendChild(row);
        outerDiv.appendChild(table);
    } else {
        var selectionElement = document.createElement("div");
        var contentElement = document.createElement("div");
        outerDiv.appendChild(selectionElement);
        outerDiv.appendChild(contentElement);
    }

    selectionElement.className = "selection";
    contentElement.className = "content";

    if (this.delegate != undefined) {
        var viewOptions = this.delegate.viewOptions;
        for (i = 0; i < viewOptions.length; i++) {
            var optionInfo = viewOptions[i];
            var selectionOptionDiv = document.createElement("div");
            selectionOptionDiv.className = "selection_option-unselected";

            // Build link that user can click to switch view
            var link = document.createElement("a");
            selectionOptionDiv.appendChild(link);
            link.setAttribute("href", "#");
            link.className = "selection_link-unselected";
            link.id = optionInfo.value;
            link.onclick = function(event) {
                return me.handleEvent(event);
            }

            if (optionInfo.value == this.delegate.selectedView) {
                // This view was the currently selected one according to
                // delegate
		selectionOptionDiv.className = 
		    "selection_option-selected";
                link.className = 
                    "selection_link-selected";
                this.showedElement = 
                    this.delegate.getElementForSelection(optionInfo.value);
                this.currentlySelectedElement = link;
            }
            link.appendChild(document.createTextNode(optionInfo.text));
            selectionElement.appendChild(selectionOptionDiv);
        }
    }

    if (this.currentlySelectedElement == undefined) {
        // Nothing was specified as currently selected, go with first one    
        var firstElement = selectionElement.childNodes[0].childNodes[0];
        if (firstElement == undefined) {
            return;
        }
        firstElement.className = "selection_link-selected";
        this.showedElement = 
            this.delegate.getElementForSelection(firstElement.id);
        this.currentlySelectedElement = firstElement;

    }

    // Manage content
    if (this.showedElement) {
        contentElement.appendChild(this.showedElement);
    }
    
    // Required clearing div if the CSS defines selection and content divs
    // to be floating.

    clearingDiv = document.createElement("div");
    clearingDiv.className = "finish";
    outerDiv.appendChild(clearingDiv);

    return outerDiv;
};


/***************************************************************************
 * A dialog with sections and buttons at the bottom.
 ***************************************************************************/

var SectionedDialog = clone(ClickViewSelect);

SectionedDialog.buttons = [{
	name: "ok",
	value: "Ok"
    },
    {
	name: "cancel",
	value: "Cancel"
    }];

SectionedDialog.getDomElement = function() {
    console.info("render sectioneddialog");
    /*
    console.info("__proto__: %s", this.__proto__);
    console.info("proto: %s", this.constructor.prototype);
    console.info("base: %s", this.base);*/
    //dom = this.base.prototype.getDomElement.call(this);
    dom = ClickViewSelect.getDomElement.call(this);
    dom.className = "sc-sectioned_dialog";
    buttonDiv = document.createElement("div");
    buttonDiv.className = "buttons";

    for (i=0; i < this.buttons.length; i++) {
	button = document.createElement("input");
	button.setAttribute("type", "submit");
	button.name = this.buttons[i].name;
	button.value = this.buttons[i].value;
	buttonDiv.appendChild(button);
    }
    dom.appendChild(buttonDiv);

    return dom;
}



/*****************************************************************************
* A collection of various views which can be switched by the user by
* selecting from a dropdown. Only
* one is visible at a time.
*****************************************************************************/

var DropDownViewSelect = clone(StorkViewDelegatable);

DropDownViewSelect.select = undefined;

DropDownViewSelect.showedElement = undefined;

DropDownViewSelect.delegate = ViewSelectController;


DropDownViewSelect.handleEvent = function(event) {
    if (! this.select || ! this.showedElement) {
        return;
    }
    if (! this.delegate) {
        return;
    }

    var selected = this.select.options[this.select.selectedIndex].value;
    var nextShow = this.delegate.getElementForSelection(selected);
    this.showedElement.parentNode.appendChild(nextShow);
    this.showedElement.parentNode.removeChild(this.showedElement);
    this.showedElement = nextShow;
    return;
}


DropDownViewSelect.getDomElement = function() {
    var outerDiv = document.createElement("div");
    outerDiv.className = "sc-dropDownViewBorder";
    var titleDiv = document.createElement("div");
    titleDiv.className = "sc-dropDownViewTitleBox";
    outerDiv.appendChild(titleDiv);

    this.select = document.createElement("select");
    this.select.className = "sc-dropDownViewSelect";
    this.select.onchange = this;

    if (this.delegate != undefined) {
        var viewOptions = this.delegate.viewOptions
        if (viewOptions.length > 0) {
            // Use first view as default if nothing else specified as selected
            this.showedElement = 
                this.delegate.getElementForSelection(viewOptions[0].value);
        }

        var selected = this.delegate.selectedView;
        for (i = 0; i < viewOptions.length; i++) {
            // Generate one select option for each delegate viewOptions.
            // Set view of DropDownViewSelect if any of them is selected.
            var optionInfo = viewOptions[i];
            var option = document.createElement("option");
            option.setAttribute("value", optionInfo.value);
            option.setAttribute("style", "color: red;");
            if (optionInfo.value == selected) {
                option.setAttribute("selected");
                this.showedElement = 
                    this.delegate.getElementForSelection(optionInfo.value);
            }
            option.appendChild(document.createTextNode(optionInfo.text));
            this.select.appendChild(option);
        }
    }

    titleDiv.appendChild(this.select);

    contentDiv = document.createElement("div");
    contentDiv.className = "sc-dropDownViewContent";
    if (this.showedElement) {
        contentDiv.appendChild(this.showedElement);
    }
    outerDiv.appendChild(contentDiv);

    return outerDiv;
};



/*****************************************************************************
* Drop-down options
************************************************************************/
        
var OptionPrototype = clone(StorkView);

OptionPrototype.name = "name";

OptionPrototype.delegate = OptionDelegatePrototype;


OptionPrototype.getDomElement = function() {
    var select = document.createElement("select");
    select.setAttribute("name", this.name);

    for (i = 0; i < this.delegate.options.length; i++) {
        var option = document.createElement("option");
        var optionInfo = this.delegate.options[i];
        option.setAttribute("value", optionInfo.value);
        if (optionInfo.selected != undefined) {
            option.setAttribute("selected");
        }
        option.appendChild(document.createTextNode(optionInfo.text));
        select.appendChild(option);
    }

    return select;
};



var FormViewPrototype = clone(StorkView);

FormViewPrototype.element = undefined;

FormViewPrototype.render = function() {
    if (this.element == undefined) {
        return;
    }

    emptyElement(this.element);

    var table = document.createElement("table");
    table.className = "formTable";
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
    
    for (i=0; i < this.delegate.fields.length; i++) {
        var field = this.delegate.fields[i];
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        var label = document.createElement("label");
        label.className = "sc_label";

        text = document.createTextNode(field + ":");
        label.appendChild(text);
        cell.appendChild(label);
        row.appendChild(cell);
        if (this.delegate.fieldObs[field] != undefined) {
            cell = document.createElement("td");
            cell.appendChild(this.delegate.fieldObs[field].getDomElement());
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    this.element.appendChild(table);
}


var FormDelegatePrototype = clone(Stork);

FormViewPrototype.delegate = FormDelegatePrototype;

FormDelegatePrototype.fieldObs = new Object();

FormDelegatePrototype.setField = function(field, storkOb) {
    this.fieldObs[field] = storkOb;
    return;
}

/*************/

var StringView = clone(Stork);

StringView.myText = "";

StringView.text = function(newText) {
    this.myText = newText;
    return this;
}

StringView.getDomElement = function() {
    return document.createTextNode(this.myText);
}
     
    
/*** Input field ***/
     
var InputFieldPrototype = clone(Stork);

InputFieldPrototype.name = "name";
InputFieldPrototype.size = "15";

InputFieldPrototype.getDomElement = function() {
    field = document.createElement("input");
    field.setAttribute("name", this.name);
    field.setAttribute("type", "text");
    field.setAttribute("size", this.size);

    return field;
/*          <input type="text" name="date" id="field_date"
                 value="{% now "Y-m-d" %}" size="10" maxlength="10"> */
};


function _storkCore_includesLoaded() {
    if (typeof(storkCore_loadedCallback) != "undefined") {
        storkCore_loadedCallback();
    }
}
