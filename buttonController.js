
/**
 * Manages the interactions with a button.
 *
 * @class StorkUtil.ButtonController
 * @extends StorkCore.StorkController
 * @singleton
 */
var ButtonController = clone(StorkController);
ButtonController.copiedProperty("eventBindings", {});

/**
 * Clone and attach() to element with given 'id'.
 */
ButtonController.cloneWithElementID = function(id) {
    var button = clone(this);
    button.attach(elementByID(id));
    return button;
};


/* overrides superclass method
 * Attach 'element' to this button controller.
 *
 * This controller will manage the button represented by the HTML element and
 * react to events coming from it, before passing on to any listeners or
 * binds.
 */
ButtonController.attach = function(element) {
    if(isString(element)) {
        element = elementByID(element);
    }
    if(!element) {
        throw "Cannot attach to an empty element";
    }
    if(this.myElement) {
        this.detach();
    }
    var my = this;
    this._clickFunc = function(e) {
        if(!my.disabled) {
            my.buttonPressed(e);
            if(my.eventBindings["click"] !== undefined) {
                var bindings = my.eventBindings["click"];
                for(var i=0; i < bindings.length; i++) {
                    var bindingInfo = my.eventBindings["click"][i];
                    var ob = bindingInfo.destination;
                    var method = bindingInfo.method;
                    ob[method](my, "click", e);
                }
            }
        }
    };
    this.myElement = element;
    bean.add(element, 'click', this._clickFunc);
    return this;
};

/**
 *
 * @returns
 */
ButtonController.detach = function() {
    var element = this.myElement;
    if(element) {
        bean.remove(element, "click", this._clickFunc);
    }
    this.myElement = undefined;
    delete this.myElement;
    this.buttonPressed = function() {};
    this.eventBindings = {};
    this.disabled = false;
    return element;
};

/**
 * Called when the button is pressed, and before any bindings.
 */
ButtonController.buttonPressed = function(e) {
};


/**
 * Bind an event to a method of an object.
 *
 * 'eventString' is the name of the event (currently: "click")
 * 'destination' is the object containing the method we are binding to
 * 'method' is the name of the method, as a string,
 *          of 'destination' to call when the event occurs.
 *
 * The method will be called as an actual object call, with 'this' pointing
 * to 'destination'. It will be passed this button object and the eventString
 * as arguments
 *
 * @param {string} eventString
 * @param {HTMLElement} destination
 * @param {Function} method
 */
ButtonController.bind = function(eventString, destination, method) {
    if (this.eventBindings[eventString] == undefined) {
        this.eventBindings[eventString] = [];
    }
    this.eventBindings[eventString].push({destination: destination,
                                          method: method});
};

/**
 *
 */
ButtonController.click = function() {
    if(!this.disabled) {
        bean.fire(this.getElement(), "click");
    }
};

//TODO move to global?
function click(elm) {
    var evt = null;
    if(document.createEvent) {
        evt = document.createEvent('MouseEvents');
    }
    if(elm && elm.dispatchEvent && evt && evt.initMouseEvent) {
        evt.initMouseEvent(
            'click',
            true,     // Click events bubble
            true,     // and they can be cancelled
            document.defaultView,  // Use the default view
            1,        // Just a single click
            0,        // Don't bother with co-ordinates
            0,
            0,
            0,
            false,    // Don't apply any key modifiers
            false,
            false,
            false,
            0,        // 0 - left, 1 - middle, 2 - right
            null);    // Click events don't have any targets other than
        // the recipient of the click
        elm.dispatchEvent(evt);
    }
}
