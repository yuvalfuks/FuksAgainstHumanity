$().ready(() => {
    var app = new Vue({
        el: '#app',
        data: {
            message: 'Hello Vue!'
        },
        methods: {
            submit : async () => {
                let response = await $.post('/login', {
                    nickname : $('input').val()
                })
                console.log(response)
                // tell the user if the nickname is taken
            },
        }
    })
})