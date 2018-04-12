function Observer(obj){
    this.data = new Object();
    var realData = new Object();
    Object.keys(obj).forEach(key => {
        realData[key] = obj[key]
        Object.defineProperty(this.data, key, {
            get() {
                console.log(`你访问了${key}`)
                return realData[key]
            },
            set(val) {
                console.log(`你设置了${key}为${val}`)
                realData[key] = val;
            }
        })
    })
    return {data: this.data}
}


let app1 = new Observer({
  name: 'youngwind',
  age: 25
});

let app2 = new Observer({
  university: 'bupt',
  major: 'computer'
});

// 要实现的结果如下：
app1.data.name // 你访问了 name
app1.data.age = 100;  // 你设置了 age，新的值为100
app2.data.university // 你访问了 university
app2.data.major = 'science'  // 你设置了 major，新的值为 science