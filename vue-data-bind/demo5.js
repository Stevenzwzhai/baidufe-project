function Emit() {
    this.events = {};
}
Emit.prototype.on = function(name, cb) {
    if (this.events[name]) {
        this.events[name].push(cb)
    } else {
        this.events[name] = [cb];
    }
}
Emit.prototype.fire = function() {
    var names = [].slice.call(arguments, 0, 1)[0].split('.');
    console.log(names)
    names.forEach(function(name) {
        if (this.events[name]) {
            this.events[name].forEach(cb => cb([].slice.call(arguments, 1)));
        } else {
            console.log('no callback to run')
        }
    }, this)

}
Emit.prototype.remove = function(name) {
    if (this.events[name]) {
        delete this.events[name]
    }
}

var eventBus = new Emit();
var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}
Dep.target = null;
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub)
}
Dep.prototype.depend = function(sub) {
    Dep.target.addDep(sub)
}
Dep.prototype.notify = function() {
    this.subs.forEach(function() {
        sub.update();
    })
}
var eventBus = new Emit();

function Observer(obj, path) {
    this.data = obj;
    this.walk(obj, path)
    // this.eventBus = new Emit();
    this.dep = new Dep();
}

Observer.prototype.walk = function(obj, path) {
    Object.keys(obj).forEach(function(key) {
        path = path ? path : key;
        this.convert(key, obj[key], path ? path + key : key)
        if (typeof obj[key] == "object") {
            new Observer(obj[key], path + '.')
        }
    }, this)
}

Observer.prototype.convert = function(key, value, path) {
    console.log(path)
    this.defineReactive(this.data, key, value, path)
}

Observer.prototype.defineReactive = function(obj, key, value, path) {
    var self = this;
    var dep = new Dep();
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            // console.log(`get ${key} : ${value}`)
            Dep.target && dep.addDep(Dep.target);
            return value
        },
        set: function reactiveSetter(newVal) {
            if (value === newVal) {
                // console.log(`set ${key} : ${value}`)
                return
            } else {
                value = newVal
                dep.notify();
                eventBus.fire(path || key, newVal)
                // console.log(`set ${key} : ${value}`)
                if (typeof newVal == "object") {
                    new Observer(newVal)
                }
            }
        }
    })
}
Observer.prototype.$watch = function(key, cb) {
    eventBus.on(key, cb)
}

function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
    this.value = this.get();
}
Watcher.prototype.set = function() {
    this.vm[this.exp] = value
}
Watcher.prototype.get = function(key) {
    Dep.target = this; // 将当前订阅者指向自己
    var value = this.vm[exp]; // 触发getter，添加自己到属性订阅器中
    Dep.target = null; // 添加完毕，重置
    return value;
}
Watcher.prototype.update = function() {
    this.run(); // 属性值变化收到通知
}
Watcher.prototype.run = function() {
    var value = this.get(); // 取到最新值
    var oldVal = this.value;
    if (value !== oldVal) {
        this.value = value;
        this.cb.call(this.vm, value, oldVal); // 执行Compile中绑定的回调，更新视图
    }
}

var directives = {
    model: {
        bind: function() {
            var self = this
            this.on('change', function() {
                self.set(self.el.value)
            })
        },
        update: function(value) {
            this.el.value = value
        }
    },

    text: {
        bind: function() {
            // do nothing
        },
        update: function(value) {
            this.el.textContent = value
        }
    }
}

function Directive(name, el, vm, expression) {
    this.name = name;
    this.el = el;
    this.vm = vm;
    this.expression = expression;
    this.attr = "nodeValue";
    this.update();
}
Directive.prototype._bind = function () {
  var name = this.name
  var descriptor = this.descriptor

  if (this.el && this.el.removeAttribute) {
    this.el.removeAttribute(descriptor.attr || 'v-' + name)
  }

  var def = descriptor.def
  this.update = def.update
  this.bind = def.bind

  if (this.bind) this.bind()

  this._update = function (val) {
    this.update(val)
  }.bind(this)

  var watcher = this._watcher = new Watcher(this.vm, this.expression, this._update)
  this.update(watcher.value)
}

