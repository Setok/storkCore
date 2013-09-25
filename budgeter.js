var Controller = clone(Stork);

var nextElementID = 0;

var BudgetModel = clone(Stork);

BudgetModel.categories = [
    {
	name: "Accommodation",
	budgetTotal: "6500",
	lines: [
	    {
		title: "Hotel", 
		budget: "6500"
	    }
	]
    },
    {
	name: "Transport",
	budgetTotal: "2500",
	lines: [
	    {
		title: "Diesel",
		budget: "1500"
	    },
	    {
		title: "Ferries",
		budget: "1000"
	    }
	]
    }
];

var BudgetView = clone(StorkView);


BudgetView.model = BudgetModel;


BudgetView.connectDesign = function(elementID) {
    this.templateID = elementID;
    this.baseElement = document.getElementById(elementID);
    this.budgetTable = document.getElementById(elementID + "_budgetTable");
    categoryRowTemplate = document.getElementById(elementID  + 
					       "_categoryRowTemplate");
    this.categoryRowTemplate = categoryRowTemplate.cloneNode(true);

    // Make the budget row an orphan. We'll clone and use it later.
    this.budgetRowTemplate = document.getElementById(elementID + 
						     "_budgetRowTemplate");
    this.budgetRowTemplate.parentNode.removeChild(this.budgetRowTemplate);
    /*
    categoryTextTemplate = document.getElementByID(elementID +
						"_categoryTextTemplate");
    categoryTotalTemplate = document.getElementByID(elementID +
						    "_categoryTotalTemplate");
    */
}


BudgetView.update = function() {
    categories = this.model.categories;

    emptyElement(this.budgetTable);
    for (i=0; i < categories.length; i++) {
	category = categories[i];
	categoryRow = this.categoryRowTemplate.cloneNode(true);
	cells = categoryRow.getElementsByTagName("td");
	
	// Set the category title and total budgeted sum
	emptyElement(cells[0]);
	emptyElement(cells[cells.length - 1]);
	cells[0].appendChild(document.createTextNode(category.name));
	cells[cells.length - 1].appendChild(document.
					    createTextNode(category.
							   budgetTotal));
	this.budgetTable.appendChild(categoryRow);

	lines = category.lines;
	for (i=0; i < lines.length; i++) {
	    line = lines[i];
	    budgetRow = this.budgetRowTemplate.cloneNode(true);

	    // Add cloned template to document so we can look up the elements
	    // we want to change based on their IDs.
	    this.budgetTable.appendChild(budgetRow);
	    title = document.getElementById(this.templateID + 
					    "_budgetRowTitleTemplate");
	    emptyElement(title);
	    title.appendChild(document.createTextNode(line.title));
	    title.id = "_budgetRowTitle#" + nextElementID;
	    nextElementID++;

	    sum = document.getElementById(this.templateID + 
					  "_budgetRowSumTemplate");
	    sum.value = line.budget;
	    sum.id = "_budgetRowSum#" + nextElementID;
	}
    }
}