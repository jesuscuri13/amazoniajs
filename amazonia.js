var amazonia = {
	apps: []
}

amazonia.etiqueta = class etiqueta{
	constructor(){}
}

amazonia.atributo = class atributo {
	constructor () { }
}

amazonia.exceptions = {
	inconsistentParentness: 'There are an inconsistence in parentness',
	inconsistentParentness2: 'There are an inconsistence in parentness2',
	noRouteSelected: 'No rute selected in component',
	notFoundRoute: 'The route have been not found'
}

amazonia.states = {
	standBy: 1,
	decorating: 2,
	decorateEnd: 3
};

amazonia.getQueryVariable = function (variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable) {
			return pair[1];
		}
	}
	return undefined;
 }

amazonia.frame = class frame {
	constructor() {	
		this.etiquetas = [];
		this.atributos = [];
		this.state = amazonia.states.standBy;
		this.elementosDOM = [];
		this.atributosDOM = [];
		this.alteredDOM = [];

		// Los componentes tendrán un ciclo de vida
		this.componentes = [];
		this.templates = [];	
	}

	captureWatch (attribute) {
		let value = attribute.value;

		let functMod = function (asign) {
			let capturedText;
			eval (value + '=' + JSON.stringify(asign));
			return capturedText;
		}
		attribute.asignValue = function (asign) {
			functMod.call (attribute.$scope, asign);
		}
		
		let funct = function () {
			let capturedText;
			eval ('capturedText=' + value);
			return capturedText;
		};

		attribute.getValue = function () {
			return funct.call(attribute.$scope);
		}
	}

	searchInTags (nodeElement) {
		if (!(nodeElement.template instanceof Element)) {
			return;
		}
		for (let i in this.etiquetas) {
			if (this.etiquetas[i].nombre.toUpperCase() == nodeElement.template.tagName) {
				nodeElement.tag = {
					tag: this.etiquetas[i],
					state: 0,
					listeners: []
				};
				nodeElement.toChange = true;
			}
		}
	}
	searchInAttributes (nodeElement) {
		if (!(nodeElement.template instanceof Element)) {
			return;
		}
		for (let i = 0; i < nodeElement.template.attributes.length; i++) {
			let nodeAttribute = nodeElement.template.attributes.item(i).nodeName;
			for (let j in this.atributos) {
				if (this.atributos[j].nombre == nodeAttribute) {
					nodeElement.attributes.push (this.atributos[j]);
					nodeElement.toChange = true;
				}
			}
		}
	}

	searchInNotation (nodeElement) {
		if (nodeElement.template instanceof Text) {
			if (this.maskedNotation (nodeElement.template.data)) {
				nodeElement.toChange = true;
				nodeElement.masked = true;
			}
		} else if (nodeElement.template instanceof Element) {
			for (let i = 0; i < nodeElement.template.attributes.length; i++) {
				let nodeAttribute = nodeElement.template.attributes.item(i);
				if (this.maskedNotation (nodeAttribute.nodeValue)) {
					nodeElement.toChange = true;
					if (!nodeElement.masked) {
						nodeElement.masked = [];
					}
					nodeElement.masked.push (nodeAttribute.nodeName);
				}
			}
		}
	}

	maskedNotation(string){
		var regex = /{{([^}]*)}}/g;
		
		var match = string.match(regex);
		if (match == null || match.length == 0) {
			return null;
		}

		return match;
	}

	enmascararNotacion(string){
		var regex = /{{([^}]*)}}/g;
		
		var newString = string.replace(regex, (exp, content, offset, text, s) => {
			return eval (content);
		});
		return newString;
	}
	
	searchInExisting (nodeElement) {
		this.searchInTags (nodeElement);
		this.searchInAttributes (nodeElement);
		this.searchInNotation (nodeElement);
	}

	aplicar () {
		this.bootstrap (this.tree);
	}

	initialiceNode (nodeElement, scope) {
		
		nodeElement.element = nodeElement.template.cloneNode();
		if (!nodeElement.toChange) {
			return nodeElement;
		}
		if (nodeElement.tag) {
			let tag = nodeElement.tag;
			if (!nodeElement.currentTag) {
				nodeElement.currentTag = new tag.tag.create();
				nodeElement.currentTag.app = this;
				nodeElement.currentTag.nodeElement = nodeElement;
				if (nodeElement.currentTag.controller) {
					nodeElement.currentTag.controller();
				}
			}

			if (tag.tag.ruta) {
				if (tag.state == 2) { // with template
					let clone = tag._template.cloneNode();
					let child;
					while (child = clone.firstChild) {
						clone.removeChild(child);
						nodeElement.children.push (this.map (child, nodeElement));
					}
					if (nodeElement.currentTag.$init) {
						nodeElement.currentTag.$init();
					}
				} else if (tag.state == 0) { // not looking
					tag.state = 1;
					tag.listeners.push (nodeElement);
					ajax.send (tag.tag.ruta, 'get', {})
					.then ((xhr) => {
						tag.state = 3;
						let div = document.createElement ('DIV');
						div.innerHTML = xhr.responseText;
						
						tag._template = div;
						
						for (let i in tag.listeners) {
							let clone = tag._template.cloneNode(true);
							let child;
							while (child = clone.firstChild) {
								clone.removeChild(child);
								tag.listeners[i].children.push (this.map (child, tag.listeners[i]));
							}
							if (tag.listeners[i].currentTag.$init) {
								tag.listeners[i].currentTag.$init();
							}
						}
						this.aplicar();
						tag.state = 2;
					})
					.catch (function (data) {
						console.log (data);
						tag.state = 3;
						throw amazonia.exceptions.notFoundRoute;
					});
				} else if (tag.state == 1) {
					if (tag.listeners.indexOf (nodeElement) < 0) {
						tag.listeners.push (nodeElement);
					}
				}
			} else {
				throw amazonia.exceptions.noRouteSelected;
			}
		}
		if (nodeElement.attributes.length) {
			nodeElement.currentAttributes = [];
			for (let i in nodeElement.attributes) {
				let attrib = new nodeElement.attributes[i].create();
				
				attrib.element = nodeElement.element;
				attrib.nodeElement = nodeElement;
				attrib.$scope = scope;
				attrib.name = nodeElement.attributes[i].nombre;
				attrib.app = this;
				attrib.value = nodeElement.element.getAttribute(nodeElement.attributes[i].nombre);

				nodeElement.currentAttributes[i] = attrib;
				if (nodeElement.currentAttributes[i].controller) {
					nodeElement.currentAttributes[i].controller();
				}
				if (nodeElement.currentAttributes[i].$init) {
					nodeElement.currentAttributes[i].$init();
				}
			}
		}
	}

    bootstrap (nodeElement, scope) {
		
		if (!nodeElement.parent) {
			if (!nodeElement.hasParent) {
				throw amazonia.exceptions.inconsistentParentness;
			}
			if (!nodeElement.element) {
				nodeElement.element = nodeElement.template;
			}
			
		} else {
			if (nodeElement.hasParent) {
				throw amazonia.exceptions.inconsistentParentness2;
			}
			if (!nodeElement.element && !nodeElement.evaluated) {
				
				this.initialiceNode (nodeElement, scope);
				
				if (nodeElement.element instanceof Array) {
					for (let i in nodeElement.element) {
						nodeElement.parent.element.appendChild (nodeElement.element[i]);
					}
				} else {
					nodeElement.parent.element.appendChild (nodeElement.element);
				}
			}
			scope = nodeElement.currentTag || scope;
			this.render (nodeElement, scope);
		}
		for (let i = 0; i < nodeElement.children.length; i++) {
			this.bootstrap (nodeElement.children[i], scope);
		}
	}

	render (nodeElement, scope) {
		if (nodeElement.masked) {
			if (nodeElement.masked instanceof Array) {
				for (let i in nodeElement.masked) {
					nodeElement.element.setAttribute (
						this.enmascararNotacion.call (scope, nodeElement.element.getAttribute (nodeElement.masked[i]))
					);
				}
			} else {
				nodeElement.element.data = this.enmascararNotacion.call (scope, nodeElement.element.data);
			}
		}
		if (nodeElement.tag) {
			if (nodeElement.currentTag.$render) {
				nodeElement.currentTag.$render();
			}
		}
		if (nodeElement.attributes.length) {
			for (let i in nodeElement.currentAttributes) {
				if (nodeElement.currentAttributes[i].$render) {
					nodeElement.currentAttributes[i].$render();
				}
				
			}
		}
	}

	appendNodeElement (nodeElement, child) {
		nodeElement.children.push (child);
		if (child.element) {
			nodeElement.element.appendChild (child.element);
		}
	}

	removeNodeElement (nodeElement, child) {
		let i = nodeElement.children.indexOf (child);
		if ( i !== -1 ) {
			nodeElement.children.splice( i, 1 );
		}
		nodeElement.parent.removeChild (child.element);
	}

	convertNodeToNone (nodeElement) {
		nodeElement.evaluated = true;
		nodeElement.parent.element.removeChild (nodeElement.element);
		nodeElement.children = [];
		nodeElement.element = null;
	}
	

	createNodeElement (node, parent) {
		let newNodeElement = {
			template: node,
			element: null,
			type: typeof (node),
			parent: parent,
			children: [],
			hasParent: !!node.parentNode,
			element: null,
			attributes: [],
			toChange: false,
			masked: null
		}
		this.searchInExisting (newNodeElement);
		return newNodeElement;
	}
	cloneNodeElement (nodeElement, deep) {
		if (!deep) {
			return this.createNodeElement (nodeElement.template, nodeElement.parent);
		} else {
			let clone = this.createNodeElement (nodeElement.template, nodeElement.parent);
			for (let i in nodeElement.children) {
				clone.children.push (this.createNodeElement (nodeElement.children[i].template, clone));
			}
			return clone;
		}
	}
	
	map (node, parent) {
		
		
		let nodeElement = this.createNodeElement (node, parent);
		
		let children = [];
		
		while (node.hasChildNodes()) {
			children.push (node.firstChild);
            node.removeChild(node.firstChild);
		}
		
		for (let i = 0; i < children.length; i++) {
			nodeElement.children.push(this.map (children[i], nodeElement));
		}
		return nodeElement;
	}
    
    capture (node) {
		this.tree = this.map (node, null);
		
    }

	crear () {
		if (this._controlador)
            this._controlador.apply (this);
        this.capture (document.getElementsByTagName ('body')[0]);
	}

	encender () {
		let v = this;
		document.addEventListener("DOMContentLoaded" , function(event) {
			v.crear ();
			v.aplicar ();
		});
	}
}