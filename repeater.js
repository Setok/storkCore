var EditableListView = clone(StorkView);

EditableListView.connectDesign = function(repeatedID, addButtonID) {
    var me = this;
    
    this.templateID = repeatedID;
    this.baseElement = document.getElementById(repeatedID);
    this.parent = this.baseElement.parentNode;
    
    // Make the budget row an orphan. We'll clone and
    use it later.
    this.parent.removeChild(this.baseElement);
    
    this.addButton = document.getElementById(addButtonID);
    this.addButton.onclick = function(event) {
        return me.handleAdd(event);
    }
}
    
			
EditableListView.updateIDs(element) {
    id = element.id;
    
}
				
				
EditableListView.handleAdd = function() {
    var newElement = this.baseElement.cloneNode(true);
    this.updateIDs(newElement);
    this.parent.appendChild(newElement);
    //alert("add");
}
						
