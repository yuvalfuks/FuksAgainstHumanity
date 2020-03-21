$().ready(() => {
    var app = new Vue({
        el: '#app',
        data: {
            message: 'Hello Vue!'
        },
        methods: {
            submit : async () => {
                const name = $('input').val();
                let response = await $.post('/login', {
                    nickname : name
                })
                window.localStorage.setItem('nickname', name)
                console.log(window.localStorage.getItem('nickname'))
                window.location.href += 'game'
                // tell the user if the nickname is taken
            },
        }
    })
})