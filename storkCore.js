/*
 * Set of routines and components to easily built dynamic, functional UIs
 * in Javascript.
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

/**
 * @property {Number} includedNum
 *      unused?
 */
var includedNum = 0;

function getPrototypeOf(object) {
    var proto = undefined;
    if (typeof Object.getPrototypeOf !== "function") {
        if (typeof "test".__proto__ === "object") {
            proto = object.__proto__;
        }
        else {
            proto = object.constructor.prototype;
        }
    }
    else {
        proto = Object.getPrototypeOf(object);
    }
    return proto;
}

/**
 *
 * A clone of an object is an empty object
 * with a prototype reference to the original.
 *
 * For StorkCore we're using an OO model like Self, where there are no
 * classes as such, but objects can clone from any other objects (and
 * inherit from them). Self is the definitive prototype object language and
 * JavaScript is actually based on that notion, which is effective for
 * GUIs. Thus the simple model actually works well with JS.
 *
 * Each cloned object will have a superMethod() available to them, which
 * is a kind of super(). It allows them to call any method from their parent
 * upwards, but with this = object. Can be used when overriding methods to
 * call the original. superMethod should usually be called with a reference
 * to the current method (the one that extended the original), and the
 * string name of the method. E.g. if, within Employee.init() you wanted
 * to do a super to Person.init(), superMethod would be called:
 *
 *     superMethod(Employee.init, "init");
 *
 * This is awkward, but Javascript does not appear to offer a more
 * beautiful alternative.
 *
 * @param {Object} obj
 *      the object to be cloned
 * @return {Object}
 *      the cloned object
 */
function clone(obj) {
    // a private constructor, used only by this one clone.
    function Clone() {
        this._base = obj;
        //console.info("object: %s", obj);
    }

    Clone.prototype = obj;
    var newOb = new Clone();
    if (newOb.cloned != undefined) {
        newOb.cloned();
    }

    /*
     * Goes up the inheritance chain to call a method from this object's
     * ancestors.
     *
     * @param {Object} caller
     *      the method calling this method (used to set the scope)
     * @param {Function} methodName
     *      the method to call.
     * @param {Object...} args
     *      variable number of arguments can be passed to superMethod(). These
     *      will be passed to the final method as normal arguments.
     *
     * @return the return value of super method.
     */
    newOb.superMethod = function(caller, methodName, args) {
        var ob = this;
        var callingImplementation = undefined;
        var max = 50;
        var counter = 0;
        while(callingImplementation == undefined) {
            if(!ob) {
                return;
            }
            if(counter === max) {
                logError("superMethod: Couldn't find the calling implementation.", caller);
                return;
            }

            if(ob.hasOwnProperty(methodName) &&
               ob[methodName] === caller) {
                callingImplementation = ob;
            }

            ob = getPrototypeOf(ob);
            counter++;
        }

        if(!ob) {
            return;
        }

        args = Array.prototype.slice.call(arguments, 2);
        return ob[methodName].apply(this, args);
    };

    return newOb;
}

/**
 * http://stackoverflow.com/questions/728360/copying-an-object-in-javascript
 */
function simpleClone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    var copy = undefined;
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; ++i) {
            copy[i] = simpleClone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = simpleClone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

var getUniqueID = (
    function() {
        var id=0;

        return function() {
            if (arguments[0]==0) {
                id=0;
                return 1;
            } else {
                return id++;
            }
        };
    }
)();


// adding bind to the prototype of Functions, falling back to native support if needed
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


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

function logError(error) {
    if(console && console.error) {
        console.error(error);
    }
}

/**
 * Similar to document.getElementByID, but throws an error if not found.
 */

function elementByID(id) {
    var element = document.getElementById(id);
    if (element == undefined) {
        throw "Element '" + id + "' could not be found";
    } else {
        return element;
    }
}


/**
 * Search through element and its children to find the element with 'id' and
 * return it.
 */

function containedElementByID(element, id) {
    var i, r;

    //    console.log("containedElementByID");
    //    console.log("containedElementByID - element.id: " + element.id);
    if (element.id == id) {
        return element;
    } else {
        for (i=0; i < element.children.length; i++) {
            r = containedElementByID(element.children[i], id);
            if (r != null) {
                return r;
            }
            //return containedElementByID(element.children[i], id);
        }
        return null;
    }
}

function getText(element) {
    if(isString(element)) {
        element = elementByID(element);
    }
    var text = undefined;
    if(element.textContent) {
        text = element.textContent;
    }
    return text;
}

/**
 * Set the textual content of HTML element
 */

function setTextOfElement(element, text) {
    if(isString(element)) {
        element = elementByID(element);
    }
    emptyElement(element);
    element.appendChild(document.createTextNode(text));
}


/**
 * Set the textual content of element defined by 'id'.
 * Throws error if 'id' was not found in the document.
 */

function setTextOfElementID(id, text) {
    setTextOfElement(id, text);
}

/**
 * Number?
 */

function isNumber(object) {
    return Object.prototype.toString.call(object) == '[object Number]';
}

/**
 * String?
 */

function isString(object) {
    return Object.prototype.toString.call(object) == '[object String]';
}

function trim(string) {
    return string ? string.replace(/^\s+|\s+$/g, "") : "";
}

/**
 * Array?
 */

function isArray(object) {
    return Object.prototype.toString.call(object) == '[object Array]';
}

/**
 * Element?
 * @param {Object} object
 * @return {Boolean} if element, true otherwise false
 */

function isElement(object) {
    return (object && object.nodeType == 1);
}

/**
 * Function?
 * @param {Object} object
 * @return {Boolean} if element, true otherwise false
 */

function isFunction(object) {
    return Object.prototype.toString.call(object) === '[object Function]';
};

/** Checks to see if 'element' has a 'className'. **/

function hasClass(element, className) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if (element && element.className && className) {
        return element.className.match(new RegExp('(\\s|^)' + className +
                                                  '(\\s|$)'));
    } else {
        return false;
    }
}


/** Add 'className' to class definition of 'element'. **/

function addClass(element, className) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if (element && className && (!this.hasClass(element, className)) ) {
        element.className += " " + className;
    }
}


/** Remove the 'class' from the class definition of 'element. **/

