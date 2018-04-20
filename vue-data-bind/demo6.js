var directives = {
    model: {
        bind: function() {
            var self = this
            this.on('change', function() {
                self.set(self.el.value)
            })
        },
        update: function(value) {
            console.log(value, 1123123123)
            this.el.value = value
        }
    },

    text: {
        bind: function() {
            // do nothing
        },
        update: function(value) {
            console.log(232323, value)
            this.el.textContent = value
        }
    }
}
function replace(target, el) {
    target.parentNode.replaceChild(el, target)
}



//dep.  维护订阅者列表
var depId = 0;

function Dep() {
    this.id = depId++;
    this.subs = [];
}

Dep.target = null;
//添加依赖
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub)
}
//更新订阅者的数据
Dep.prototype.notify = function() {
    this.subs.forEach(function(sub) {
        sub.update();
    })
}
//未知
Dep.prototype.depend = function(sub) {
    Dep.target.addDep(this)
}


//监听数据变化

function observe(data, vm) {
    var ob = null;
    if (data.hasOwnProperty('__ob__')) {
        ob = data.__ob__
    } else {
        ob = new Observer(data)
    }
    if (ob && vm) {
        ob.addVm(vm)
    }
    return vm
}

function Observer(data) {
    this.dep = new Dep();
    this.data = data;
    Object.defineProperty(this, '__ob__', {
        value: this,
        enumerable: false,
        writable: true,
        configurable: true
    })
    this.walk(data)
}
Observer.prototype.walk = function(data) {
    Object.keys(data).forEach(function(key) {
        this.convert(key, data[key])
    }, this)
}

Observer.prototype.convert = function(key, value) {
    defineReactive(this.data, key, value)
}

function defineReactive(data, key, value) {
    var dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
            if (Dep.target) {
                dep.depend()
            }
            return value;
        },
        set: function(val) {
            if (val === value) {
                return;
            } else {
                value = val;
                dep.notify();
            }
        }
    })
}

Observer.prototype.addVm = function(vm) {
    (this.vms || (this.vms = [])).push(vm)
}
//观察值
function Watcher(vm, exp, cb) {
    this.vm = vm
    vm._watchers.push(this)
    this.exp = exp
    this.cb = cb
    this.deps = []
    this.depIds = {}

    this.getter = function(vm) {
        return vm[exp]
    }
    this.setter = function(vm, value) {
        vm[exp] = value
    }
    this.value = this.get()
}

Watcher.prototype.get = function() {
    Dep.target = this;
    var value = this.getter.call(this, this.vm);
    Dep.target = null;
    return value
}
Watcher.prototype.set = function(value){
    this.setter.call(this.vm, this.vm, value)
}
Watcher.prototype.addDep = function(dep){
    var depId = dep.id;
    if(!this.depIds[depId]){
        this.deps.push(dep);
        this.depIds[depId] = true;
        dep.addSub(this)
    }
}
Watcher.prototype.update = function(){
    this.run();
}
Watcher.prototype.run = function() {
    var value = this.get()
    //this.value 是初始化this.get()得到，更新时检测后续有没有重新设置值
    if (this.value !== value) {
        var oldValue = this.value
        this.value = value
        this.cb.call(this.vm, value, oldValue)
    }
}
//指令实现数据的绑定
function Directive(descriptor, vm, el) {
    this.vm = vm
    this.el = el
    this.descriptor = descriptor
    this.name = descriptor.name
    this.expression = descriptor.exp
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
    console.log(this.bind, 'bind')
    this._update = function (val) {
        this.update(val)
    }.bind(this)
    console.log(descriptor)
    var watcher = this._watcher = new Watcher(this.vm, this.expression, this._update)
    this.update(watcher.value)
}
Directive.prototype.set = function (value) {
    this._watcher.set(value)
}
Directive.prototype.on = function (event, handler) {
    this.el.addEventListener(event, handler, false)
}

var regTag = /{{([^{}]+)}}/g
//编译器
function compile(el, options){
    var nodeLinkFn = this.compileNode(el, options)
    var childLinkFn = el.hasChildNodes() ? this.compileNodeList(el.childNodes, options) : null;
    return function link(vm, el){
        var childNodes = [].slice.call(el.childNodes)
        linkAndCapture(function compositeLinkCapturer() {
            if (nodeLinkFn) nodeLinkFn(vm, el)
            if (childLinkFn) childLinkFn(vm, childNodes)
        }, vm)
    }
}
function linkAndCapture(linker, vm) {
    var originalDirCount = vm._directives.length
    linker()
    var dirs = vm._directives.slice(originalDirCount)
    dirs.forEach(function(dir) { dir._bind() })
    return dirs
}

