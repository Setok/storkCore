/**
 * Controller for list widgets with items
 *
 * @class StorkUtil.ListController
 * @extends StorkCore.StorkController
 * @singleton
 */
var ListController = clone(StorkController);

/**
 * @property {Array} itemControllers
 */
ListController.copiedProperty("itemControllers", []);

/**
 * @property {HTMLElement} containerElement
 */
ListController.containerElement = undefined;
/**
 * @property itemControllerProto
 */
ListController.itemControllerProto = undefined;

/**
 * @property {Number} nextItemID
 * The ID for the next item created within this list. Each ID will be
 * unique for the existence of this ListController
 */
ListController.nextItemID = 1;
ListController.nextListID = 1;

/**
 * @property zeroLengthElement
 */
ListController.zeroLengthElement = undefined;

/**
 * Set the element which will contain the items of the list.
 */
ListController.setListContainer = function(element) {
    if(isString(element)) {
        element = elementByID(element);
    }
    this.containerElement = element;
};


/**
 * Set the HTML element to be shown if the list has no items. This can be
 * useful for informational purposes. If this is not set, or is 'undefined',
 * just show an empty list.
 *
 * Visibility of the two elements is controlled thus:
 * If this is set, and the list is empty, the class for the normal list
 * container element (set with setListContainer) will be set to 'hidden'.
 * If the list contains elements, the container element 'hidden' class will
 * be removed, and 'hidden' class added to the element passed into this method.
 */
ListController.setZeroLengthElement = function(element) {
    this.zeroLengthElement = element;
};


/**
 * 'itemController' is the StorkCore object which will be cloned as a
 * controller for each item in the list.
 */
ListController.setItemControllerPrototype = function(itemController) {
    this.itemControllerProto = itemController;
};

ListController.unsetModel = function(){
    for (var i=0; i<this.itemControllers.length;i++){
        this.itemControllers[i].unsetModel();
        this.itemControllers[i].deleted();
    }
};

/**
 * Sets 'listModel' (a ListModel object) to be the model for this list.
 * Each element in the model will be given its own controller, cloned from one
 * set with setItemControllerPrototype() - which must be called before
 * calling this.
 *
 * init() will not be called on this clone.
 *
 * Each item controller will get a StorkModel based on the content of the
 * element of 'listModel'.
 */
ListController.setModel = function(listModel) {
    if(!this.itemControllerProto) {
        throw "You need to set the item controller prototype (setItemControllerPrototype) before calling setModel!";
    }
    if(!this.containerElement) {
        throw "You need to set the list container element (setListContainer) before calling setModel!";
    }

    //remove the listeners to the current model if it exists, it can lead to
    //infinite recursion if resetEvent method is not overriden
    if (this.model){
        this.model.removeListener(this);
        // process the model unsetting
        this.unsetModel();
    }

    this.model = listModel;
    listModel.removeListener(this);
    emptyElement(this.containerElement);
    var itemAmount = listModel.getLength();

    if (this.listID === undefined){
        this.listID=ListController.nextListID;
        ListController.nextListID++;
    }

    this.showOrHideZeroLengthElement();

    this.itemControllers = [];
    for (var i = 0; i < itemAmount; i++) {
        var itemController = clone(this.itemControllerProto);
        //itemController.init();
        //console.log("Model for item " + i + ":", listModel.getItemModel(i));
        itemController.setModel(listModel.getItemModel(i));
        itemController.setListID(this.listID);
        itemController.setListItemID(this.nextItemID);
        itemController.setListModel(listModel);
        this.nextItemID++;
        itemController.createElement(document, this.containerElement);
        itemController.drawed();
        this.itemControllers[i] = itemController;
    }

    listModel.addListener(this);
};


/**
 * Check to see if the zero length element should be shown or not.
 * Show it if it is set, and the length of the list is 0.
 */
ListController.showOrHideZeroLengthElement = function() {
    var itemAmount = this.model.getLength();

    if (this.zeroLengthElement != undefined) {
        if (itemAmount == 0) {
            addClass(this.containerElement, "hidden");
            removeClass(this.zeroLengthElement, "hidden");
        } else {
            removeClass(this.containerElement, "hidden");
            addClass(this.zeroLengthElement, "hidden");
        }
    }
};

/**
 *
 */
