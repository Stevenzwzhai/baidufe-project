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
    var name = [].slice.call(arguments, 0, 1);
    if(this.events[name]){
        this.events[name].forEach(cb => cb([].slice.call(arguments, 1)));
    }else{
        console.log('no callback to run')
    }
}
Emit.prototype.remove = function(name){
    if(this.events[name]){
        delete this.events[name]
    }
}

var eventBus = new Emit();
function Observer(obj) {
    this.data = obj;
    this.walk(obj)
    // var realData = new Object();
    // Object.keys(obj).forEach(key => {
    //     realData[key] = obj[key]
    //     Object.defineProperty(this.data, key, {
    //         get() {
    //             console.log(`你访问了${key}`)
    //             return realData[key]
    //         },
    //         set(val) {
    //             console.log(`你设置了${key}为${val}`)
    //             realData[key] = val;
    //             if (val.toString() === "[object Object]") {
    //                 console.log(1)
    //                 new Observer(obj[key]);
    //             }
    //         }
    //     })
    //     if (obj[key].toString() === "[object Object]") {
    //         console.log(2)
    //         new Observer(obj[key])
    //     }
    // })
}

Observer.prototype.walk = function(obj){
    Object.keys(obj).forEach(function (key){
        this.convert(key, obj[key])
        if(typeof obj[key] == "object"){
            new Observer(obj[key])
        }
    }, this)
}

Observer.prototype.convert = function(key, value){
    this.defineReactive(this.data, key, value)
}

Observer.prototype.defineReactive = function(obj, key, value){
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            console.log(`get ${key} : ${value}`)
            return value
        },
        set: function reactiveSetter(newVal) {
            if (value === newVal) {
                console.log(`set ${key} : ${value}`)
                return
            } else {
                value = newVal
                eventBus.fire(key, newVal)
                console.log(`set ${key} : ${value}`)
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

let app1 = new Observer({
         name: 'youngwind',
         age: 25
 });
app1.$watch('age', function(age) {
         console.log(`我的年纪变了，现在已经是：${age}岁了`)
 });

 app1.data.age = 100;
 // app1.data.name = {
 //         lastName: 'liang',
 //         firstName: 'shaofeng'
 // };

 // app1.data.name.lastName;
 // // 这里还需要输出 '你访问了 lastName '
 // app1.data.name.firstName = 'lalala';
 // 这里还需要输出 '你设置了firstName, 新的值为 lalala'