function removeClass(element, className) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if(hasClass(element,className)) {
        var split = element.className.split(className);
        var newClass = "";
        for(var i=0;i<split.length;i++) {
            var trimmed = trim(split[i]);
            if(trimmed.length > 0) {
                newClass += newClass.length > 0 ? trimmed : trimmed + " ";
            }
        }
        element.className = newClass;
    }
}

function changeClassFromTo(element, from, to) {
    removeClass(element, from);
    addClass(element, to);
    return element;
}

/**
 * Clone a node and update its ID and its children's IDs
 * by assigning 'index' as a number for
 * each.
 *
 * 'Prefix' will be a string attached to the front of each changed ID.
 *
 * The IDs to be replaced should be in the format: `<id>_#n`
 * (e.g. "surname_#n"). The _#n will be replaced with `_#<index>`. So the end
 * result will be: `<prefix><id>_#<index>`
 */

function cloneNodeSetIDs(element, prefix, index) {
    var newNode = element.cloneNode(true);

    setNumberIDs(newNode, index, prefix);
    return newNode;
}


/**
 * Set the indices for each element under 'node' with an ID in the format:
 * `<id>_#<index>`. If the ID of an element ends with "_#n", or if an index
 * of the form '_#<number>' alredy exists at the end, then that
 * part is changed to "_#<index>", otherwise that string is simply added
 * to the end.
 *
 * If 'prefix' is set, that is added to the front of each ID. Then the format
 * is:
 * `<prefix><id>_#<index>`
 *
 * If the prefix already exists, it is not added again.
 *
 * 'index' should be a number.
 */

function setNumberIDs(node, index, prefix) {
    var children, i, indexStart, endMatch, re, matchArray, begin;

    //console.log("setNumberIDS - node: " + node + ", index: " + index +
    //            ", prefix: " + prefix);
    if (prefix == undefined) {
        prefix = "";
    }

    if (node.id != undefined) {
        if (node.id.substr(0, prefix.length) == prefix) {
            // The prefix is already there, do not readd it.
            prefix = "";
        }
        
        indexStart = node.id.length-3;
        endMatch = node.id.substr(indexStart, 3);

        if (endMatch == "_#n") {
            begin = node.id.slice(0, indexStart);
            node.id = prefix + begin + "_#" + index;
        } else {
            re = /_#\d+$/;
            matchArray = re.exec(node.id);
            if (matchArray != null && matchArray.length > 0) {
                // Found an index at the end, replace it.
                indexStart = node.id.length - matchArray[0].length;
                begin = node.id.slice(0, indexStart);
                node.id = prefix + begin + "_#" + index;
            } else {
                node.id = prefix + node.id + "_#" + index;
            }
        }
    }

    children = node.childNodes;
    for (i=0; i < children.length; i++) {
        setNumberIDs(children[i], index, prefix);
    }
}


function updateNumberIDs(node, newIndex) {
    var re, indexStart, idPrefix;

    if (node.id != undefined) {
        re = /_#\d*$/;
        indexStart = node.id.search(re);
        if (indexStart != -1) {
            indexStart = node.id.search(re);
            idPrefix = node.id.substr(0, indexStart);
            node.id = idPrefix + "#_" + newIndex;
        }
    }
}


/**
 * Returns a copy of the object, by creating a new object and copying
 * each property and returning the new object. This does not do a deep
 * copy. Any objects properties point to are not copied, just the references
 */
function objectCopy(source) {
    var ob;

    if (source instanceof Array) {
        ob = [];
    } else {
        ob = {};
    }

    for (var key in source) {
        ob[key] = source[key];
    }

    return ob;
}

