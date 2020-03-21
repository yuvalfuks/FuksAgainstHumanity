$().ready(() => {
    var app = new Vue({
        el: '#app',
        data: {
            Game : {}
        },
        methods: {
            submit : async () => {
                const name = $('input').val();
                let response = await $.post('/login', {
                    nickname : name
                })
                console.log(response)
                document.cookie = {}
                document.cookie.nickname = name
                window.location.href += 'game'
                // tell the user if the nickname is taken
            },
        }
    })
})