ListController.resetEvent = function(listModel) {
    this.setModel(listModel);
};
/**
 *
 */
ListController.sortEvent = function(listModel) {
    var itemControllers=this.itemControllers.slice();
    var sortedControllers=[];
    var i;
    var orderChanged=false;
    for (i=0;i<listModel.length;i++){
        var model=listModel[i];
        for (var j=0;j<itemControllers.length;j++){
            var ctrlr=itemControllers[j];
            if (model==ctrlr.getModel()){
                sortedControllers.push(ctrlr);
                itemControllers.splice(j,1);
                // if j is always 0 then the order hasn't changed
                if (!orderChanged && j!==0){
                    orderChanged=true;
                }
                break;
            }
        }
    }
    // reorder (move nodes to the end in order)
    if (orderChanged===true){
        for (i=0;i<sortedControllers.length;i++){
            this.containerElement.appendChild(sortedControllers[i].getElement());
        }
    }

};

ListController.deleteItemEvent = function(source, item, index) {
    var itemController = this.itemControllers[index];
    if(itemController) {
        this.itemControllers.splice(index, 1);
        itemController.deleted();
        this.showOrHideZeroLengthElement();
    }
};


/**
 * React to 'insertBefore' event coming from model.
 * Clones a new ListItemController based on the set with
 * setItemControllerPrototype() for the newly added item, and then
 * displays the applicable HTML element at the appropriate location in the
 * DOM tree (before the element representing 'index').
 *
 * 'source' is the source ListModel for the change.
 * 'modelItem' is the newly added model representing the new item.
 * 'index' is the index at which it appeared.
 */
ListController.insertBeforeEvent = function(source, modelItem, index) {
     /*console.log("ListController.insertBeforeEvent:", source, modelItem, index);
     console.log(this.itemControllerProto);
     console.log("modelItem: ");
     console.log(modelItem);*/
    var itemController = clone(this.itemControllerProto);
    //itemController.init();
    itemController.setModel(modelItem);
    itemController.setListID(this.listID);
    itemController.setListItemID(this.nextItemID);
    this.nextItemID++;
    var nextController = this.itemControllers[index];
    if(nextController) {
        var nextElement = nextController.getElement();
        /*console.log("insertBeforeEvent - nextController.getElement:");
         console.log(nextElement);*/
        itemController.createElement(document, this.containerElement, nextElement);
        this.itemControllers.splice(index, 0, itemController);
    }
    else {
        /*console.log(this.containerElement);*/
        itemController.createElement(document, this.containerElement);
        this.itemControllers.push(itemController);
    }

    itemController.setListModel(this.model);
    itemController.drawed();
    /*console.log("insertBeforeEvent - itemControllers.length: " +
     this.itemControllers.length);*/

    this.showOrHideZeroLengthElement();
};


/**
 * Controller for list items contained within lists
 *
 * @class StorkUtil.ListItemController
 * @extends StorkCore.StorkController
 * @singleton
 */
var ListItemController = clone(StorkController);

/**
 * @property itemTemplate
 */
ListItemController.itemTemplate = undefined;
/**
 * @property listID
 */
ListItemController.listID = undefined;
/**
 * @property model
 */
ListItemController.model = undefined;
/**
 * @property listModel
 */
ListItemController.listModel = undefined;

/**
 * @property myElement
 * The element representing this item
 */
ListItemController.myElement = undefined;

 /**
  * @property IDPrefix
  * Prefix to use with all IDs inside the DOM sub-tree that this controller
  * is linked to. Each node in the template will be replaced to start with this
  * prefix.
  */
ListItemController.IDPrefix = undefined;
/**
 * @property textProperties
 */
ListItemController.copiedProperty("textProperties", {});
/**
 * @property attrProperties
 */
ListItemController.copiedProperty("attrProperties", {});
/**
 * @property attrMaps
 */
ListItemController.copiedProperty("attrMaps", {});
/**
 * @property propertyMethods
 */
ListItemController.copiedProperty("propertyMethods", {});
/**
 * @property textPropertyMethods
 */
ListItemController.copiedProperty("textPropertyMethods", {});

/**
 * Get the full, actual element ID for the given 'id'. This is formed from
 * an internal prefix, the given id, "_#" and the list ID.
 */