function emptyElement(element) {
    //    children = element.childNodes;
    if(isString(element)) {
        element = elementByID(element);
    }
    if(!element || !element.hasChildNodes()) {
        return element;
    }

    var children = element.childNodes;
    while(element.hasChildNodes()) {
        element.removeChild(children[0]);
    }

    return element;
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

function arrayIndexOf(array,item){
    if (!array){
        return -1;
    }
    var i = 0, l = array.length, nativeIndexOf = Array.prototype.indexOf;

    if (nativeIndexOf && array.indexOf === nativeIndexOf){
        return array.indexOf(item);
    }

    for (; i < l; i++){
        if (array[i] === item){
            return i;
        }
    }
    return -1;
}
/**
 * removeFromArray
 * var foo = function() { return "ARGH" };
 * var bar = function() { return "ÖÖRRR" };
 * var array = [foo, bar];
 * array = removeFromArray(array, foo);
 * @param array from which the object is going be removed
 * @param object that is to be removed from the array
 * @return the modified array
 */
function removeFromArray(array, object) {
    var idx=arrayIndexOf(array,object);
    if (idx>=0){
        array.splice(idx, 1);
    }
    return array;
}

/**
 * applyObjectsMethodWithParams
 * Iterates over list of objects and applies the given method with given parameters.
 * var arr = { listeners = [{ event: function() { alert(a + b); } },
 *                          { event: function() { this.concat = a + b; } }],
 *             emitEvent function() {
 *                 applyObjectsMethodWithParams(this.listeners, "event", [this, "a", "b"]);
 *             }
 *           };
 * arr.emitEvent();
 * @param objects list of objects
 * @param method string of the method name
 * @param params method parameters
 * @return array of called objects
 */
function applyObjectsMethodWithParams(objects, method, params) {
    var called = [];
    for(var i=0; i < objects.length; i++) {
        if(objects[i][method]) {
            objects[i][method].apply(objects[i], params);
            called.push(objects[i]);
        }
    }
    return called;
}



/**
 * Base object for all other StorkCore objects.
 *
 * @class StorkCore.Stork
 *
 * @singleton
 */
var Stork = clone(Object);


/**
 * @property {Array} copyProperties
 * List of properties to be copied on a clone
 */
Stork.copyProperties = [];

/**
 * @property {Array} cloneProperties
 * List of properties to clone
 */
Stork.cloneProperties = [];

/**
 * This is called on the new object after it was created by cloning.
 *
 * Can be used to define behaviour of properties during the cloning process.
 */
Stork.cloned = function() {
    var i, property;

    //this.listeners = objectCopy(this.listeners);
    this.copyProperties = objectCopy(this.copyProperties);
    for (i = 0; i < this.copyProperties.length; i++) {
        property = this.copyProperties[i];
        this[property] = objectCopy(this[property]);
    }
    
    this.cloneProperties = objectCopy(this.cloneProperties);
    for (i=0; i < this.cloneProperties.length; i++) {
        property = this.cloneProperties[i];
        this[property] = clone(this[property]);
    }
};


/**
 * Callback to initialize the clone. Must be explicitly called
 */
Stork.init = function() {
    return this;
};


/**
 * Use this to declare a property of this object which will have its
 * content automatically copied when the object is cloned.
 *
 * This should be used with e.g.
 * arrays that are not intended to be shared by all the clones of an object
 * (although they get the original copy). clone() will copy the property,
 * but with arrays and objects that is a reference to the object, thus
 * meaning every clone will share that same array or object. This can sometimes
 * be intentional, but often is not -- particularly with arrays. It is not
 * necessary to use this for simple values such as numbers, or for properties
 * which are just set with new objects (instead of changing the content of the
 * object).
 *
 * A deep copy is not made of these properties, so any values within the array
 * or object will not be copied. Only the array or object itself.
 *
 *
 * @param {string} property is the name of the property for this object (it will
 *          be made into a normal object property.
 * @param {Mixed} defaultValue is the value to set the property to when initialising.
 */
Stork.copiedProperty = function(property, defaultValue) {
    this[property] = defaultValue;
    this.copyProperties.push(property);
};


/**
 * Create a certain property of this object which should be automatically
 * cloned when the object is cloned. Normally the object pointed to by
 * a property would be shared by the two clones (the properties point to the
 * same obejct). Using clonedProperty() the object the property points to is
 * itself cloned.
 *
 * @param {string} property String name of the property that should be created,
 *       and marked to be auto-cloned (the object it points to is cloned).
 *
 * @param {Mixed} sourceObject The object from which clones will be made for
 *       'property' upon every clone of this Stork object.
 */
Stork.clonedProperty = function(property, sourceObject) {    
    this[property] = sourceObject;
    this.cloneProperties.push(property);
};


/**
 * Basic event management to cover some browser differences.
 *
 * @class StorkCore.EventListenerRegistry
 * @extends StorkCore.Stork
 * @singleton
 */
var EventListenerRegistry = clone(Stork);
/**
 * @property {Object} transitionEndHandlers
 * registry of transitionEnd handlers
 */
EventListenerRegistry.transitionEndHandlers = {};

/**
 * identifies the browser support for css transitions and hooks up an element
 * listening for the transition event with an object wich provides
 * 'transitionEnd' method as the callback for transition end
 *
 * @param {HTMLElement} element HTML element to attach the transitionEnd event
 *          listener to
 * @param {Object} ob object containing a 'transitionEnd' method which will be
 *          used as callback
 * @return {Function/undefined} callback function created if there is support for
 *          transitions or undefined
 */
EventListenerRegistry.catchTransitionEnd = function(element, ob) {
    var my = this;
    if (! cssSupports("transitionProperty")) {
        // Transitions not supported by browser, so directly call the
        // handler. Transition happened immediately.
        ob.transitionEnd(element);
        return undefined;
    } else {
        var f = function() {
            ob.transitionEnd(element);
        };
        bean.add(element, 'transitionend webkitTransitionEnd oTransitionEnd', f);
        return f;
    }
};


/**
 * detaches the event listener for css transition end in browsers which support
 * them. This is used with callbacks set in {@link #catchTransitionEnd}
 *
 * @param {HTMLElement} element HTML element to attach the transitionEnd event
 *          listener to
 * @param {Object} ob object containing a 'transitionEnd' method which will be
 *          used as callback
 * @return {Function/undefined} callback function created if there is support for
 *          transitions or undefined
 */
EventListenerRegistry.uncatchTransitionEnd = function(element, f) {
    //    console.log("uncatchTransitionEnd - f: ");
    //console.log(f);
    if (! cssSupports("transitionProperty")) {
        return;
    }
    if (f == undefined) {
        return;
    }

    //    console.log("uncatchTransitionEnd - remove listeners");
    bean.remove(element, 'transitionend webkitTransitionEnd oTransitionEnd', f, false);
};




/**
 * Base for all model objects within StorkCore
 * @class StorkCore.StorkModel
 * @extends StorkCore.Stork
 * @singleton
 */
var StorkModel = clone(Stork);


/**
 * @property {Array} listeners
 * array of listeners registered for the model
 */
StorkModel.copiedProperty("listeners", []);
/**
 * @property {Object} modelProperties
 * object containing the default properties and their vaules for the model
 */
StorkModel.copiedProperty("modelProperties", {});


/**
 * creates a model by cloning itself and applying to the clone all the
 * attributes existing in the object passed as argument
 *
 * @param {Object} object source object of the properties to be applied to the
 *      clone
 * @return {StorkCore.StorkModel} the clone of this model with all the
 *      properties from the 'object' argument applied
 */
StorkModel.createFromObject = function(object) {
    var model = clone(this);
    for (var key in object) {
        model.setProperty(key, object[key]);
    }
    return model;
};


/**
 * Add 'listener' to the list of objects that will be informed when
 * something is changed in this model.
 *
 * @param {Object} listener
 *    !verify an object with method 'propertyChangeEvent' as attribute, which
 *    will be used as callback when a property in the model changes
 *
 */
StorkModel.addListener = function(listener) {
    if (!listener){
        throw new Error("Empty object passed to StorkModel.addListener");
    }
    this.listeners.push(listener);
};
/**
 * Remove an object listening for changes in the attributes of this model
 *
 * @param {Object} listener
 *    the object registered as listener to be deleted
 */
StorkModel.removeListener = function(listener) {
    this.listeners = removeFromArray(this.listeners, listener);
};

/**
 * applies to this model properties all the properties in an object passed as
 * argument
 *
 * @param {Object} properties object from which to set the properties into this
 *      model properties
 */
StorkModel.setProperties = function(properties) {
    for(var property in properties) {
        if(properties.hasOwnProperty(property)) {
            this.setProperty(property, properties[property]);
        }
    }
};


/**
 * Return an object containing each property of this model as a field in the
 * object.
 *
 * https://developer.mozilla.org/en/JSON#toJSON()_method
 *
 */
StorkModel.toJSON = function() {
    return this.modelProperties;
};

/**
 * sets the value for a property in the model. It also calls method to inform
 * listeners about the property value change
 *
 * @param {string} key name of the property to set a value to
 * @param {Mixed} value value to set to the property
 */
StorkModel.setProperty = function(key, value) {
    var oldValue = this.modelProperties[key];
    this.modelProperties[key] = value;
    var values = {
        oldValue: oldValue,
        value: value
    };
    this._informListeners(key, oldValue, value);
};


/**
 * returns the value of a property
 *
 * @param {string} key name of the property to get the value from
 */
StorkModel.getProperty = function(key) {
    return this.modelProperties[key];
};


/**
 * returns true if the model has the property
 *
 * @param {string} key name of the property to get the value from
 * @return {Boolean} true if this has the property
 */
StorkModel.hasProperty = function(key) {
    if (this.modelProperties[key] != undefined) {
        return true;
    } else {
        return false;
    }
};


/**
 * @private
 * calls all the listeners for the model properties value change. The listeners
 * should have a method named "propertyChangeEvent" which receives parameters
 *  (model, property, oldvalue, newValue)
 *
 * @param {string} property name of the property changed
 * @param {Mixed} oldValue old value of the property changed
 * @param {Mixed} newValue new value of the property changed
 */
StorkModel._informListeners = function(property, oldValue, newValue) {
    for(var i=0; i < this.listeners.length; i++) {
        if(this.listeners[i]["propertyChangeEvent"]) {
            this.listeners[i].propertyChangeEvent(this, property, oldValue,
                                                  newValue);
        }
    }
};


/* ****************************************************************************
 * Base for all controllers within Storkcore.
 *****************************************************************************/

/**
 * Base for all controller objects within StorkCore
 *
 * @class StorkCore.StorkController
 * @extends StorkCore.Stork
 * @singleton
 */
var StorkController = clone(Stork);

/**
 * @property {Array} listeners
 *      list of listeners attached to this controller
 */
StorkController.copiedProperty("listeners", []);
/**
 * @property {Array} keyBindings
 *      list of key bindings attached to the controller
 */
StorkController.copiedProperty("keyBindings", []);


/**
 * @property {StorkCore.StorkModel} model
 *      the StorkModel linked to this controller.
 */
StorkController.model = undefined;

/**
 * @property {Boolean} disabled
 *      true to make the controler disabled
 * @readonly
 */
StorkController.disabled = false;

/**
 * @property {Object} keyCodes
 *      map of the most used keycodes
 */
StorkController.keyCodes = {
    "13": "<<return>>",
    "27": "<<escape>>",
    "37": "<<left>>",
    "39": "<<right>>"
};


/**
 * Set up HTML 'element' to be the resulting view for this controller.
 * How exactly the controller manages the element depends on its implementation.
 *
 * This is a skeleton method. It should be overridden if more functionality
 * needs to take place on attachment.
 *
 * @param {HTMLElement/String} element
 *      HTML element or string with id of an htmlelement to attach the
 *      controller to
 */
StorkController.attach = function(element) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if(!element) {
        throw "Can't attach to a undefined value!";
    }
    this.myElement = element;
    var my = this;
    this._keyFunc = function(e) {
        var keyCode;
        var key;

        if ( (e.which == undefined || e.which == 0) &&
             (e.charCode == undefined || e.charCode == 0) ) {
            // We don't deal with special keys for now
            return true;
        }

        if (e.keyCode == 0) {
            keyCode = e.charCode;
        } else {
            keyCode = e.keyCode;
        }

        // Check to see if the keycode matches the special keys from
        // the key table
        if (my.keyCodes[keyCode] != undefined) {
            key = my.keyCodes[keyCode];
        } else {
            key = String.fromCharCode(keyCode);
        }

        if ( (my.keyBindings[key] != undefined) &&
             (my.keyBindings[key].length != 0)) {
            // Keybinding available for this key
            for (var i=0; i < my.keyBindings[key].length; i++) {
                var bindingInfo = my.keyBindings[key][i];
                var ob = bindingInfo.target;
                var method = bindingInfo.method;
                ob[method](my, key);
            }

            if (e.preventDefault) {
                e.preventDefault();
            }
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            return false;
        }
        return true;
    };
    bean.add(element, "keypress", this._keyFunc, true);

    this.isDisabled();
};

