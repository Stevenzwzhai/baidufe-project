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
    console.log(this.events)
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
    thiss.subs.push(sub)
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

let app2 = new Observer({
    name: {
        firstName: 'shaofeng',
        lastName: 'liang'
    },
    age: 25
});

app2.$watch('name', function (newName) {
    console.log('我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。')
});

app2.data.name.firstName = 'hahaha';
// 输出：我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。
// app2.data.name.lastName = 'blablabla';
// 输出：我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。