ListItemController.getFullElementID = function(id) {
    return this.IDPrefix + id + "_#" + this.getListItemID();
};


/**
 * The ListModel of which this item's model is a part. Usually set by
 * the ListController.
 */
ListItemController.setListModel = function(listModel) {
    this.listModel = listModel;
};


/**
 * @param {Number} listID the index of the item within the list.
 */
ListItemController.setListID = function(listID) {
    this.listID = listID;
};


/**
 * Return the ID of this item from within the ListModel that it is
 * contained. This ID is unique for each item created under the ListModel
 * it belongs to. Note: it is not the same as the index within that list.
 */

ListItemController.getListID = function() {
    return this.listID;
};

/**
 * 'listID'  - The index of the item within the list.
 */

ListItemController.setListItemID = function(listItemID) {
    this.listItemID = listItemID;

    if (this.myElement) {
        updateNumberIDs(this.myElement, listItemID);
    }
};


/**
 * Return the ID of this item from within the ListModel that it is
 * contained. This ID is unique for each item created under the ListModel
 * it belongs to. Note: it is not the same as the index within that list.
 */
ListItemController.getListItemID = function() {
    return this.listItemID;
};

/**
 *
 */
ListItemController.generateElementID = function(idPart) {
    return this.IDPrefix + idPart + "_#" + this.listItemID;
};

/**
 * Called when ListController has finished drawing this item.
 * Can be used to do extra work for that particular list item.
 * Adds also selection event to controller so if the item is
 * clicked a "listItemSelected" event is emited to listeners.
 */
ListItemController.drawed = function() {
    var element = this.getElement();
    var model = this.model;
    if(element && model) {
        var btn = clone(ButtonController);
        btn.attach(element);
        var my = this;
        btn.buttonPressed = function(e) {
            applyObjectsMethodWithParams(my.listeners, "listItemSelected",
                                         [my, model]);
        };
    }
};

/**
 * Sets the item to use the HTML element 'itemTemplate' as a template for
 * when it will be rendered. 'itemTemplate' will be orphanised from wherever
 * it currently is (ie. it will be removed from its parent).
 *
 * The template should have node IDs, ending with _#n, which will then be
 * linked up to model properties, using linkTextProperty() or similar.
 */
ListItemController.setItemTemplate = function(itemTemplate) {
    if(isString(itemTemplate)) {
        itemTemplate = elementByID(itemTemplate);
    }
    this.itemTemplate = itemTemplate;
};


/**
 * Link a property, which is assumed to be text, from the model of this
 * list item to the content of an element specified with 'idPrefix'.
 * The ID should end with "_#n" after 'idPrefix'.
 */
ListItemController.linkTextProperty = function(modelProperty, idPrefix) {
    this.textProperties[modelProperty] = idPrefix;
};


/**
 * Should replace this with mapping model get() to also worth with methods.
 */
ListItemController.linkTextPropertyMethod = function(modelProperty, idPrefix) {
    this.textPropertyMethods[modelProperty] = idPrefix;
};


/**
 * Links a property from the model of this list item to a HTML attribute
 * from the element with the ID prefixed 'idPrefix', and ending in "_#n".
 *
 * 'attributeName' is the attribute that will be changed, based on the content
 *                 of the model property.
 */
ListItemController.linkAttrProperty = function(modelProperty, idPrefix,
                                               attributeName) {
    this.attrProperties[modelProperty] = {
        idPrefix: idPrefix,
        attribute: attributeName
    };
};


/**
 * Map a set of possible model property values to equivalent values for
 * an attribute with the ID prefixed 'idPrefix', and ending in "_#n".
 *
 * 'modelProperty' is the model property for which values should be checked.
 * 'idPrefix' is the ID prefix of the element we should set the attribute for.
 * 'attrName' is the attribute to be set in the HTML element.
 * 'propertyMap' is an object with each property key matching a possible value
 *               for 'modelProperty' and with the value being the value to set
 *               'attrName'.
 */
ListItemController.mapPropertyToAttr = function(modelProperty, idPrefix,
                                                attrName, propertyMap) {
    this.attrMaps[modelProperty] = {
        idPrefix: idPrefix,
        attrName: attrName,
        propertyMap: propertyMap
    };
};