/**
 * Checks if the controller is disabled
 *
 * @returns {Boolean} true if the controller is disabled
 */
StorkController.isDisabled = function() {
    var disabled = this.disabled;
    if(this.myElement) {
        disabled = hasClass(this.myElement, "disabled") || this.myElement.disabled;
    }
    this.disabled = disabled;
    return disabled;
};

/**
 * Disables the controller
 */
StorkController.disable = function() {
    addClass(this.myElement, "disabled");
    if(this.myElement) {
        this.myElement.setAttribute("disabled", true);
    }
    this.disabled = true;
};

/**
 * Enables the controller
 */
StorkController.enable = function() {
    removeClass(this.myElement, "disabled");
    if(this.myElement.hasAttribute("disabled")) {
        this.myElement.removeAttribute("disabled");
    }
    this.disabled = false;
};

/**
 * Binds the pressing of a key to a method in an object.
 *
 * 'key' is the character we want to bind to (e.g. "k") or a key
 *       identifier. Currently only `<<return>>` is supported for a key
 *       identifier.
 * 'target' is the object that the callback method will be called on
 *          ('this' will point to it during the call).
 * 'methodName' is the name of the method to call, as a string.
 *
 * Once this bind has been made, normal actions for that key will not take
 * place. So if a form element is bound to `<<return>>`, the form will not
 * be submit when return is called, but the callback method will be called.
 * The character is case sensitive so "k" and "K" are different.
 *
 * @param {string} key
 *      (verify!) key code to bind
 * @param {HTMLElement/string} target
 *      (verify!) the target element receiving the keypress
 * @param {HTMLElement/string} methodName
 *      (verify!) methodName name of hte method (in this controller) to use as
 *      callback when the key event happens
 *
 *  @return {Boolean} true if the key binding is correctly added
 */
