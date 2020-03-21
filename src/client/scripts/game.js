$().ready(() => {
    
    var app = new Vue({
        el: '#app',
        data: {
            Game : {},
            myNickname : window.localStorage.getItem('nickname')
        },
        methods: {
            
        }
    })
})