compile.prototype.compileNodeList = function(nodeList, options){
    var linkFns = [];
    var nodeLinkFn, childLInkFn;
    nodeList.forEach(node => {
        nodeLinkFn = this.compileNode(node, options)
        childLinkFn = node.hasChildNodes() ? this.compileNodeList(node.childNodes, options) : null;
        linkFns.push(nodeLinkFn, childLinkFn);
    }, this)
    return linkFns.length ? makeChildLinkFn(linkFns) : null
}

compile.prototype.compileNode = function(node, options){
    if(node.nodeType === 1){
        return this.compileElement(node, options)
    }else if(node.nodeType === 3){
        return this.compileText(node, options)
    }else{
        return null
    }
}

compile.prototype.compileElement = function(el, options){
    console.log(el.tagName)
    if (el.tagName === 'INPUT' && el.hasAttribute('v-model')) {
         var exp = el.getAttribute('v-model').trim()
        return makeNodeLinkFn({
            name: 'model',
            exp: exp,
            def: directives.model
        })
    } else {
        return null
    }  
}
compile.prototype.compileText = function(node, options){
    let tokens = parseText(node.wholeText);
    if(tokens){
        var frag = document.createDocumentFragment();
        tokens.forEach(function(token){
            var te = token.tag ? processTextToken(token) : document.createTextNode(token.value)
            frag.appendChild(te)
        })
        return makeTextNodeLinkFn(tokens, frag)
    }
}
function processTextToken(token) {
    var el = document.createTextNode(' ')
    // 简化，双向绑定，text 模式
    token.descriptor = {
        name: 'text',
        exp: token.value,
        def: directives.text
    }
    return el
}


function parseText(text){
    if(regTag.test(text)){
        var tokens = []
        var index, match, lastIndex = regTag.lastIndex = 0, value
        while(match = regTag.exec(text)){
            index = match.index;
            if(index>lastIndex){
                tokens.push({
                    value:text.slice(lastIndex, index)
                })
            }
                value = match[1]
                tokens.push({
                    tag:true,
                    value: value
                })
                lastIndex = match[0].length+index;
        
            if(lastIndex < text.length){
                tokens.push({
                    value: text.slice(lastIndex, text.length)
                })
            }
        }
        console.log(tokens)
        return tokens
    }else{
        return null
    }
}

//应该是指令绑定
function makeNodeLinkFn(dir) {
    return function nodeLinkFn(vm, el){
        vm._bindDir(dir, el)
    }
}
//子节点双向绑定指令，如v-model
function makeChildLinkFn(linkFns) {
    return function childLinkFn(vm, nodes) {
        var node, nodeLinkFn, childrenLinkFn
        for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
            node = nodes[n]
            nodeLinkFn = linkFns[i++]
            childrenLinkFn = linkFns[i++]
            if (nodeLinkFn) nodeLinkFn(vm, node)
            if (childrenLinkFn) childrenLinkFn(vm, [].slice.call(node.childNodes))
        }
    }
}

function makeTextNodeLinkFn(tokens, frag) {
    return function textNodeLinkFn(vm, el) {
        var fragClone = frag.cloneNode(true)
        var childNodes = [].slice.call(fragClone.childNodes)
        tokens.forEach(function(token, i) {
            var value = token.value
            if (token.tag) {
                var node = childNodes[i]
                vm._bindDir(token.descriptor, node)
            }
        })
        replace(el, fragClone)
    }
}



function Vue(options){
    var el = document.querySelector(options.el)
    this.el = el;
    this.$options = options
    this._directives = []
    this._watchers = []
    this._init()
    new compile(el, this.$options)(this, el)
}
Vue.prototype._init = function(){
    this._initData();
}
Vue.prototype._initData = function(){
    var data = this._data = this.$options.data || {}
    //监控vm.data的变化
    Object.keys(this._data).forEach(function(key){
        this._proxy(key)
    }, this)
    console.log(data)
    observe(data, this)
}
Vue.prototype._proxy = function (key) {
    var self = this
    Object.defineProperty(self, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter() {
            return self._data[key];
        },
        set: function proxySetter(val) {
            self._data[key] = val;
        }
    })
}
Vue.prototype._bindDir = function (descriptor, node) {
  this._directives.push(new Directive(descriptor, this, node))
}