StorkController.bindKey = function(key, target, methodName) {
    if (this.keyBindings[key] == undefined) {
        this.keyBindings[key] = [];
    }

    if(!key || !target || !methodName) {
        return false;
    }

    this.keyBindings[key].push({
        target: target,
        method: methodName
    });
    return true;
};


/**
 * Return the HTML element previously set with attach()
 * @return {HTMLElement} the HTML element previously set with attach()
 */
StorkController.getElement = function() {
    return this.myElement;
};

/**
 * Returns true if the controler has un underlying element
 * @return {Boolean} true if the controler has un underlying element
 */
StorkController.hasElement = function() {
    return this.myElement ? true : false;
};


/**
 * Return the model connected with this controller.
 *
 * @return {StorkCore.StorkModel/undefined}
 *      the model connected with this controller.
 */
StorkController.getModel = function() {
    return this.model;
};


/**
 * Add 'listener' to the list of objects that will be informed when
 * events happen.
 *
 * @param {Object} listener
 *      object with the listener methods to be added to ourlisteners
 */
StorkController.addListener = function(listener) {
    if (!listener) {
        throw new Error("Empty object passed to StorkModel.addListener");
    }
    this.listeners.push(listener);
};

/**
 * Remove listener from the list of objects that will be informed
 * of events.
 *
 * @param {Object} listener
 *      listener object to be removed to our listeners
 */
StorkController.removeListener = function(listener) {
    this.listeners = removeFromArray(this.listeners, listener);
};

/**
 * Inform listeners of a particular event
 *
 * @param {Event} event
 *      event to be informed about
 * @param {Object} eventParams
 *      (verify! if is object or array) parameters that will be given with
 *      the event
 */
StorkController.informListeners = function(event, eventParams) {
    applyObjectsMethodWithParams(this.listeners, event, eventParams);
};


/**
 * Focuses an element
 *
 * @param {HTMLElement} element
 *      HTML element to focus, if no element is passed the element for this
 *      controller is used
 */
StorkController.focus = function(element) {
    element = element || this.getElement();
    if(element) {
        element.focus();
    }
};


/**
 * Sets the model for this controller. Will add itself as a listener
 * to the model, to hear changes
 *
 * @param model
 */

StorkController.setModel = function(model) {
    if (this.model) {
        this.unsetModel();
    }
    this.model = model;
    this.model.addListener(this);
    if (this.myElement != undefined) {
        this.refresh();
    }
};


/**
 * 
 *
 * @param model
 */
StorkController.unsetModel = function() {
    if (this.model) {
        this.model.removeListener(this);
    }
};


/**
 * Reacts to a change of any propert in the model attached to this item.
 */
StorkController.propertyChangeEvent = function(property, oldValue,
                                                  newValue) {
};


/* ****************************************************************************
 * StorkView is a base view for all views within Storkcore.
 * @class StorkCore.StorkView
 * @extends StorkCore.Stork
 *****************************************************************************/

var StorkView = clone(Stork);


/* The StorkModel linked to this controller. */
StorkView.model = undefined;


/**
 * Initialises the view. If it's cloned from a previous view that had a
 * model set, will apply to listen to that model.
 */

StorkView.cloned = function() {
    this.superMethod(StorkView.cloned, "cloned");
    if (this.model) {
        this.model.addListener(this);
    }
}


/**
 * Reacts to a change of any propertt in the model attached to this item.
 */
StorkView.propertyChangeEvent = function(property, oldValue,
                                         newValue) {
    // We're going to be lazy here and just refresh the whole thing.
    // Can be easily optimised when and if performance is an issue.
    this.refresh();
};


/**
 * Refresh content of the view. Is a no-op dummy at this level.
 */

StorkView.refresh = function() {
// Here we should probably go through all the objects that clone from this
// and refresh them too
}


/**
 * Sets the model for this controller. Will add itself as a listener
 * to the model, to hear changes
 *
 * @param model
 */

StorkView.setModel = function(model) {
    if (this.model) {
        this.unsetModel();
    }
    this.model = model;
    this.model.addListener(this);
    this.refresh();
};


/**
 * Removes model from this view. Removes view as listener of model.
 *
 * @param model
 */
StorkView.unsetModel = function() {
    if (this.model) {
        this.model.removeListener(this);
    }
};


/*****************************************************************************
 * StorkHtmlView is a special, but widely used view in storkCore, which
 * operates a HTML element. Provides ways to link StorkModels
 * directly to aspects of the HTML element. Thus actual rendering work is
 * kept, in most cases, to a minimum.
 *****************************************************************************/

var StorkHtmlView = clone(StorkView);


// The HTML element this view will be attached to
StorkHtmlView.element = undefined;

/* Index of element IDs in the HTML element used by this view. If -1,
   nothing has been set (this object might be using the original HTML,
   not the copied one).*/
StorkHtmlView.elementIndex = -1;

/**
 * @property {Array} listeners
 *      list of listeners attached to this controller
 */
StorkHtmlView.copiedProperty("listeners", []);
/**
 * @property {Array} keyBindings
 *      list of key bindings attached to the controller
 */
StorkHtmlView.copiedProperty("keyBindings", []);

/**
 * @property textProperties
 *      list of textual properties tied to a StorkModel
 */
StorkHtmlView.copiedProperty("textProperties", {});
/**
 * @property attrProperties
 */
StorkHtmlView.copiedProperty("attrProperties", {});
/**
 * @property attrMaps
 */
StorkHtmlView.copiedProperty("attrMaps", {});
/**
 * @property propertyMethods
 */
StorkHtmlView.copiedProperty("propertyMethods", {});
/**
 * @property textPropertyMethods
 */
StorkHtmlView.copiedProperty("textPropertyMethods", {});


/**
 * Initialises the view. If this object has a HTML element attached
 * to it (e.g. if it was cloned from an object that had that), then
 * that element will itself be cloned into a new element, but with all
 * 'id' attributes within the structure of that element changed to a new, 
 * unique ones.
 *
 * The mapping from the original names to the new ones will, however,
 * be retained, so that the elements can be retreived with
 * StorkHtmlView.getMyElementByID()
 */