/**
 * Link changes in 'modelProperty' to a method, that should be set in a clone
 * of this ListItemController.
 *
 * 'elementIDs', if set, is a list of IDs for elements that should be passed
 *               to the method called. In the template (set with
 *               setItemTemplate()) the IDs should be of the form <id>_#n.
 *               The actual elements will be looked up and passed to the method
 *               in its 'elements' argument.
 *
 *               If this is not defiend, 'elements' will not be passed to the
 *               method.
 *
 * The method will be called with either one or two arguments:
 * 'modelProperty' and optionally 'elements', as specified above.
 *
 */
ListItemController.linkPropertyToMethod = function(modelProperty, methodName,
                                                   elementIDs) {

    this.propertyMethods[modelProperty] = {
        idPrefixes: elementIDs,
        method: methodName
    };
};


/**
 * Do a full refresh of the values in the element.
 */
ListItemController.refresh = function() {
    if (this.myElement == undefined) {
        // If the element hasn't been set yet, do nothing.
        return;
    }
    //console.debug("refresh", this.myElement);
    this._refreshTextProperties();
    this._refreshTextPropertyMethods();
    this._refreshAttributesProperties();
    this._refreshMapAttributes();
    this._refreshPropertyMethods();
};
/**
 * @private
 */
ListItemController._refreshTextProperties = function() {
    for (var key in this.textProperties) {
        //console.log("createElement, key: " + key);
        if (this.textProperties[key] != undefined) {
            //console.log("found property: " + key);
            //var elementID = this.textProperties[key] + "_#n";
            var elementID = this.generateElementID(this.textProperties[key]);
            //console.log("createElement, elementID:");
            //console.log(elementID);
            var textContainer = document.getElementById(elementID);
            if (textContainer != null) {
                emptyElement(textContainer);
                var text = this.model.getProperty(key);
                //console.log("createElement - text: " + text);
                textContainer.appendChild(document.createTextNode(text));
            }
        }
    }
};

/**
 * @private
 */
