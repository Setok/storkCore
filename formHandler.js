var FormController = clone(Stork);


FormController.addField = function(fieldElement) {
    var my = this;

    fieldElement.onfocus = function() {
	my.onFocus(fieldElement);
    }
}

FormController.onFocus = function(element) {
    return true;
}