StorkHtmlView.cloned = function() {
    this.superMethod(StorkHtmlView.cloned, "cloned");
    if (this.element) {
        this.elementIndex = getUniqueID();
        this.element = cloneNodeSetIDs(this.element, "StorkHtmlView-",
                                       this.elementIndex);
    }
    return this;
}


/**
 * Return the element based on the original 'id'. If this view has been
 * cloned from one with a HTML element linked to it, the IDs will be 
 * changed as part of cloning the original HTML element. This method 
 * allows access to the equivalent elements in this clone.
 */

StorkHtmlView.getMyElementByID = function(id) {
    if (this.element == undefined) {
        return null;
    }
    
    if (this.elementIndex != -1) {
        id = "StorkHtmlView-" + id + "_#" + this.elementIndex;
    }

    if (this.element.parentElement) {        
        return document.getElementById(id);
    } else {
        // The HTML element of this view is not in the document (yet), ie.
        // it's an orphan. Find the requested ID by going through the
        // HTML element.
        return containedElementByID(this.element, id);
    }
}


/**
 * Append the HTML of this view (that done with a previous attach()) as
 * a child of 'parentElement'.
 */

StorkHtmlView.appendToElement = function(parentElement) {
    if (this.element) {
        parentElement.appendChild(this.element);
    }
}


/**
 * Links a text property from the model to the content of an element. Note
 * that this completely empties the given element when the text property is 
 * changed, and replaces the content with the model's property value.
 *
 * @param modelProperty
 *        String that gives the name of the property from the model to link to
 *
 * @param id
 *        ID of the element which should have its text content altered.
 */

StorkHtmlView.linkPropertyToText = function(modelProperty, id) {
    this.textProperties[modelProperty] = id;
};


/**
 * Links the result of a method call on the model to the textual content
 * of an element. Note that in this case there cannot be any automatic
 * updating from the model, but that the model itself has to inform
 * the controller (through refresh() or similar) of the change - in addition
 * to the update that happens as part of setModel().
 *
 * @param modelMethod  
 *     Method to call on the StorkModel to get the text content.
 * 
 * @param id
 *     ID of the element which should have its text content altered. 
 */

StorkHtmlView.linkPropertyMethodToText = function(modelMethod, id) {
    this.textPropertyMethods[modelMethod] = id;
};


/**
 * Links a property from the model of this controller to a HTML attribute
 * of a HTML element.
 *
 * @param modelProperty
 *        String that gives the name of the property from the model to link to
 *
 * @param id
 *        ID of the element which should have its text content altered.
 *
 *
 * @param attributeName
 *        The attribute that will be changed, based on the content
 *        of the model property.
 */
StorkHtmlView.linkPropertyToAttr = function(modelProperty, id,
                                            attributeName) {
    this.attrProperties[modelProperty] = {
        id: id,
        attribute: attributeName
    };
};


/**
 * Map a set of possible model property values to equivalent values for
 * an attribute of an element.
 *
 * @param modelProperty 
 *     The model property for which values should be checked.
 * @param id 
 *     ID of the element we should set the attribute for.
 * @param attrName 
 *     The attribute to be set in the HTML element.
 * @param propertyMap 
 *     An object with each property key matching a possible value
 *     for 'modelProperty' and with the value being the value to set
 *     'attrName'.
 */

StorkHtmlView.mapPropertyToAttr = function(modelProperty, id,
                                           attrName, propertyMap) {
    this.attrMaps[modelProperty] = {
        id: id,
        attrName: attrName,
        propertyMap: propertyMap
    };
};


/**
 * Link changes in a model's property to a method of this object.
 *
 * @param modelProperty
 *               Model property to track.
 *
 * @param methodName
 *               The name of the method from this object to call when the
 *               model's property gets altered.
 *
 * @param elementIDMap
 *               If set, an object with each property mapped to an element
 *               ID. The property basically acts as a name for that 
 *               desired element. So that if the method in 'methodName'
 *               wants to change the text of a field giving a car's colour,
 *               as well as the model of the car,
 *               it can do that by looking up elementIds["colourElement"].
 *               This elementIDMap will be passed to 'methodName'.
 *               Deprecated:
 *               If set, is a list of IDs for elements that should be passed
 *               to the method called. 
 *               The actual elements will be looked up and passed to the method
 *               in its 'elements' argument.
 *
 *               If this is not defiend, 'elements' will not be passed to the
 *               method.
 *
 * The method will be called with either one or two arguments:
 * 'modelProperty' and optionally 'elementIDMap', as specified above.
 *
 */
StorkHtmlView.linkPropertyToMethod = function(modelProperty, methodName,
                                                elementIDMap) {
    this.propertyMethods[modelProperty] = {
        elementIDMap: elementIDMap,
        method: methodName
    };
};


/**
 * Set up HTML 'element' linked to this HTML view. That element will be a
 * HTML rendering of this view.
 *
 * @param {HTMLElement/String} element
 *      HTML element or string with id of an htmlelement to attach the
 *      controller to
 */

StorkHtmlView.attach = function(element) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if(!element) {
        throw "Can't attach to a undefined value!";
    }
    this.element = element;
    this.elementIndex = -1;
    return;
};


/**
 * Do a full refresh of the values in the element.
 */
StorkHtmlView.refresh = function() {
    if (this.element == undefined) {
        // If the element hasn't been set yet, do nothing.
        return;
    }

    this._refreshTextProperties();
    this._refreshAttributesProperties();
    this._refreshMapAttributes();
    this._refreshPropertyMethods();
    this._refreshTextPropertyMethods(); 
};


/**
 * @private
 */
StorkHtmlView._refreshTextProperties = function() {
    for (var key in this.textProperties) {
        if (this.textProperties[key] != undefined) {
            var elementID = this.textProperties[key];
            var textContainer = this.getMyElementByID(elementID);
            if (textContainer != null) {
                emptyElement(textContainer);
                var text = this.model.getProperty(key);
                textContainer.appendChild(document.createTextNode(text));
            }
        }
    }
};


/**
 * Go through the model's property methods, call them, and put the result
 * in the defined element.
 * @private
 */
