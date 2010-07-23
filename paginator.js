var PaginatorDelegate = clone(Object);

PaginatorDelegate.pageSelected = function(paginator, page) {
    textView = clone(StringView);
    if (page == 1) {
        textView.text("Hello");
    } else {
        textView.text("World");
    }

    paginator.setContentView(textView);
}


var Paginator = clone(StorkView);


Paginator.delegate = PaginatorDelegate;

Paginator.pageCount = 2;

Paginator.showedElement = undefined;

Paginator.contentView = undefined;

Paginator.contentElement = undefined;


Paginator.setContentView = function(view) {
    if (this.contentElement == undefined) {
        // Nothing to show yet
        return;
    }

    if (this.showedElement != undefined) {
        this.contentElement.removeChild(this.showedElement);
    }
    var nextShow = view.getDomElement();
    this.contentElement.appendChild(nextShow);
    this.contentView = view;
    this.showedElement = nextShow;
    return;
}

    
Paginator.handleEvent = function(event) {
    if (! this.delegate) {
        return;
    }

    selectedElement = getTargetElement(event);

    this.delegate.pageSelected(this, selectedElement.id);

    return false;  
}


Paginator.getDomElement = function() {
    var me = this;
    var outerDiv = document.createElement("div");
    var selectionElement = document.createElement("div");
    this.contentElement = document.createElement("div");
    outerDiv.appendChild(selectionElement);
    outerDiv.appendChild(this.contentElement);

    for (i=1; i <= this.pageCount; i++) {
        var link = document.createElement("a");
        link.setAttribute("href", "#");
        link.id = i;
        link.onclick = function(event) {
            return me.handleEvent(event);
        }

        link.appendChild(document.createTextNode(i));

        selectionElement.appendChild(link)
    }

    if (this.delegate != undefined) {
        this.delegate.pageSelected(this, 1);
    }

    return outerDiv;
}

fileLoaded();