Directive.prototype.set = function (value) {
  this._watcher.set(value)
}

Directive.prototype.on = function (event, handler) {
  this.el.addEventListener(event, handler, false)
}

function Vue(options) {
    this.domRoot = document.querySelector(options.el);
    this.data = new Observer(options.data).data
    this.domRoot.appendChild(new compile(this.domRoot, this))
}
Vue.prototype._bindDir = function (descriptor, node) {
  console.log(descriptor)
  this._directives.push(new Directive(descriptor, this, node))
}

function compile(node, vm) {
    if (node) {
        this.currNode = this.nodeToFragment(node, vm);
        console.log(this.currNode.childNodes)
        this.compileEle(this.currNode, vm)
        console.log(this.currNode.childNodes)
        return this.currNode
    }
}
compile.prototype.nodeToFragment = function(node, vm) {
    var self = this;
    var frag = document.createDocumentFragment();
    var child;
    while (child = node.firstChild) {
        // if(self.isIgnorable(child)){
        // node.removeChild(child);
        // }else{
        frag.appendChild(child);
        // }
        // self.compileElement(child, vm);
        // frag.append(child); // 将所有子节点添加到fragment中
    }
    return frag;
}
compile.prototype.compileEle = function(node, vm) {
    let reg = /\{\{.*\}\}/;
    Array.from(node.childNodes).forEach(function(child) {
        this.compileEle(child, vm)
    }, this)
    if (node.nodeType == 1) {
        if (node.hasAttributes()) {
            let attrs = node.attributes;
            for (var i = 0; i < attrs.length; i++) {
                if (attrs[i].nodeName == "v-model") {
                    // let name = attrs[i].nodeValue;
                    // node.addEventListener('input', function(e) {
                    //     console.log('change')
                    //     eval(`vm.data.${name} = e.target.value;`)
                    // })
                    // let inputValue = vm.data;
                    // name.split('.').forEach(key => {
                    //     inputValue = inputValue[key];
                    // })
                    // node.value = inputValue;
                    // node.removeAttribute('v-model')

                }
            }
        }
    } else if (node.nodeType == 3) {
        let text = node.textContent.trim();
        let exp = parseTextExp(text, vm.data);
        node.textContent = exp
    }
}
function makeNodeLinkFn(dir) {
  return function nodeLinkFn(vm, el) {
    vm._bindDir(dir, el)
  }
}

function parseTextExp(text, data) {
    let regText = /\{\{(.+?)\}\}/g;
    let pieces = text.split(regText);
    let matches = text.match(regText);
    // console.log(pieces, matches, data)
    let result = [];
    pieces.forEach(function(piece) {
        if (matches && matches.indexOf('{{' + piece + '}}') > -1) { //包含模版的项
            let properties = piece.split('.');
            let datas = data;
            properties.forEach(function(value) {
                datas = datas[value];
            });
            result.push(datas);
        } else if (piece) { //正常项
            result.push(piece);
        }
    });
    return result.join('');
    // if (!exp) {
    //   return;
    // }
    // var regObj = /\{(.+?)\}/g;
    // var regArr = /\[(.+?)\]/g;
    // var result = [];
    // if (regObj.test(exp)) {
    //   var subExp = exp.replace(/[\s\{\}]/g, '').split(',');
    //   subExp.forEach(function (sub) {
    //     var key = '"' + sub.split(':')[0].replace(/['"`]/g, '') + ' "';
    //     var value = sub.split(':')[1];
    //     result.push('((' + value + ')?' + key + ':"")')
    //   });
    // } else if (regArr.test(exp)) {
    //   var subExp = exp.replace(/[\s\[\]]/g, '').split(',');
    // }
    // return result.join('+');  // 拼成 (a?"acls ":"")+(b?"bcls ":"")的形式
}