StorkHtmlView._refreshTextPropertyMethods = function() {
    for(var key in this.textPropertyMethods) {
        if (this.textPropertyMethods[key] != undefined) {
            //var elementID = this.generateElementID(this.textPropertyMethods[key]);
            var elementID = this.textPropertyMethods[key];
            var textContainer = document.getElementById(elementID);
            if (textContainer != null) {
                emptyElement(textContainer);
                var text = this.model[key].call(this.model, []);
                textContainer.appendChild(document.createTextNode(text));
            }
        }
    }
};


/**
 * @private
 */
StorkHtmlView._refreshAttributesProperties = function() {
    for (var key in this.attrProperties) {
        if (this.attrProperties[key] != undefined) {
            var data = this.attrProperties[key];
            var elementID = data["id"];
            var element = document.getElementById(elementID);
            if (element != null) {
                var value = this.model.getProperty(key);
                element.setAttribute(data["attribute"], value);
            }
        }
    }
};


/**
 * @private
 */
StorkHtmlView._refreshMapAttributes = function() {
    for (var key in this.attrMaps) {
        var data = this.attrMaps[key];
        if (this.model.hasProperty(key)) {
            //var elementID = this.generateElementID(data["idPrefix"]);
            var elementID = data["id"];
            //console.log("createElement: elementID: " + elementID);
            var element = document.getElementById(elementID);

            if (element != undefined) {
                var map = data["propertyMap"];
                var value = this.model.getProperty(key);
                var mappedValue = map[value];
                if (mappedValue != undefined) {
                    element.setAttribute(data["attrName"], mappedValue);
                }
            }
        }
    }
};


/**
 * Goes through the methods linked to properties to see if they need to be
 * called.
 * @private
 */
StorkHtmlView._refreshPropertyMethods = function() {
    for (var key in this.propertyMethods) {
        var elementID, element, i, methodElements, elementName;
        if (this.propertyMethods[key] != undefined) {
            var data = this.propertyMethods[key];

            if (data["elementIDMap"] != undefined) {
                this[data.method](key, data["elementIDMap"]);
            } else {
                this[data.method](key);
            }
        }
    }
};



/*****************************************************************************/
/* Specialised objects */

/**
 * Represents a single page. Ie. a combination of a number of other
 * elements and controls, with a main element covering all of them.
 *
 * @class StorkCore.StorkPage
 * @extends StorkCore.StorkController
 * @singleton
 */

var StorkPage = clone(StorkController);

/**
 * sets the model for this page
 *
 * @param {StorkCore.StorkModel} model for the page represented
 */
StorkPage.setModel = function(model) {
    this.model = model;
    this.update();
};

/**
 * updates the base controller once the model has been set into the model
 * property
 *
 * @abstract
 */
StorkPage.update = function() {
};

/**
 * Base view for any view which can have its events delegated to another
 * object.
 *
 * @class StorkCore.StorkViewDelegatable
 * @extends StorkCore.StorkView
 * @singleton
 *
 */
var StorkViewDelegatable = clone(StorkView);

/**
 * @property {StorkCore.StorkDelegate} delegate
 *      delegate Stork for the StorkViewDelegatable
 */
StorkViewDelegatable.delegate = undefined;

/**
 * Base delegate. Delegates should clone this.
 *
 * @class StorkCore.StorkDelegate
 * @extends StorkCore.Stork
 * @singleton
 */
var StorkDelegate = clone(Stork);


/**
 * Forms a collection of StorkViews displayed horizontally
 *
 * @class StorkCore.HorizontalCollectionView
 * @extends StorkCore.StorkView
 * @singleton
 */
var HorizontalCollectionView = clone(StorkView);

/**
 * @property {Array} children
 *      array of StorkCore.StorkView views which are children of the collection
 */
HorizontalCollectionView.children = [];

/*
 * overrides the method in the superclass
 */
HorizontalCollectionView.getDomElement = function() {
    var div = document.createElement("div");
    for (var i = 0; i < this.children.length; i++) {
        div.appendChild(this.children[i].getDomElement());
    }
    return div;
};


/**
 * delegate for select-type views
 *
 * @class StorkCore.OptionDelegatePrototype
 * @extends StorkCore.StorkDelegate
 * @singleton
 */
var OptionDelegatePrototype = clone(StorkDelegate);

/**
 * @property {Array} options
 *
 * List of options for the delegate.
 *
 * Each option should be an option with properties:
 *
 *  * 'value'  this is the "value" attribute in an option
 *  * 'text'  this is what is shown to the user. To
 *  * 'selected'  [optional] true if the item is selected
 *
 *          @example
 *          [{ value: "Foo", text: "Foo"},
 *           { value: "Bar", text: "Bar", selected:true}]
 *
 *
 */
OptionDelegatePrototype.options = [];


/**
 * Controller for all views which can select from a set of views to be shown.
 *
 * @class StorkCore.ViewSelectController
 * @extends StorkCore.StorkDelegate
 * @singleton
 */
var ViewSelectController = clone(StorkDelegate);

/**
 * @cfg{Array} viewOptions
 *
 * List of objects which define the titles of the various views to be shown,
 * plus an ID for each. Each ID is a unique identifier for the view to be
 * shown, passed to {@link #getElementForSelection}
 *
 *     @example
 *     [{text: "View 1", value: "view1"},
        {text: "View 2", value: "view2"}]
 */
ViewSelectController.viewOptions = [{text: "View 1", value: "view1"},
                                    {text: "View 2", value: "view2"}];

/**
 * @cfg {Object} elements
 * In this implementation each 'view' is just a HTML element.
 *
 * Each option listed with viewOptions should have a similar HTML
 * node linked to it.
 *
 * These elements should be orphaned (removed from the normal HTML document
 * flow, away from parent).
 *
 *     @example
 *     {view1: document.createTextNode("View 1"),
 *     view2: document.createTextNode("View 2")}
 *
 */

ViewSelectController.elements = {};

/**
 * @cfg {String} selectedView
 *
 * Set this to the ID of the view we want to show.
 */
ViewSelectController.selectedView = "view1";


/**
 * @cfg {HTMLElement} defaultView
 *
 * HTMLElement representing the default view
 */
ViewSelectController.defaultView = document.createTextNode("");


