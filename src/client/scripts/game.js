$().ready(() => {
    
    var app = new Vue({
        el: '#app',
        data: {
            Game : {},
            myUser : {},
            myNickname : window.localStorage.getItem('nickname')
        },
        methods: {
            refresh : async () => {
                setInterval(async () => {
                    this.Game = await $.getJSON('/users')
                    myUser = this.Game.users.find(user => user.nickname == this.myNickname)
                    console.log(this.Game)
                }, 200)
            }
        }
    })

    app.refresh()
})