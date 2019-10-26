var amazonia = {
	apps: []
}

amazonia.etiqueta = class etiqueta{
	constructor(){}
}

amazonia.atributo = class atributo {
	constructor () { }
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
			functMod.call (attribute.$scope.component, asign);
		}
		
		let funct = function () {
			let capturedText;
			eval ('capturedText=' + value);
			return capturedText;
		};

		attribute.getValue = function () {
			return funct.call(attribute.$scope.component);
		}
	}

	sendTemplatePromise (etiqueta) {
		this.templates[etiqueta.nombre] = {
			_template: "",
			status: ""
		}
	}

	_findFrom (arr, attrib, ele) {
		return arr.find ((v) => { 
			 return v.ele.getAttribute (attrib) === ele.getAttribute (attrib) });
	}


	createGenId (idName) {
		if (!this[idName]) {
			this[idName] = 1;
		} else {
			this[idName]++;
		}
		//console.log (this[idName]);
		return this[idName];
	}


	_getFrom (arr, attrib, elemento, createId) {
		//console.log (elemento, elemento.getAttribute (attrib), attrib);
		let encontrado = this._findFrom (arr, attrib, elemento);
		//console.log (encontrado);
		if (!encontrado) {
			elemento.setAttribute (attrib, this.createGenId(createId));
			encontrado = { ele: elemento };
			arr.push (encontrado);
		}

		return encontrado;
	}

	_getAttrib (elemento) {
		return this._getFrom (this.atributosDOM, 'data-am-id', elemento, '_currentAttribId');
	}

	_getDOM (elemento) {
		return this._getFrom (this.elementosDOM, 'data-am-2-id', elemento, '_currentTagId');
	}

	_getChanged (elemento) {
		return this._getFrom (this.alteredDOM, 'data-am-ch-id', elemento, '_currentChangedId');
	}

	

	set controlador (funct) {
		this._controlador = funct;
	}

	changedState (state) {
		
	}

	set state (value) {
		this._state = value;
		this.changedState (this._state);
	}

	get state () {
		return this._state;
	}

	enmascararNotacion(string){
		var regex = /{{([^}]*)}}/g;
		var regex2 = /@([^}]*)@/g;
		var mascara;
		var resultado = "";
		
		while ((mascara = regex2.exec(string)) !== null) {
		   	resultado = eval (mascara[1]);
		   	return resultado;
		}
		var newString = string.replace(regex, (exp, content, offset, text, s) => {
			return eval (content);
		});
		return newString;
	}
	


	asignarVista (objetoDOM, componente) {
		let v = this;
		if (!componente._template) {
			if (v.templates[componente.name]) {
				if (v.templates[componente.name].status == "finished") {
					componente._template = v.templates[component.name];
				} else {

				}
			} else {

			}
			ajax.send (componente.ruta, {}, "get")
			.then ( (xhr) => {
				var elementoAuxiliar = document.createElement("div");
				elementoAuxiliar.innerHTML = xhr.responseText;

				var convertidos = elementoAuxiliar.children;
				
				componente._template = convertidos;
				//reload (componente, objetoDOM);
				//console.log (v);
				v.aplicar();
			})
			.catch (function (data) {
				
			})
		} else {
			reload (componente, objetoDOM);
		}

		function reload (component, objetoDOM) {
			if (!component._init) {
				
				while (objetoDOM.children.length > 0) {
					objetoDOM.removeChild(objetoDOM.children[0]);
				}
				let elementos = [];
				for (var i = 0; i < component._template.length; i++) {
					elementos.push (v.barrido (component._template[i], component));
				}
				
				for (var i = 0; i < elementos.length; i++)
					objetoDOM.appendChild(elementos[i]);
					
				component._init = true;
				if (component.$init) {
					component.$init();
				}
			} else {
				
			}
		}
		
		if (componente._init) {
			componente._init = true;
		}
	}

	getEtiqueta (element) {
		let etiqueta = null;
		for (let i in this.etiquetas) {
			if (element.tagName == this.etiquetas[i].nombre.toUpperCase()) {
				let amObjeto = this._getDOM (element);
				if (amObjeto[element.tagName]) {
					etiqueta = amObjeto[element.tagName];
				} else {
					etiqueta = new this.etiquetas[i].create();
					etiqueta.name = element.tagName;
					etiqueta.app = this;
					amObjeto[element.tagName] = etiqueta;
					
					if (etiqueta.controller) {
						etiqueta.controller();
					}
				}
				
			}
		}
		return etiqueta;
	}

	getAttributes (element) {
		var v = this;
		let attrib = null;
		let turn = [];

		for (var i in this.atributos) {
			for (var j = 0; j < element.attributes.length; j++) {
				
				if (element.attributes.item(j).nodeName == this.atributos[i].nombre) {
					
					let amObjeto = this._getAttrib (element, this.atributos[i].nombre);
					
					if (amObjeto[element.attributes.item(j).nodeName]) {
						attrib = amObjeto[element.attributes.item(j).nodeName];
					} else {
						attrib = this.appendAttribute (element, this.atributos[i], amObjeto, j);
					}
					turn.push (attrib);
				}
			}
		}
		return turn;
	}

	appendAttribute (element, attribute, amObjeto, j) {
		if (typeof (j) == "undefined" || j == null) {
			
			for (let i = 0; i < element.attributes.length; i++) {
				if (element.attributes.item(i).nodeName == attribute.nombre) {
					j = i;
					break;
				}
			}
			if (typeof (j) == "undefined" || j == null)
				return null;
				
		}
		let objeto = amObjeto ? amObjeto : this._getAttrib(element, attribute.nombre);
		
		let attrib = new attribute.create();
		attrib.$initialiced = false;

		attrib.name = element.attributes.item(j).nodeName;
		attrib.element = element;
		attrib.app = this;
		attrib.value = element.attributes.item(j).nodeValue;

		objeto[element.attributes.item(j).nodeName] = attrib;
		
		if (attrib.controller) {
			attrib.controller();
		}
		
		return attrib;
	}

	resetToStart () {
		for (let i in this.alteredDOM) {
			if (this.alteredDOM[i].attrs) {
				for (let j in this.alteredDOM[i].attrs) {
					let attr = this.alteredDOM[i].attrs[j];
					
					this.alteredDOM[i].ele.setAttribute (attr.nodeName, attr.nodeValue);
					
				}
			}
			if (this.alteredDOM[i].childs) {
				for (let j in this.alteredDOM[i].childs) {
					let child = this.alteredDOM[i].childs[j];
					child.child.data = child.value;
				}
			}
		}
	}

	barrido (objetoDOM, componente) {
		let etiqueta = componente;

		
		try {
			let aux = this.getEtiqueta (objetoDOM);
			if (aux) {
				etiqueta = aux;
				this.asignarVista (objetoDOM, etiqueta);

				if (etiqueta.$render)
					etiqueta.$render();
			}

			var v = this;

			let attributes = this.getAttributes (objetoDOM);
			
			if (attributes.length) {
				for (let i in attributes) {
					let attribute = attributes[i];
					if (!attribute.$scope) {
						attribute.$scope = {};
					}
						
					attribute.$scope.component = componente;
					attribute.$scope.element = objetoDOM;
	
					if (!attribute.$initialiced) {
						
						//console.log (attribute.name, attribute.$init);
						if (attribute.$init) {
							attribute.$init();
						}
						attribute.$initialiced = true;
						
					}
					
					if (attribute.$render) {
						attribute.$render();
					}
				}
			}
			
			for (var i = 0; i < objetoDOM.children.length; i++) {
				
				this.barrido(objetoDOM.children[i], etiqueta);
			}
			
		} catch (ex) {
			console.error (ex);
		}
		
		if (typeof (etiqueta) != "undefined") {
			
			for (var j = 0; j < objetoDOM.attributes.length; j++) {
				var strings = [];
				
				strings.push (objetoDOM.attributes.item(j).nodeValue);
				var enmascarados = [];
				var nodeName = objetoDOM.attributes.item(j).nodeName;
				strings.forEach(x => enmascarados.push(this.enmascararNotacion.call(etiqueta, x)));
				if (strings[0] != enmascarados[0]) {
					
					let elemento = this._getChanged(objetoDOM);
					if (!elemento.attrs) {
						elemento.attrs = [];
					}
					let found = elemento.attrs.find ((x) => (x.nodeName == nodeName));
					if (found) {
						found.nodeName = nodeName;
						found.nodeValue = strings[0];
					} else {
						elemento.attrs.push ({ nodeName: nodeName, nodeValue: strings[0] });
					}
					
					objetoDOM.setAttribute(nodeName, enmascarados[0]);
				}
				
			}
			
			let childs = objetoDOM.childNodes;
			let obj = objetoDOM;

			let attributes = this.getAttributes (objetoDOM);
			for (let i = 0; i < childs.length; i++) {
				var strings = [];
				if (childs[i] instanceof Text) {
					
					strings.push (childs[i].data);
					var enmascarados = [];
					strings.forEach(x => enmascarados.push(this.enmascararNotacion.call(etiqueta, x)));
					
					if (strings[0] != enmascarados[0]) {
						let elemento = this._getChanged(objetoDOM);
						if (!elemento.childs) {
							elemento.childs = [];
						}
						let found = elemento.childs.find ((x) => (x.child == childs[i]));
						if (found) {
							found.value = strings[0];
						} else {
							elemento.childs.push ({ child: childs[i], value: strings[0] });
						}
						
						childs[i].data = enmascarados[0];
					}
					
				}
			}
			
		}
		
		
		return objetoDOM;
	}

	aplicar () {
		this.state = amazonia.states.decorating;
		this.resetToStart();
		this.barrido (document.getElementsByTagName("body")[0]);
		this.state = amazonia.states.decorateEnd;
		this.state = amazonia.states.standBy;
		
		
	}

	crear () {
		if (this._controlador)
			this._controlador.apply (this);
	}

	encender () {
		let v = this;
		document.addEventListener("DOMContentLoaded" , function(event) {
			v.crear ();
			v.aplicar ();
		});
	}
}