/**
 *
 * Sets a mapping between a view ID, as set in viewOptions, and a DOM element
 * ID which should be displayed when that view ID is selected.
 *
 * This function also removes the element from its parent (making it an orphan)
 * so it is no longer displayed in the document flow, until the option is
 * selected (and then it will appear as part of whichever view wants to
 * display it).
 *
 * @param {String} viewID
 *      DOM id of the view to set the element to
 * @param {String} elementID
 *      DOM id of the element to set in the view
 */

ViewSelectController.setViewElement = function(viewID, elementID) {
    var element = document.getElementById(elementID);
    this.elements[viewID] = element;
    element.parentNode.removeChild(element);
};


/**
 * Returns an element that should be shown for the given view ID.
 *
 * The behaviour in this prototype is just to return one of the elements
 * listed in this.elements. Naturally this can be expanded on for other
 * objects.
 *
 * @param {String} selection
 *      the view id to select
 *
 * @return {HTMLElement/Array}
 *      the default view HTML Element or the elements for the selected view
 *      passed as parameters
 */
ViewSelectController.getElementForSelection = function(selection) {
    if (this.elements[selection] == undefined) {
        return this.defaultView;
    }

    return this.elements[selection];
};

/**
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
 *  * __sc-clickViewBorder__: The outer div covering everything inside this
 *    widget.
 *  * __selection__: The area where the selection options are displayed.
 *  * __content__: The 'content', ie. the view to be shown for whichever section
 *    is selected will appear in this.
 *  * __selection_option-selected, selection_option-unselected__: `<div>`s and
 *    `<a>`s for an option which is selected or not selected.
 *
 *  @class StorkCore.ClickViewSelect
 *  @extends StorkCore.StorkViewDelegatable
 *  @singleton
 */
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
};

ClickViewSelect.handleEvent = function(event) {
    if (! this.showedElement) {
        return false;
    }
    if (! this.delegate) {
        return false;
    }

    var selectedElement = getTargetElement(event);

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
};

ClickViewSelect.getDomElement = function() {
    var me = this;
    var outerDiv = document.createElement("div");
    outerDiv.className = "sc-clickViewBorder";
    var selectionElement;
    var contentElement;
    if (this.tabled) {
        var table = document.createElement("table");
        table.className = "sc-clickViewSelection";
        var tbody = document.createElement("tbody");
        table.appendChild(tbody);

        var row = document.createElement("tr");
        row.className = "sc-clickViewSelection";

        selectionElement = document.createElement("td");
        row.appendChild(selectionElement);

        contentElement = document.createElement("td");
        row.appendChild(contentElement);

        tbody.appendChild(row);
        outerDiv.appendChild(table);
    } else {
        selectionElement = document.createElement("div");
        contentElement = document.createElement("div");
        outerDiv.appendChild(selectionElement);
        outerDiv.appendChild(contentElement);
    }

    selectionElement.className = "selection";
    contentElement.className = "content";

    if (this.delegate != undefined) {
        var viewOptions = this.delegate.viewOptions;
        for (var i = 0; i < viewOptions.length; i++) {
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
            };

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

    var clearingDiv = document.createElement("div");
    clearingDiv.className = "finish";
    outerDiv.appendChild(clearingDiv);

    return outerDiv;
};


/***************************************************************************
 * A dialog with sections and buttons at the bottom.
 ***************************************************************************/

var SectionedDialog = clone(ClickViewSelect);

SectionedDialog.buttons = [
    {
        name: "ok",
        value: "Ok"
    },
    {
        name: "cancel",
        value: "Cancel"
    }
];

SectionedDialog.getDomElement = function() {
    var dom = ClickViewSelect.getDomElement.call(this);
    dom.className = "sc-sectioned_dialog";
    var buttonDiv = document.createElement("div");
    buttonDiv.className = "buttons";

    for (var i=0; i < this.buttons.length; i++) {
        var button = document.createElement("input");
        button.setAttribute("type", "submit");
        button.name = this.buttons[i].name;
        button.value = this.buttons[i].value;
        buttonDiv.appendChild(button);
    }
    dom.appendChild(buttonDiv);
    return dom;
};



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
};


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
        var viewOptions = this.delegate.viewOptions;
        if (viewOptions.length > 0) {
            // Use first view as default if nothing else specified as selected
            this.showedElement =
                this.delegate.getElementForSelection(viewOptions[0].value);
        }

        var selected = this.delegate.selectedView;
        for (var i = 0; i < viewOptions.length; i++) {
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

    var contentDiv = document.createElement("div");
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

    for (var i = 0; i < this.delegate.options.length; i++) {
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
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    for (var i=0; i < this.delegate.fields.length; i++) {
        var field = this.delegate.fields[i];
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        var label = document.createElement("label");
        label.className = "sc_label";

        var text = document.createTextNode(field + ":");
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
};


var FormDelegatePrototype = clone(Stork);

FormViewPrototype.delegate = FormDelegatePrototype;

FormDelegatePrototype.fieldObs = new Object();

FormDelegatePrototype.setField = function(field, storkOb) {
    this.fieldObs[field] = storkOb;
    return;
};

/*************/

var StringView = clone(Stork);

StringView.myText = "";

StringView.text = function(newText) {
    this.myText = newText;
    return this;
};

StringView.getDomElement = function() {
    return document.createTextNode(this.myText);
};


/*** Input field ***/

var InputFieldPrototype = clone(Stork);

InputFieldPrototype.name = "name";
InputFieldPrototype.size = "15";

InputFieldPrototype.getDomElement = function() {
    var field = document.createElement("input");
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

var MAX_DUMP_DEPTH = 5;

function dumpObj(obj, name, indent, depth) {
    if (depth > MAX_DUMP_DEPTH) {
        return indent + name + ": <Maximum Depth Reached>\n";
    }
    if (typeof obj == "object") {
        var child = null;
        var output = indent + name + "\n";
        indent += "\t";
        for (var item in obj)
        {
            if(!obj.hasOwnProperty(item)) {
                continue;
            }
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            if (typeof child == "object") {
                output += dumpObj(child, item, indent, depth + 1);
            } else {
                output += indent + item + ": " + child + "\n";
            }
        }
        return output;
    } else {
        return obj;
    }
}
