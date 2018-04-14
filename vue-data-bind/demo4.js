function Emit(){
    this.events = {};
}
Emit.prototype.on = function(name, cb){
    if(this.events[name]){
        this.events[name].push(cb)
    }else{
        this.events[name] = [cb];
    }
}
Emit.prototype.fire = function(){
    var names = [].slice.call(arguments, 0, 1)[0].split('.');
    console.log(names)
    names.forEach(function(name){
        if(this.events[name]){
            this.events[name].forEach(cb => cb([].slice.call(arguments, 1)));
        }else{
            console.log('no callback to run')
        }
    }, this)
    
}
Emit.prototype.remove = function(name){
    if(this.events[name]){
        delete this.events[name]
    }
}

var eventBus = new Emit();
var uid = 0;
function Dep(){
    this.id = uid++;
    this.subs = [];
}
Dep.target = null;
Dep.prototype.addSub = function(sub){
    this.subs.push(sub)
}
Dep.prototype.depend = function(sub){
    Dep.target.addDep(sub)
}
Dep.prototype.notify = function(){
    this.subs.forEach(function(){
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

Observer.prototype.walk = function(obj, path){
    Object.keys(obj).forEach(function (key){
        path = path ? path : key;
        this.convert(key, obj[key], path ? path+key : key)
        if(typeof obj[key] == "object"){
            new Observer(obj[key], path + '.')
        }
    }, this)
}

Observer.prototype.convert = function(key, value, path){
    console.log(path)
    this.defineReactive(this.data, key, value, path)
}

Observer.prototype.defineReactive = function(obj, key, value, path){
    var self = this;
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            // console.log(`get ${key} : ${value}`)
            return value
        },
        set: function reactiveSetter(newVal) {
            if (value === newVal) {
                // console.log(`set ${key} : ${value}`)
                return
            } else {
                value = newVal
                eventBus.fire(path || key, newVal)
                // console.log(`set ${key} : ${value}`)
                if(typeof newVal == "object"){
                    new Observer(newVal)
                }
            }
        }
    })
}
Observer.prototype.$watch = function(key, cb){
    eventBus.on(key, cb)
}   

function Vue(options){
    this.domRoot = document.querySelector(options.el);
    this.data = new Observer(options.data).data
    this.domRoot.appendChild(new compile(this.domRoot, this))
}

function compile(node, vm){
    if(node){
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
        while(child = node.firstChild) {
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
compile.prototype.compileEle = function(node, vm){
    let reg = /\{\{.*\}\}/;
    Array.from(node.childNodes).forEach(function(child){
        this.compileEle(child, vm)
    }, this)
    if(node.nodeType == 1){
        if(node.hasAttributes()){
            let attrs = node.attributes;
            for(var i = 0; i < attrs.length; i++){
                if(attrs[i].nodeName == "v-model"){
                    let name = attrs[i].nodeValue;
                    node.addEventListener('input', function(e){
                        console.log('change')
                        eval(`vm.data.${name} = e.target.value;`)
                    })
                    let inputValue = vm.data;
                    name.split('.').forEach(key => {
                        inputValue = inputValue[key];
                    })
                    node.value = inputValue;
                    node.removeAttribute('v-model')
                }
            }
        }
    }else if(node.nodeType == 3){
        let text = node.textContent.trim();
        let exp = parseTextExp(text,vm.data);
        node.textContent = exp
    }
}
function parseTextExp(text,data) {
      let regText = /\{\{(.+?)\}\}/g;
      let pieces = text.split(regText);
      let matches = text.match(regText);
      // console.log(pieces, matches, data)
      let result = [];
      pieces.forEach(function (piece) {
          if(matches && matches.indexOf('{{' + piece + '}}') > -1){ //包含模版的项
            let properties = piece.split('.');
            let datas = data;
            properties.forEach(function(value){
              datas = datas[value];
            });
            result.push(datas);
          }else if(piece){ //正常项
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