ListItemController._refreshTextPropertyMethods = function() {
    for(var key in this.textPropertyMethods) {
        if (this.textPropertyMethods[key] != undefined) {
            var elementID = this.generateElementID(this.textPropertyMethods[key]);
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
ListItemController._refreshAttributesProperties = function() {
    for (var key in this.attrProperties) {
        if (this.attrProperties[key] != undefined) {
            //console.log("createElement: found attrProperty: " + key);
            var data = this.attrProperties[key];
            //console.log("createElement: data");
            //console.log(data);
            var elementID = this.generateElementID(data["idPrefix"]);
            //console.log("createElement: elementID: " + elementID);
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
ListItemController._refreshMapAttributes = function() {
    for (var key in this.attrMaps) {
        var data = this.attrMaps[key];
        if (this.model.hasProperty(key)) {
            var elementID = this.generateElementID(data["idPrefix"]);
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
 * @private
 */
ListItemController._refreshPropertyMethods = function() {
    for (var key in this.propertyMethods) {
        var elementID, element, i, methodElements, elementName;
        if (this.propertyMethods[key] != undefined) {
            var data = this.propertyMethods[key];
            //console.debug("_refreshPropertyMethods : propertyMethod defined", key, data);

            if (data["idPrefixes"] != undefined) {
                methodElements = {};
                for (i = 0; i < data["idPrefixes"].length; i++) {
                    var elementField = data["idPrefixes"][i];
                    elementID = this.generateElementID(elementField);
                    //console.debug("_refreshPropertyMethods elementID", elementID);
                    element = document.getElementById(elementID);

                    if (element != null) {
                        methodElements[elementField] = element;
                    }
                }

                this[data.method](key, methodElements);
            } else {
                this[data.method](key);
            }
        }
    }
};

/**
 * Reacts to a change of any propert in the model attached to this item.
 */
ListItemController.propertyChangeEvent = function(property, oldValue,
                                                  newValue) {
    // console.log("ListItemController - propertyChangeEvent", property, oldValue, newValue);
    // We're going to be lazy here and just refresh the whole thing.
    // Can be easily optimised when and if performance is an issue.
    this.refresh();
};


/**
 * Removes model from this view. Removes view as listener of model.
 *
 * @param model
 */
ListItemController.unsetModel = function() {
    if (this.model) {
        this.model.removeListener(this);
    }
};


/**
 *
 * @param model
 */
ListItemController.setModel = function(model) {
    if (this.model){
        this.unsetModel();
    }
    this.model = model;
    this.model.addListener(this);
    if (this.myElement != undefined) {
        this.refresh();
    }
};


/**
 * Create the actual HTML element that will match this list item, including
 * the content from the model set up earlier.
 *
 * 'document' is the document to enter the newly created element into, and
 * 'containerElement' is the element that it will be appended to.
 * If 'beforeElement' is defined, the new element should be created right
 * before it, but as a child of 'containerElement'.
 */
ListItemController.createElement = function(document,
                                            containerElement,
                                            beforeElement) {
    //console.log("createElement - listID: " + this.listID);
    this.IDPrefix = "ListItemController" + this.getListID() + ".";
    var newNode = cloneNodeSetIDs(this.itemTemplate,
                                  this.IDPrefix,
                                  this.getListItemID());

    //console.log("createElement - newNode:", newNode, containerElement);
    //console.debug("container in DOM", document.getElementById(containerElement.id) ? true: false);

    if (beforeElement == undefined) {
        containerElement.appendChild(newNode);
    } else {
        containerElement.insertBefore(newNode, beforeElement);
    }

    this.myElement = newNode;

    if (this.model !== undefined) {
        this.refresh();
    }
    /*
     var nodeID = newNode.id;
     nodeID = nodeID.replace("#n", "#" + this.listID);

     newNode.id = nodeID;
     */

    //console.log("createNewElement done");
};


/**
 * Return the element from within the containing element of this list item
 * that matches 'id'.
 * The original 'id' in the HTML will be of the form "<id>_#n". This is
 * mangled upon drawing of this item and thus getContainedElement() should
 * be used to find it.
 *
 * Will work only after createElement() has been called (probably by the
 * list controller).
 */
ListItemController.getContainedElement = function(id) {
    var element;

    element = containedElementByID(this.myElement, this.getFullElementID(id));

    if (element == undefined) {
        throw "Could not find contained element '" + id + "'.";
    }

    return element;
};

/**
 *
 */
ListItemController.deleted = function() {
    if (this.myElement){
        this.myElement.parentNode.removeChild(this.myElement);
    }
};


/**
 * Return the HTML element that represents this item.
 */
ListItemController.getElement = function() {
    return this.myElement;
};


/*****************************************************************************
 * This is a special ListItemController that manages a sub-list within
 * the item. Handy for doing hierarchical lists or groups of lists
 * (sectioned lists).
 *
 * @class StorkUtil.ListOfListsItem
 * @extends StorkUtil.ListItemController
 * @singleton
 *****************************************************************************/
var ListOfListsItem = clone(ListItemController);

/**
 * @property subListController
 */
ListOfListsItem.clonedProperty("subListController", ListController);


/**
 * Get the ListController for the sub-list within this item.
 * This ListController is automatically created when a ListOfListItem is
 * cloned.
 */
ListOfListsItem.getSubListController = function() {
    return this.subListController;
};


/**
 * Set the ID prefix of the HTML element which will be copied and made
 * the parent element of the sub-list items.
 * 'id' is the prefix. In the document it should appear as <id>_#n, which
 *      will be changed for each copy.
 */
ListOfListsItem.setSubListContainerID = function(id) {
    this.subListContainer = id;
};


/**
 * The name of the StorkModel property for this item which contains a
 * ListModel object as its value, and which will be used to populate the
 * sub-list
 */
ListOfListsItem.setSubListModelProperty = function(propertyName) {
    this.subListModelProperty = propertyName;
};


/**
 * Override the normal ListItemController createElement() with one that
 * builds the sub-list.
 */
ListOfListsItem.createElement = function(document, containerElement,
                                         beforeElement) {
    var subListModelProperty;
    var listContainer;

    //console.debug("ListOfListsItem - createElement");
    this.superMethod(ListOfListsItem.createElement, "createElement", document, containerElement, beforeElement);

    listContainer = this.getContainedElement(this.subListContainer);
    this.subListController.setListContainer(listContainer);

    subListModelProperty = this.model.getProperty(this.subListModelProperty);
    this.subListController.setModel(subListModelProperty);
};


//***********************************************************
// * Model for lists
//**********************************************************/

/**
 * Model for lists
 *
 * @class StorkUtil.ListModel
 * @extends StorkCore.StorkModel
 * @singleton
 */
var ListModel = clone(StorkModel);

/**
 * @property {Array} items
 */
ListModel.copiedProperty("items", []);


/**
 * Return number of elements in this list model.
 */
ListModel.getLength = function() {
    return this.items.length;
};


/**
 * Delete an item from the model.
 *
 * Searches through the list for the given item and removes it from the list.
 * Will call 'deleteItemEvent' method of any listeners, if they have
 * implemented that method. The method will be passed, as arguments, this
 * ListModel, the item deleted, and the index of the item deleted.
 */
ListModel.deleteItem = function(item) {
    var index;

    for (index = 0; index < this.items.length; index++) {
        if (this.items[index] === item) {
            // Found item
            return this.deleteIndex(index);
        }
    }

    throw "Could not find item in list";
};


/**
 * Delete an item from the model by index.
 *
 * Will call 'deleteItemEvent' method of any listeners, if they have
 * implemented that method. The method will be passed, as arguments, this
 * ListModel, the item deleted, and the index of the item deleted.
 */
ListModel.deleteIndex = function(index) {
    var i, item;

    item = this.items[index];
    this.items.splice(index, 1);
    for (i=0; i < this.listeners.length; i++) {
        if (this.listeners[i].deleteItemEvent != undefined) {
            this.listeners[i].deleteItemEvent(this, item, index);
        }
    }
};


/**
 * Insert a list item model object, based on 'object',
 * before the one specified in 'index'.
 *
 * @param {Object} object is any Javascript object. Each property of it will be made
 *      into a StorkModel property.
 *
 *      Calls insertBeforeEvent(sourceModel, model, index) for each listener,
 *      where 'sourceModel' is this ListModel, 'model' is the added model and
 *
 * @param {Number} index is the index where it now resides.
 *
 * @return {StorkCore.StorkModel}
 */

ListModel.insertObjectBefore = function(object, index) {
    var model = StorkModel.createFromObject(object);
    this.items.splice(index, 0, model);
    this.informListeners("insertBeforeEvent", [this, model, index]);
    return model;
};


/**
 * Insert a list item model object, based on 'object' to end of list.
 *
 * @param {Object} object is any Javascript object. Each property of it will
 *          be made into a StorkModel property.
 *
 *          Calls insertBeforeEvent(sourceModel, model, index) for each
 *          listener, where 'sourceModel' is this ListModel, 'model' is the
 *          added model
 *
 * @param {Number} index is the index where it now resides.
 */
ListModel.pushObject = function(object) {
    var model = StorkModel.createFromObject(object);
    this.items.push(model);
    this.informListeners("insertBeforeEvent",
                         [this, model, this.items.length-1]);
    return model;
};


/**
 *
 */
ListModel.informListeners = function(eventName, args) {
    for (var i=0; i < this.listeners.length; i++) {
        if(this.listeners[i][eventName] &&
           typeof this.listeners[i][eventName] === 'function') {
            this.listeners[i][eventName].apply(this.listeners[i], args);
        }
    }
};

/**
 * Build the model for this list from an array of objects.
 * Each object in the array becomes a StorkModel with the properties of
 * the object as model properties.
 *
 * 'items'  - An array of objects.
 */
ListModel.setItemsFromArray = function(items) {
    var model;
    this.items = [];
    for (var i = 0; i <  items.length; i++) {
        model = StorkModel.createFromObject(items[i]);
        this.items[i] = model;
    }
    this.informListeners("resetEvent",
                         [this]);
};


/**
 * Return an array representing each item in this ListModel. Each element in
 * the array will be an object with the ListModel item's properties as direct
 * keys in the object (ie. each StorkModel in the ListModel is flattened
 * into a direct object).
 *
 * This is the reverse of setItemsFromArray().
 */
ListModel.getItemsAsArray = function() {
    var ob, model;
    var items = [];

    for (var i = 0; i < this.items.length; i++) {
        model = this.items[i];
        items.push(model.toJSON());
    }

    return items;
};


/**
 * Get the item model for the given 'itemNumber' (an index into the item list).
 */
ListModel.getItemModel = function(itemNumber) {
    return this.items[itemNumber];
};
